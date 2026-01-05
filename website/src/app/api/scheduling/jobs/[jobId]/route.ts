import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAutoScheduleJob } from "@/services/autoSchedulerService";
import { getConsensusDecision } from "@/services/consensus/multiAgentConsensusService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const job = await getAutoScheduleJob(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get consensus decision if available
    let consensusDetails = null;
    if (job.consensusDecisionId) {
      consensusDetails = await getConsensusDecision(job.consensusDecisionId);
    }

    return NextResponse.json({
      id: job.id,
      rosterId: job.rosterId,
      priorityMode: job.priorityMode,
      status: job.status,
      generatedShifts: job.generatedShifts,
      metrics: job.metrics,
      consensusScore: job.consensusScore,
      consensusDetails: consensusDetails
        ? {
            status: consensusDetails.consensusStatus,
            finalDecision: consensusDetails.finalDecision,
            summary: consensusDetails.summary,
            keyReasons: consensusDetails.keyReasons,
            remainingConcerns: consensusDetails.remainingConcerns,
            conditions: consensusDetails.conditions,
            agentEvaluations: consensusDetails.agentEvaluations.map((e) => ({
              agentName: e.agentName,
              recommendation: e.recommendation,
              score: e.score,
              reasoning: e.reasoning,
              concerns: e.concerns,
              suggestions: e.suggestions,
            })),
          }
        : null,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      appliedAt: job.appliedAt,
      rejectedAt: job.rejectedAt,
    });
  } catch (error) {
    console.error("Get job error:", error);
    return NextResponse.json(
      { error: "Failed to get job status" },
      { status: 500 }
    );
  }
}
