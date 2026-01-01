// Multi-Agent Consensus Routes
// Provides endpoints for consensus-based scheduling decisions
// Users can review, modify, and approve agent recommendations

import { Router } from 'express';
import { z } from 'zod';
import {
  MultiAgentConsensusService,
  TransparentDecision,
  consensusService,
} from '../services/multiAgentConsensusService';
import { authenticate, AuthRequest, canManageRosters } from '../middleware/auth';
import { DecisionType, ShiftProposal, SwapProposal, ScheduleProposal } from '../types/consensus';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =============================================================================
// Validation Schemas
// =============================================================================

const shiftProposalSchema = z.object({
  type: z.literal('shift_assignment'),
  userId: z.string().uuid(),
  shift: z.object({
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    breakMinutes: z.number().min(0).default(0),
    userId: z.string().uuid(),
  }),
  isNew: z.boolean().default(true),
  replacesPreviousAssignment: z.string().uuid().optional(),
});

const swapProposalSchema = z.object({
  type: z.literal('shift_swap'),
  requestingUserId: z.string().uuid(),
  targetUserId: z.string().uuid(),
  shiftToSwap: z.object({
    id: z.string().uuid().optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    breakMinutes: z.number().min(0).default(0),
    userId: z.string().uuid(),
  }),
  shiftToReceive: z.object({
    id: z.string().uuid().optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    breakMinutes: z.number().min(0).default(0),
    userId: z.string().uuid(),
  }),
  reason: z.string().min(1),
});

const scheduleProposalSchema = z.object({
  type: z.literal('schedule_creation'),
  assignments: z.array(z.object({
    userId: z.string().uuid(),
    shift: z.object({
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
      breakMinutes: z.number().min(0).default(0),
      userId: z.string().uuid(),
    }),
  })),
  coverageGoals: z.array(z.object({
    timeSlot: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }),
    minimumEmployees: z.number().min(1),
    preferredEmployees: z.number().min(1).optional(),
    requiredSkills: z.array(z.string()).optional(),
    department: z.string().optional(),
  })).optional().default([]),
});

const consensusRequestSchema = z.object({
  decisionType: z.enum([
    'shift_assignment',
    'schedule_creation',
    'shift_swap',
    'schedule_optimization',
    'conflict_resolution',
    'compliance_override',
  ] as const),
  proposal: z.union([shiftProposalSchema, swapProposalSchema, scheduleProposalSchema]),
  rosterId: z.string().uuid().optional(),
  config: z.object({
    requireUnanimous: z.boolean().optional(),
    majorityThreshold: z.number().min(0.5).max(1).optional(),
    maxDebateRounds: z.number().min(1).max(10).optional(),
    enableCrossEvaluation: z.boolean().optional(),
  }).optional(),
});

const editComponentsSchema = z.object({
  edits: z.array(z.object({
    componentId: z.string().uuid(),
    newScore: z.number().min(0).max(100),
    reason: z.string().min(1),
  })),
});

// =============================================================================
// Routes
// =============================================================================

/**
 * POST /api/consensus/evaluate
 * Get multi-agent consensus on a scheduling decision
 * Returns a quick consensus result
 */
router.post('/evaluate', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const data = consensusRequestSchema.parse(req.body);

    // Convert date strings to Date objects in proposal
    const proposal = convertDatesToObjects(data.proposal);

    const result = await consensusService.getConsensus({
      decisionType: data.decisionType as DecisionType,
      proposal: proposal as any,
      rosterId: data.rosterId,
      config: data.config,
      requestedBy: req.user!.id,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      success: true,
      consensus: result.result,
      auditId: result.auditId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Consensus evaluation error:', error);
    return res.status(500).json({ error: 'Failed to evaluate consensus' });
  }
});

/**
 * POST /api/consensus/evaluate/detailed
 * Get detailed transparent decision for user review
 * Returns full breakdown of each agent's evaluation
 */
