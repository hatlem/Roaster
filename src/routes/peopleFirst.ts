// People-First API Routes
// Employee-centric endpoints for culture, recognition, wellness, and team connection

import { Router, Request, Response } from 'express';
import { PeopleFirstService } from '../services/peopleFirstService';
import { authenticate } from '../middleware/authenticate';
import { z } from 'zod';

const router = Router();
const peopleFirstService = new PeopleFirstService();

// All routes require authentication
router.use(authenticate);

// ==========================================
// PERSONAL DASHBOARD
// ==========================================

/**
 * GET /api/people/dashboard
 * Get personalized People-First dashboard for current user
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const locale = req.user!.preferredLocale || 'no';

    const dashboard = await peopleFirstService.getPersonalDashboard(userId, locale);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error fetching personal dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard',
    });
  }
});

// ==========================================
// KUDOS / RECOGNITION
// ==========================================

const sendKudosSchema = z.object({
  toUserId: z.string().uuid(),
  category: z.enum([
    'TEAMWORK',
    'INNOVATION',
    'CUSTOMER_SERVICE',
    'LEADERSHIP',
    'GOING_EXTRA_MILE',
    'PROBLEM_SOLVING',
    'MENTORSHIP',
    'POSITIVE_ATTITUDE',
    'RELIABILITY',
    'OTHER',
  ]),
  message: z.string().min(5).max(500),
  isPublic: z.boolean().optional().default(true),
});

/**
 * POST /api/people/kudos
 * Send kudos to a colleague
 */
router.post('/kudos', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = sendKudosSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.issues,
      });
    }

    const { toUserId, category, message, isPublic } = validation.data;

    const kudos = await peopleFirstService.sendKudos(
      userId,
      toUserId,
      category,
      message,
      isPublic
    );

    res.status(201).json({
      success: true,
      message: 'Kudos sent successfully',
      data: kudos,
    });
  } catch (error: any) {
    console.error('Error sending kudos:', error);
    res.status(error.message === 'Cannot send kudos to yourself' ? 400 : 500).json({
      success: false,
      error: error.message || 'Failed to send kudos',
    });
  }
});

/**
 * POST /api/people/kudos/:id/celebrate
 * Celebrate (like) a kudos
 */
router.post('/kudos/:id/celebrate', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const kudosId = req.params.id;

    const kudos = await peopleFirstService.celebrateKudos(kudosId, userId);

    res.json({
      success: true,
      message: 'Celebration added',
      data: kudos,
    });
  } catch (error) {
    console.error('Error celebrating kudos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to celebrate kudos',
    });
  }
});

// ==========================================
// MOOD CHECK-INS
// ==========================================

const moodCheckInSchema = z.object({
  moodScore: z.number().int().min(1).max(5),
  tags: z.array(z.string()).optional(),
  privateNote: z.string().max(500).optional(),
});

/**
 * POST /api/people/mood
 * Submit a mood check-in
 */
router.post('/mood', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = moodCheckInSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.issues,
      });
    }

    const { moodScore, tags, privateNote } = validation.data;

    const checkIn = await peopleFirstService.submitMoodCheckIn(
      userId,
      moodScore,
      tags,
      privateNote
    );

    res.status(201).json({
      success: true,
      message: 'Mood check-in recorded',
      data: checkIn,
    });
  } catch (error) {
    console.error('Error submitting mood check-in:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record mood check-in',
    });
  }
});

/**
 * GET /api/people/mood/history
 * Get user's mood history
 */
router.get('/mood/history', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;

    const history = await peopleFirstService.getMoodHistory(userId, days);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching mood history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mood history',
    });
  }
});

// ==========================================
// TEAM CALENDAR
// ==========================================

/**
 * GET /api/people/team/today
 * Get who's working today
 */
router.get('/team/today', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const today = new Date();

    const team = await peopleFirstService.getTeamWorkingOn(today, userId);

    res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error('Error fetching team schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team schedule',
    });
  }
});

