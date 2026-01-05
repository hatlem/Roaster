"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ApprovalActionsProps {
  listingId: string;
}

export function ApprovalActions({ listingId }: ApprovalActionsProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setIsApproving(true);
    setError(null);

    try {
      const res = await fetch(`/api/marketplace/${listingId}/approve`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to approve");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;

    setIsRejecting(true);
    setError(null);

    try {
      const res = await fetch(`/api/marketplace/${listingId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reject");
      }

      setShowRejectModal(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleApprove}
          disabled={isApproving}
          className="px-3 py-1.5 rounded-lg bg-forest text-white text-sm font-medium hover:bg-forest/90 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {isApproving ? (
            <i className="fas fa-spinner fa-spin" />
          ) : (
            <>
              <i className="fas fa-check" />
              Approve
            </>
          )}
        </button>
        <button
          onClick={() => setShowRejectModal(true)}
          className="px-3 py-1.5 rounded-lg border border-terracotta text-terracotta text-sm font-medium hover:bg-terracotta/5 transition-colors flex items-center gap-1"
        >
          <i className="fas fa-times" />
          Reject
        </button>
      </div>

      {error && <p className="text-terracotta text-xs mt-1">{error}</p>}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-display text-xl mb-4">Reject Transfer</h3>
            <p className="text-ink/60 mb-4">
              Please provide a reason for rejecting this shift transfer.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={isRejecting}
                className="px-5 py-2.5 rounded-xl border border-stone/50 font-medium hover:bg-cream transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isRejecting || !rejectReason.trim()}
                className="px-5 py-2.5 rounded-xl bg-terracotta text-white font-medium hover:bg-terracotta/90 transition-colors disabled:opacity-50"
              >
                {isRejecting ? (
                  <i className="fas fa-spinner fa-spin" />
                ) : (
                  "Reject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
