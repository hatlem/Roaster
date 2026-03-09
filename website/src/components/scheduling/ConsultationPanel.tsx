"use client";

import { useState, useEffect, useCallback } from "react";

interface TimelineEvent {
  action: string;
  timestamp: string | null;
  user: { firstName: string; lastName: string; email: string } | null;
}

interface ConsultationData {
  id: string;
  status: string;
  sentForReviewAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewComments: string | null;
  consultationStatus?: string;
  consultationRequestedAt?: string;
  consultationRespondedAt?: string;
  consultationNotes?: string;
  reviewer: { firstName: string; lastName: string; email: string } | null;
  requester: { firstName: string; lastName: string; email: string } | null;
  timeline: TimelineEvent[];
}

interface ConsultationPanelProps {
  rosterId: string;
  rosterStatus: string;
  userRole: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary: any;
}

export function ConsultationPanel({
  rosterId,
  rosterStatus,
  userRole,
  dictionary: d,
}: ConsultationPanelProps) {
  const [data, setData] = useState<ConsultationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [responding, setResponding] = useState(false);
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(rosterStatus);

  const consultation = d?.consultation ?? {};

  const fetchConsultation = useCallback(async () => {
    try {
      const res = await fetch(`/api/rosters/${rosterId}/consultation`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        // Derive status from consultation data
        if (json.data.consultationStatus) {
          setCurrentStatus(json.data.consultationStatus);
        } else if (json.data.reviewedAt) {
          setCurrentStatus("REVIEWED");
        } else if (json.data.sentForReviewAt) {
          setCurrentStatus("IN_REVIEW");
        }
      }
    } catch {
      // Silently fail on initial load
    } finally {
      setLoading(false);
    }
  }, [rosterId]);

  useEffect(() => {
    fetchConsultation();
  }, [fetchConsultation]);

  const handleSendForConsultation = async () => {
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/rosters/${rosterId}/consultation`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to send for consultation");
      }
      setSuccess(consultation.consultationSent || "Consultation requested");
      setCurrentStatus("IN_REVIEW");
      await fetchConsultation();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send for consultation"
      );
    } finally {
      setSending(false);
    }
  };

  const handleRespond = async (approved: boolean) => {
    setResponding(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/rosters/${rosterId}/consultation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved, comments }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to respond");
      }
      setSuccess(
        approved
          ? consultation.approved || "Consultation approved"
          : consultation.rejected || "Changes requested"
      );
      setCurrentStatus(approved ? "APPROVED" : "REJECTED");
      await fetchConsultation();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to respond");
    } finally {
      setResponding(false);
    }
  };

  // Determine the effective consultation status for display
  const effectiveStatus = (() => {
    if (data?.consultationStatus && data.consultationStatus !== "NOT_REQUIRED") {
      return data.consultationStatus;
    }
    if (data?.reviewedAt && data?.reviewComments) {
      return "REVIEWED";
    }
    if (data?.sentForReviewAt) {
      return "IN_CONSULTATION";
    }
    return "NOT_STARTED";
  })();

  const isAdminOrManager = userRole === "ADMIN" || userRole === "MANAGER";
  const isRepresentative = userRole === "REPRESENTATIVE";
  const isDraft = rosterStatus === "DRAFT" && effectiveStatus === "NOT_STARTED";
  const isInReview =
    currentStatus === "IN_REVIEW" || effectiveStatus === "IN_CONSULTATION";
  const isApproved =
    currentStatus === "APPROVED" || effectiveStatus === "APPROVED";
  const isRejected =
    currentStatus === "REJECTED" || effectiveStatus === "REJECTED";
  const isReviewed = effectiveStatus === "REVIEWED";

  const getStatusBadge = () => {
    if (isApproved) {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-forest/10 text-forest border border-forest/20">
          <i className="fas fa-check-circle" />
          {consultation.approved || "Approved"}
        </span>
      );
    }
    if (isRejected) {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-terracotta/10 text-terracotta border border-terracotta/20">
          <i className="fas fa-times-circle" />
          {consultation.rejected || "Changes requested"}
        </span>
      );
    }
    if (isInReview) {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-ocean/10 text-ocean border border-ocean/20">
          <span className="w-1.5 h-1.5 rounded-full bg-ocean animate-pulse" />
          {consultation.pendingReview || "Awaiting review"}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-stone/50 p-6 animate-fade-up delay-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ocean/10 rounded-xl flex items-center justify-center">
            <i className="fas fa-handshake text-ocean" />
          </div>
          <div>
            <h3 className="font-display text-lg">
              {consultation.title || "Works Council Consultation"}
            </h3>
            <p className="text-ink/50 text-sm">
              {consultation.subtitle ||
                "Labor law requires representative consultation before publishing schedules."}
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Legal basis info */}
      <div className="flex flex-wrap gap-3 mb-5 text-xs text-ink/50">
        <span className="flex items-center gap-1">
          <i className="fas fa-gavel" />
          {consultation.legalBasis || "Legal basis"}:
        </span>
        <span className="px-2 py-0.5 bg-cream rounded-full">
          {consultation.legalBasisNO || "AML \u00a710-3"}
        </span>
        <span className="px-2 py-0.5 bg-cream rounded-full">
          {consultation.legalBasisSE || "MBL \u00a711"}
        </span>
        <span className="px-2 py-0.5 bg-cream rounded-full">
          {consultation.legalBasisDE || "BetrVG \u00a787"}
        </span>
        <span className="px-2 py-0.5 bg-cream rounded-full">
          {consultation.legalBasisDK || "Samarbejdsaftalen"}
        </span>
      </div>

      {/* Error / Success messages */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-terracotta/10 border border-terracotta/20 text-terracotta text-sm flex items-center gap-2">
          <i className="fas fa-exclamation-circle" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-xl bg-forest/10 border border-forest/20 text-forest text-sm flex items-center gap-2">
          <i className="fas fa-check-circle" />
          {success}
        </div>
      )}

      {/* Admin/Manager: Send for consultation button */}
      {isAdminOrManager && isDraft && (
        <div>
          <button
            onClick={handleSendForConsultation}
            disabled={sending}
            className="w-full px-5 py-3 rounded-xl bg-ocean text-white font-medium hover:bg-ocean/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <i className="fas fa-spinner fa-spin" />
                {consultation.sendForConsultation || "Send for Consultation"}...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane" />
                {consultation.sendForConsultation || "Send for Consultation"}
              </>
            )}
          </button>
        </div>
      )}

      {/* Admin/Manager: Publish warning when not consulted */}
      {isAdminOrManager &&
        rosterStatus === "DRAFT" &&
        effectiveStatus === "NOT_STARTED" && (
          <div className="mt-4 p-4 rounded-xl bg-terracotta/5 border border-terracotta/20 flex items-start gap-3">
            <div className="w-8 h-8 bg-terracotta/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <i className="fas fa-exclamation-triangle text-terracotta" />
            </div>
            <p className="text-sm text-terracotta/90">
              {consultation.publishWarning ||
                "Publishing without consultation may violate labor law (\u00a710-3 AML)."}
            </p>
          </div>
        )}

      {/* Admin/Manager: Waiting for review */}
      {isAdminOrManager && isInReview && !isApproved && !isRejected && (
        <div className="p-4 rounded-xl bg-ocean/5 border border-ocean/20 flex items-start gap-3">
          <div className="w-8 h-8 bg-ocean/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <i className="fas fa-clock text-ocean animate-pulse" />
          </div>
          <p className="text-sm text-ocean/90">
            {consultation.pendingReview || "Awaiting representative review"}
          </p>
        </div>
      )}

      {/* Representative: Review panel */}
      {isRepresentative && isInReview && !isApproved && !isRejected && !isReviewed && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-ocean/5 border border-ocean/20">
            <p className="text-sm text-ocean/90 font-medium mb-1">
              <i className="fas fa-info-circle mr-1" />
              {consultation.pendingReview ||
                "This roster requires your review before it can be published."}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-2">
              {consultation.commentsLabel || "Comments / Notes"}
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                consultation.commentsPlaceholder || "Add your review notes..."
              }
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean resize-none text-sm"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleRespond(false)}
              disabled={responding}
              className="flex-1 px-5 py-3 rounded-xl border border-terracotta text-terracotta font-medium hover:bg-terracotta/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {responding ? (
                <i className="fas fa-spinner fa-spin" />
              ) : (
                <>
                  <i className="fas fa-times" />
                  {consultation.requestChanges || "Request Changes"}
                </>
              )}
            </button>
            <button
              onClick={() => handleRespond(true)}
              disabled={responding}
              className="flex-1 px-5 py-3 rounded-xl bg-forest text-white font-medium hover:bg-forest/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {responding ? (
                <i className="fas fa-spinner fa-spin" />
              ) : (
                <>
                  <i className="fas fa-check" />
                  {consultation.approveButton || "Approve Roster"}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Show review decision once responded */}
      {(isApproved || isRejected || isReviewed) && data?.reviewedAt && (
        <div
          className={`p-4 rounded-xl border ${
            isApproved
              ? "bg-forest/5 border-forest/20"
              : "bg-terracotta/5 border-terracotta/20"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <i
              className={`fas ${
                isApproved ? "fa-check-circle text-forest" : "fa-times-circle text-terracotta"
              }`}
            />
            <span className="font-medium text-sm">
              {isApproved
                ? consultation.approved || "Consultation approved"
                : consultation.rejected || "Changes requested"}
            </span>
          </div>
          {data.reviewer && (
            <p className="text-xs text-ink/50 mb-1">
              {consultation.reviewedBy || "Reviewed by"}{" "}
              <span className="font-medium text-ink/70">
                {data.reviewer.firstName} {data.reviewer.lastName}
              </span>
              {" \u2014 "}
              {new Date(data.reviewedAt).toLocaleString()}
            </p>
          )}
          {(data.reviewComments || data.consultationNotes) && (
            <p className="text-sm text-ink/70 mt-2 pl-3 border-l-2 border-stone/30">
              {data.consultationNotes || data.reviewComments}
            </p>
          )}
        </div>
      )}

      {/* Timeline */}
      {data?.timeline && data.timeline.length > 0 && (
        <div className="mt-5 pt-5 border-t border-stone/30">
          <h4 className="text-sm font-medium text-ink/60 mb-3 flex items-center gap-2">
            <i className="fas fa-history" />
            {consultation.timeline || "Consultation Timeline"}
          </h4>
          <div className="space-y-3">
            {data.timeline.map((event, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    event.action.includes("APPROVED")
                      ? "bg-forest/10"
                      : event.action.includes("REJECTED")
                        ? "bg-terracotta/10"
                        : "bg-ocean/10"
                  }`}
                >
                  <i
                    className={`fas text-xs ${
                      event.action.includes("APPROVED")
                        ? "fa-check text-forest"
                        : event.action.includes("REJECTED")
                          ? "fa-times text-terracotta"
                          : "fa-paper-plane text-ocean"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink/80">
                    {event.action === "CONSULTATION_REQUESTED"
                      ? consultation.sentBy || "Sent for consultation by"
                      : consultation.reviewedBy || "Reviewed by"}{" "}
                    {event.user && (
                      <span className="text-ink/60">
                        {event.user.firstName} {event.user.lastName}
                      </span>
                    )}
                  </p>
                  {event.timestamp && (
                    <p className="text-xs text-ink/40">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <i className="fas fa-spinner fa-spin text-ocean mr-2" />
          <span className="text-sm text-ink/50">Loading...</span>
        </div>
      )}
    </div>
  );
}