/**
 * GET /api/people/team/:date
 * Get who's working on a specific date
 */
router.get('/team/:date', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const date = new Date(req.params.date);

    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
      });
    }

    const team = await peopleFirstService.getTeamWorkingOn(date, userId);

    res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error('Error fetching team schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team schedule',
    });
  }
});

// ==========================================
// QUICK ACTIONS
// ==========================================

const trackActionSchema = z.object({
  actionType: z.enum([
    'REQUEST_TIME_OFF',
    'SWAP_SHIFT',
    'CLAIM_OPEN_SHIFT',
    'SEND_KUDOS',
    'VIEW_SCHEDULE',
    'CHECK_BALANCE',
    'CLOCK_IN',
    'CLOCK_OUT',
    'MESSAGE_MANAGER',
    'VIEW_TEAM',
  ]),
});

/**
 * POST /api/people/actions/track
 * Track quick action usage for smart sorting
 */
router.post('/actions/track', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = trackActionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action type',
      });
    }

    await peopleFirstService.trackQuickActionUsage(userId, validation.data.actionType);

    res.json({
      success: true,
      message: 'Action tracked',
    });
  } catch (error) {
    console.error('Error tracking action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track action',
    });
  }
});

// ==========================================
// KUDOS CATEGORIES (for UI)
// ==========================================

/**
 * GET /api/people/kudos/categories
 * Get available kudos categories with labels and emojis
 */
router.get('/kudos/categories', (req: Request, res: Response) => {
  const locale = req.user?.preferredLocale || 'no';

  const categories = [
    { value: 'TEAMWORK', label: locale === 'no' ? 'Samarbeid' : 'Teamwork', emoji: '🤝' },
    { value: 'INNOVATION', label: locale === 'no' ? 'Innovasjon' : 'Innovation', emoji: '💡' },
    { value: 'CUSTOMER_SERVICE', label: locale === 'no' ? 'Kundeservice' : 'Customer Service', emoji: '⭐' },
    { value: 'LEADERSHIP', label: locale === 'no' ? 'Lederskap' : 'Leadership', emoji: '🎯' },
    { value: 'GOING_EXTRA_MILE', label: locale === 'no' ? 'Ekstra innsats' : 'Going Extra Mile', emoji: '🚀' },
    { value: 'PROBLEM_SOLVING', label: locale === 'no' ? 'Problemløsning' : 'Problem Solving', emoji: '🧩' },
    { value: 'MENTORSHIP', label: locale === 'no' ? 'Mentorskap' : 'Mentorship', emoji: '🌱' },
    { value: 'POSITIVE_ATTITUDE', label: locale === 'no' ? 'Positiv holdning' : 'Positive Attitude', emoji: '☀️' },
    { value: 'RELIABILITY', label: locale === 'no' ? 'Pålitelighet' : 'Reliability', emoji: '🏆' },
    { value: 'OTHER', label: locale === 'no' ? 'Annet' : 'Other', emoji: '👏' },
  ];

  res.json({
    success: true,
    data: categories,
  });
});

// ==========================================
// MOOD TAGS (for UI)
// ==========================================

/**
 * GET /api/people/mood/tags
 * Get available mood tags
 */
router.get('/mood/tags', (req: Request, res: Response) => {
  const locale = req.user?.preferredLocale || 'no';

  const tags = locale === 'no' ? [
    'Energisk',
    'Rolig',
    'Stresset',
    'Motivert',
    'Trøtt',
    'Fokusert',
    'Overveldet',
    'Kreativ',
    'Frustrert',
    'Takknemlig',
  ] : [
    'Energized',
    'Calm',
    'Stressed',
    'Motivated',
    'Tired',
    'Focused',
    'Overwhelmed',
    'Creative',
    'Frustrated',
    'Grateful',
  ];

  res.json({
    success: true,
    data: tags,
  });
});

export default router;
