"use client";

import { useState } from "react";

interface ReportExportButtonProps {
  reportType: string;
  format: "csv" | "pdf";
  label: string;
  className?: string;
  icon?: string;
}

export function ReportExportButton({
  reportType,
  format,
  label,
  className = "",
  icon,
}: ReportExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/reports/export?type=${encodeURIComponent(reportType)}&format=${encodeURIComponent(format)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Export failed");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `report-${reportType}-${new Date().toISOString().split("T")[0]}.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert(error instanceof Error ? error.message : "Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`flex items-center gap-2 ${className} ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : icon ? (
        <i className={icon} />
      ) : null}
      {label}
    </button>
  );
}
