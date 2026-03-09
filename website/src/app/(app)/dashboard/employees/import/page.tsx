"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ValidRow {
  row: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string;
  position?: string;
  employeeNumber?: string;
  hourlyRate?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ValidationResult {
  valid: ValidRow[];
  errors: ValidationError[];
  totalRows: number;
  validCount: number;
  errorCount: number;
}

type ImportState = "idle" | "validating" | "validated" | "importing" | "success" | "error";

export default function ImportEmployeesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      setErrorMessage("Please select a CSV file");
      setState("error");
      return;
    }

    setFile(selectedFile);
    setState("validating");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/employees/import?dryRun=true", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Validation failed");
        setState("error");
        return;
      }

      setResult(data.data);
      setState("validated");
    } catch {
      setErrorMessage("Failed to validate CSV file");
      setState("error");
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!file) return;

    setState("importing");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/employees/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Import failed");
        setState("error");
        return;
      }

      setImportedCount(data.data.imported);
      setState("success");

      setTimeout(() => {
        router.push("/dashboard/employees");
      }, 2000);
    } catch {
      setErrorMessage("Failed to import employees");
      setState("error");
    }
  }, [file, router]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setFile(null);
    setResult(null);
    setErrorMessage("");
    setImportedCount(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="relative overflow-hidden mb-8 animate-fade-up">
        <div className="warm-orb w-[350px] h-[350px] bg-terracotta -top-32 -right-32" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <Link
              href="/dashboard/employees"
              className="text-sm text-ink/50 hover:text-ink transition-colors mb-2 inline-flex items-center gap-1"
            >
              <i className="fas fa-arrow-left text-xs" />
              Back to Employees
            </Link>
            <h1 className="font-display text-4xl md:text-5xl mb-2">Import Employees</h1>
            <p className="text-ink/60">
              Upload a CSV file to import multiple employees at once
            </p>
          </div>
          <a
            href="/api/employees/import/template"
            className="bg-white text-ink border border-stone/50 px-6 py-3 rounded-xl font-semibold hover:bg-cream/50 transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2"
          >
            <i className="fas fa-download" />
            Download Template
          </a>
        </div>
        <div className="accent-line mt-6 animate-line-reveal delay-2" />
      </div>

      {/* Upload Area */}
      {(state === "idle" || state === "error") && (
        <div className="animate-fade-up delay-2">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative bg-white rounded-2xl p-16 border-2 border-dashed text-center cursor-pointer
              transition-all duration-200 overflow-hidden
              ${isDragging ? "border-ocean bg-ocean/5 scale-[1.01]" : "border-stone/50 hover:border-ocean/50 hover:bg-cream/30"}
            `}
          >
            <div className="warm-orb w-[300px] h-[300px] bg-forest top-[-100px] left-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="w-20 h-20 border-2 border-dashed border-ocean/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-14 h-14 bg-ocean/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-file-csv text-ocean text-2xl" />
                </div>
              </div>
              <p className="text-ink/70 text-lg mb-2">
                Drag & drop a CSV file here, or click to browse
              </p>
              <p className="text-ink/40 text-sm">
                Supports .csv files with employee data
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          {state === "error" && errorMessage && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <i className="fas fa-exclamation-circle text-red-500" />
              <p className="text-red-700">{errorMessage}</p>
              <button onClick={reset} className="ml-auto text-red-500 hover:text-red-700 text-sm font-medium">
                Try again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Validating State */}
      {state === "validating" && (
        <div className="bg-white rounded-2xl p-16 border border-stone/50 text-center animate-fade-up">
          <div className="w-16 h-16 border-4 border-ocean/20 border-t-ocean rounded-full animate-spin mx-auto mb-6" />
          <p className="text-ink/70 text-lg">Validating...</p>
          <p className="text-ink/40 text-sm mt-1">{file?.name}</p>
        </div>
      )}

      {/* Importing State */}
      {state === "importing" && (
        <div className="bg-white rounded-2xl p-16 border border-stone/50 text-center animate-fade-up">
          <div className="w-16 h-16 border-4 border-forest/20 border-t-forest rounded-full animate-spin mx-auto mb-6" />
          <p className="text-ink/70 text-lg">Importing...</p>
          <p className="text-ink/40 text-sm mt-1">Creating employee accounts</p>
        </div>
      )}

      {/* Success State */}
      {state === "success" && (
        <div className="bg-white rounded-2xl p-16 border border-stone/50 text-center animate-fade-up">
          <div className="w-20 h-20 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-check-circle text-forest text-3xl" />
          </div>
          <h2 className="font-display text-2xl mb-2">Import Successful</h2>
          <p className="text-ink/60">
            Successfully imported {importedCount} employees
          </p>
          <p className="text-ink/40 text-sm mt-2">Redirecting to employee list...</p>
        </div>
      )}

      {/* Validation Results */}
      {state === "validated" && result && (
        <div className="space-y-6 animate-fade-up delay-2">
          {/* Summary */}
          <div className="flex gap-4">
            <div className="flex-1 bg-white rounded-2xl p-6 border border-stone/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-forest/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-forest" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-forest">{result.validCount}</p>
                  <p className="text-ink/50 text-sm">valid rows</p>
                </div>
              </div>
            </div>
            {result.errorCount > 0 && (
              <div className="flex-1 bg-white rounded-2xl p-6 border border-stone/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-times text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{result.errorCount}</p>
                    <p className="text-ink/50 text-sm">errors</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex-1 bg-white rounded-2xl p-6 border border-stone/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-ocean/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-file-lines text-ocean" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-ocean">{result.totalRows}</p>
                  <p className="text-ink/50 text-sm">total rows</p>
                </div>
              </div>
            </div>
          </div>

          {/* Errors Table */}
          {result.errors.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-stone/30 bg-red-50/50">
                <h3 className="font-semibold text-red-800 flex items-center gap-2">
                  <i className="fas fa-exclamation-triangle text-red-500" />
                  Errors ({result.errors.length})
                </h3>
                <p className="text-red-600/70 text-sm mt-1">These rows will be skipped during import</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-ink/50 border-b border-stone/30">
                      <th className="px-6 py-3 font-medium">Row</th>
                      <th className="px-6 py-3 font-medium">Field</th>
                      <th className="px-6 py-3 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((err, i) => (
                      <tr key={i} className="border-b border-stone/20 last:border-0 bg-red-50/30">
                        <td className="px-6 py-3 text-sm font-mono">{err.row}</td>
                        <td className="px-6 py-3 text-sm font-medium">{err.field}</td>
                        <td className="px-6 py-3 text-sm text-red-600">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Valid Rows Table */}
          {result.valid.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-stone/30 bg-forest/5">
                <h3 className="font-semibold text-forest flex items-center gap-2">
                  <i className="fas fa-check-circle text-forest" />
                  Ready to Import ({result.validCount})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-ink/50 border-b border-stone/30">
                      <th className="px-6 py-3 font-medium">Row</th>
                      <th className="px-6 py-3 font-medium">Name</th>
                      <th className="px-6 py-3 font-medium">Email</th>
                      <th className="px-6 py-3 font-medium">Role</th>
                      <th className="px-6 py-3 font-medium">Department</th>
                      <th className="px-6 py-3 font-medium">Position</th>
                      <th className="px-6 py-3 font-medium">Employee #</th>
                      <th className="px-6 py-3 font-medium">Hourly Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.valid.map((row, i) => (
                      <tr key={i} className="border-b border-stone/20 last:border-0 hover:bg-cream/30 transition-colors">
                        <td className="px-6 py-3 text-sm font-mono">{row.row}</td>
                        <td className="px-6 py-3 text-sm font-medium">
                          {row.firstName} {row.lastName}
                        </td>
                        <td className="px-6 py-3 text-sm text-ink/70">{row.email}</td>
                        <td className="px-6 py-3">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-ocean/10 text-ocean">
                            {row.role}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-ink/70">{row.department || "-"}</td>
                        <td className="px-6 py-3 text-sm text-ink/70">{row.position || "-"}</td>
                        <td className="px-6 py-3 text-sm font-mono text-ink/70">{row.employeeNumber || "-"}</td>
                        <td className="px-6 py-3 text-sm text-ink/70">{row.hourlyRate || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            {result.validCount > 0 && (
              <button
                onClick={handleImport}
                className="bg-ocean text-white px-8 py-3 rounded-xl font-semibold hover:bg-ocean/90 transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2"
              >
                <i className="fas fa-file-import" />
                Import {result.validCount} employees
              </button>
            )}
            <button
              onClick={reset}
              className="bg-white text-ink border border-stone/50 px-6 py-3 rounded-xl font-semibold hover:bg-cream/50 transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              <i className="fas fa-redo" />
              Upload Different File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
