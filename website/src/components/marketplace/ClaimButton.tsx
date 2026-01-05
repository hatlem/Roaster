"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ClaimButtonProps {
  listingId: string;
}

export function ClaimButton({ listingId }: ClaimButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/marketplace/${listingId}/claim`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to claim shift");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClaim}
        disabled={isLoading}
        className="w-full py-2.5 rounded-xl bg-forest text-white font-medium hover:bg-forest/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <i className="fas fa-spinner fa-spin" />
            Claiming...
          </>
        ) : (
          <>
            <i className="fas fa-hand-paper" />
            Claim Shift
          </>
        )}
      </button>
      {error && (
        <p className="text-terracotta text-xs mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
