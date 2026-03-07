"use client";

import { useState } from "react";
import Link from "next/link";

interface EmployeeTableProps {
  employees: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    role: string;
    department: string | null;
    employeeNumber: string | null;
  }>;
  dictionary: {
    name: string;
    email: string;
    role: string;
    department: string;
    employeeNumber: string;
    actions: string;
    view: string;
    searchPlaceholder: string;
    showingOf: string;
    noResults: string;
    clearSearch: string;
  };
  locale: string;
}

function getRoleBorderColor(role: string) {
  switch (role) {
    case "ADMIN": return "border-l-terracotta";
    case "MANAGER": return "border-l-ocean";
    case "REPRESENTATIVE": return "border-l-gold";
    default: return "border-l-stone";
  }
}

export function EmployeeTable({ employees, dictionary: d, locale }: EmployeeTableProps) {
  const [query, setQuery] = useState("");

  const filtered = query
    ? employees.filter((e) =>
        (
          (e.firstName || "") +
          " " +
          (e.lastName || "") +
          " " +
          (e.email || "") +
          " " +
          e.role +
          " " +
          (e.department || "")
        )
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : employees;

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="animate-fade-up delay-1">
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={d.searchPlaceholder.replace('{count}', String(employees.length))}
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-stone/50 bg-white font-sans text-sm placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean/50 transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70 transition-colors"
                aria-label={d.clearSearch}
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>
          {query && (
            <p className="text-sm text-ink/50">
              {d.showingOf
                .replace("{count}", String(filtered.length))
                .replace("{total}", String(employees.length))}
            </p>
          )}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone/50 p-12 text-center animate-fade-up delay-2">
          <div className="w-16 h-16 bg-stone/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-search text-ink/30 text-xl" />
          </div>
          <p className="text-ink/60 font-medium">{d.noResults}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone/50 overflow-hidden card-hover animate-fade-up delay-2">
          <table className="w-full">
            <thead className="bg-cream/80 border-b border-stone/50">
              <tr>
                <th className="text-left p-4 font-semibold text-sm uppercase tracking-wide text-ink/50">{d.name}</th>
                <th className="text-left p-4 font-semibold text-sm uppercase tracking-wide text-ink/50">{d.email}</th>
                <th className="text-left p-4 font-semibold text-sm uppercase tracking-wide text-ink/50">{d.role}</th>
                <th className="text-left p-4 font-semibold text-sm uppercase tracking-wide text-ink/50">{d.department}</th>
                <th className="text-left p-4 font-semibold text-sm uppercase tracking-wide text-ink/50">{d.employeeNumber}</th>
                <th className="text-right p-4 font-semibold text-sm uppercase tracking-wide text-ink/50">{d.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((employee) => (
                <tr
                  key={employee.id}
                  className={`border-b border-stone/20 border-l-4 ${getRoleBorderColor(employee.role)} even:bg-cream/30 hover:bg-cream/60 transition-colors duration-200`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        employee.role === "ADMIN"
                          ? "bg-terracotta/10"
                          : employee.role === "MANAGER"
                          ? "bg-ocean/10"
                          : employee.role === "REPRESENTATIVE"
                          ? "bg-gold/10"
                          : "bg-stone/30"
                      }`}>
                        <span className={`font-semibold text-sm ${
                          employee.role === "ADMIN"
                            ? "text-terracotta"
                            : employee.role === "MANAGER"
                            ? "text-ocean"
                            : employee.role === "REPRESENTATIVE"
                            ? "text-gold"
                            : "text-ink/50"
                        }`}>
                          {(employee.firstName?.[0] || employee.email?.[0] || "?").toUpperCase()}{(employee.lastName?.[0] || "").toUpperCase()}
                        </span>
                      </div>
                      <p className="font-medium">{employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : employee.firstName || employee.lastName || employee.email}</p>
                    </div>
                  </td>
                  <td className="p-4 text-ink/60 text-sm">{employee.email}</td>
                  <td className="p-4">
                    <span
                      className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                        employee.role === "ADMIN"
                          ? "bg-terracotta/10 text-terracotta"
                          : employee.role === "MANAGER"
                          ? "bg-ocean/10 text-ocean"
                          : employee.role === "REPRESENTATIVE"
                          ? "bg-gold/10 text-gold"
                          : "bg-stone/30 text-ink/60"
                      }`}
                    >
                      {employee.role}
                    </span>
                  </td>
                  <td className="p-4 text-ink/60 text-sm">{employee.department || "-"}</td>
                  <td className="p-4 text-ink/60 text-sm font-mono">{employee.employeeNumber || "-"}</td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/dashboard/employees/${employee.id}`}
                      className="inline-flex items-center gap-1.5 text-ocean hover:text-ocean/70 font-medium text-sm transition-colors"
                    >
                      {d.view}
                      <i className="fas fa-arrow-right text-xs" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