router.post('/evaluate/detailed', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const data = consensusRequestSchema.parse(req.body);

    // Convert date strings to Date objects in proposal
    const proposal = convertDatesToObjects(data.proposal);

    const transparentDecision = await consensusService.getTransparentDecision({
      decisionType: data.decisionType as DecisionType,
      proposal: proposal as any,
      rosterId: data.rosterId,
      config: data.config,
      requestedBy: req.user!.id,
    });

    return res.json({
      success: true,
      decision: transparentDecision,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Detailed evaluation error:', error);
    return res.status(500).json({ error: 'Failed to get detailed evaluation' });
  }
});

/**
 * POST /api/consensus/evaluate/shift
 * Convenience endpoint for evaluating a single shift assignment
 */
router.post('/evaluate/shift', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const shiftData = z.object({
      rosterId: z.string().uuid(),
      userId: z.string().uuid(),
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
      breakMinutes: z.number().min(0).default(0),
    }).parse(req.body);

    const proposal: ShiftProposal = {
      type: 'shift_assignment',
      userId: shiftData.userId,
      shift: {
        startTime: new Date(shiftData.startTime),
        endTime: new Date(shiftData.endTime),
        breakMinutes: shiftData.breakMinutes,
        userId: shiftData.userId,
      },
      isNew: true,
    };

    const transparentDecision = await consensusService.getTransparentDecision({
      decisionType: 'shift_assignment',
      proposal,
      rosterId: shiftData.rosterId,
      requestedBy: req.user!.id,
    });

    return res.json({
      success: true,
      decision: transparentDecision,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Shift evaluation error:', error);
    return res.status(500).json({ error: 'Failed to evaluate shift' });
  }
});

/**
 * POST /api/consensus/evaluate/swap
 * Convenience endpoint for evaluating a shift swap
 */
router.post('/evaluate/swap', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const swapData = z.object({
      rosterId: z.string().uuid(),
      requestingUserId: z.string().uuid(),
      targetUserId: z.string().uuid(),
      requestedShiftId: z.string().uuid(),
      offeredShiftId: z.string().uuid(),
      reason: z.string().min(1),
    }).parse(req.body);

    // TODO: Fetch actual shift details from database
    // For now, create placeholder - in real implementation, fetch shifts

    return res.status(501).json({
      error: 'Not implemented',
      message: 'Please use /evaluate/detailed with full swap proposal',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Swap evaluation error:', error);
    return res.status(500).json({ error: 'Failed to evaluate swap' });
  }
});

/**
 * POST /api/consensus/decisions/:id/edit
 * Apply user edits to a transparent decision
 */
