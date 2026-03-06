"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AutoScheduleModal } from "./AutoScheduleModal";
import { ScheduleReviewPanel } from "./ScheduleReviewPanel";
import type { Dictionary } from "@/i18n/dictionaries";

interface RosterActionsProps {
  rosterId: string;
  rosterName: string;
  status: string;
  hasShifts: boolean;
  dictionary: Dictionary["dashboard"]["components"];
}

export function RosterActions({
  rosterId,
  rosterName,
  status,
  hasShifts,
  dictionary,
}: RosterActionsProps) {
  const router = useRouter();
  const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const d = dictionary.rosterActions;

  const handleAutoScheduleSuccess = (jobId: string) => {
    setShowAutoScheduleModal(false);
    setActiveJobId(jobId);
  };

  const handleScheduleApplied = () => {
    setActiveJobId(null);
    router.refresh();
  };

  const handleScheduleRejected = () => {
    setActiveJobId(null);
    // Could show the modal again to regenerate
    setShowAutoScheduleModal(true);
  };

  const canAutoSchedule = status === "DRAFT";

  return (
    <>
      <div className="flex items-center gap-2">
        {canAutoSchedule && (
          <button
            onClick={() => setShowAutoScheduleModal(true)}
            className="bg-forest text-white px-4 py-2 rounded-xl font-medium hover:bg-forest/90 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-magic" />
            {d.aiAutoSchedule}
          </button>
        )}
        <button className="bg-ocean text-white px-4 py-2 rounded-xl font-medium hover:bg-ocean/90 transition-colors flex items-center gap-2">
          <i className="fas fa-plus" />
          {d.addShift}
        </button>
      </div>

      {/* Auto-Schedule Modal */}
      <AutoScheduleModal
        rosterId={rosterId}
        rosterName={rosterName}
        isOpen={showAutoScheduleModal}
        onClose={() => setShowAutoScheduleModal(false)}
        onSuccess={handleAutoScheduleSuccess}
        dictionary={dictionary.autoSchedule}
      />

      {/* Schedule Review Panel */}
      {activeJobId && (
        <ScheduleReviewPanel
          jobId={activeJobId}
          onApply={handleScheduleApplied}
          onReject={handleScheduleRejected}
          onClose={() => setActiveJobId(null)}
          dictionary={dictionary.scheduleReview}
        />
      )}
    </>
  );
}