router.post('/decisions/:id/edit', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const { edits } = editComponentsSchema.parse(req.body);

    // In a real implementation, you would:
    // 1. Fetch the decision from a database/cache
    // 2. Apply the edits
    // 3. Save the updated decision
    // For now, we'll demonstrate the pattern

    // This would typically be stored in a cache or database
    const decision = req.body.decision as TransparentDecision;

    if (!decision) {
      return res.status(400).json({
        error: 'Decision data required',
        message: 'Please include the decision object in the request body',
      });
    }

    const updatedDecision = await consensusService.applyUserEdits(decision, edits);

    return res.json({
      success: true,
      decision: updatedDecision,
      message: `Applied ${edits.length} edits. Consensus recalculated.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Edit decision error:', error);
    return res.status(500).json({ error: 'Failed to apply edits' });
  }
});

/**
 * POST /api/consensus/decisions/:id/approve
 * Approve a consensus decision and execute the action
 */
router.post('/decisions/:id/approve', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const { decision, executeAction } = req.body;

    if (!decision) {
      return res.status(400).json({ error: 'Decision data required' });
    }

    // Log the approval
    // In a real implementation, you would:
    // 1. Create the shift/schedule based on the approved decision
    // 2. Update the decision status
    // 3. Create audit log entry

    return res.json({
      success: true,
      message: 'Decision approved',
      decisionId: decision.id,
      status: 'approved',
      executedAction: executeAction || false,
    });
  } catch (error) {
    console.error('Approve decision error:', error);
    return res.status(500).json({ error: 'Failed to approve decision' });
  }
});

/**
 * POST /api/consensus/decisions/:id/reject
 * Reject a consensus decision
 */
router.post('/decisions/:id/reject', canManageRosters, async (req: AuthRequest, res) => {
  try {
    const { decision, reason, requestAlternative } = req.body;

    if (!decision) {
      return res.status(400).json({ error: 'Decision data required' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason required' });
    }

    // Log the rejection
    // In a real implementation, you would:
    // 1. Update the decision status
    // 2. Create audit log entry
    // 3. Optionally trigger alternative suggestion

    return res.json({
      success: true,
      message: 'Decision rejected',
      decisionId: decision.id,
      status: 'rejected',
      reason,
      alternativeRequested: requestAlternative || false,
    });
  } catch (error) {
    console.error('Reject decision error:', error);
    return res.status(500).json({ error: 'Failed to reject decision' });
  }
});

/**
 * GET /api/consensus/agents
 * Get information about available agents and their personas
 */
router.get('/agents', async (req: AuthRequest, res) => {
  try {
    const agents = [
      {
        role: 'compliance',
        name: 'Compliance Guardian',
        description: 'Norwegian Labor Law Expert specializing in Arbeidsmiljøloven compliance',
        expertise: [
          'Rest period requirements (11h daily, 35h weekly)',
          'Working hours limits (9h daily, 40h weekly)',
          'Overtime regulations',
          '14-day publication rule',
        ],
        weight: 1.5,
      },
      {
        role: 'cost_optimizer',
        name: 'Budget Analyst',
        description: 'Labor cost optimization specialist focused on efficient resource allocation',
        expertise: [
          'Labor cost calculation',
          'Overtime cost analysis',
          'Budget compliance',
          'Cost efficiency optimization',
        ],
        weight: 1.0,
      },
      {
        role: 'employee_advocate',
        name: 'Employee Advocate',
        description: 'Champion for employee wellbeing, preferences, and work-life balance',
        expertise: [
          'Employee preference matching',
          'Work-life balance assessment',
          'Burnout prevention',
          'Fair workload distribution',
        ],
        weight: 1.2,
      },
      {
        role: 'operations',
        name: 'Operations Expert',
        description: 'Operational efficiency specialist ensuring adequate coverage and service quality',
        expertise: [
          'Staff coverage analysis',
          'Skill-shift matching',
          'Peak hour management',
          'Operational continuity',
        ],
        weight: 1.0,
      },
    ];

    return res.json({ agents });
  } catch (error) {
    console.error('Get agents error:', error);
    return res.status(500).json({ error: 'Failed to get agent information' });
  }
});

// =============================================================================
// Helper Functions
// =============================================================================

function convertDatesToObjects(proposal: any): any {
  if (!proposal) return proposal;

  const converted = { ...proposal };

  // Convert shift dates
  if (converted.shift) {
    converted.shift = {
      ...converted.shift,
      startTime: new Date(converted.shift.startTime),
      endTime: new Date(converted.shift.endTime),
    };
  }

  // Convert shiftToSwap and shiftToReceive dates
  if (converted.shiftToSwap) {
    converted.shiftToSwap = {
      ...converted.shiftToSwap,
      startTime: new Date(converted.shiftToSwap.startTime),
      endTime: new Date(converted.shiftToSwap.endTime),
    };
  }
  if (converted.shiftToReceive) {
    converted.shiftToReceive = {
      ...converted.shiftToReceive,
      startTime: new Date(converted.shiftToReceive.startTime),
      endTime: new Date(converted.shiftToReceive.endTime),
    };
  }

  // Convert assignments dates
  if (converted.assignments) {
    converted.assignments = converted.assignments.map((a: any) => ({
      ...a,
      shift: {
        ...a.shift,
        startTime: new Date(a.shift.startTime),
        endTime: new Date(a.shift.endTime),
      },
    }));
  }

  // Convert coverageGoals dates
  if (converted.coverageGoals) {
    converted.coverageGoals = converted.coverageGoals.map((g: any) => ({
      ...g,
      timeSlot: {
        start: new Date(g.timeSlot.start),
        end: new Date(g.timeSlot.end),
      },
    }));
  }

  return converted;
}

export { router as consensusRoutes };
