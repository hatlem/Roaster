"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/i18n/dictionaries";

type EmployeeData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  department: string | null;
  position: string | null;
  employeeNumber: string | null;
  hourlyRate: string;
};

type Props = {
  employee: EmployeeData;
  dictionary: Dictionary["dashboard"]["employees"];
};

export function EditEmployeeForm({ employee, dictionary: d }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phoneNumber: formData.get("phoneNumber"),
      role: formData.get("role"),
      department: formData.get("department"),
      position: formData.get("position"),
      employeeNumber: formData.get("employeeNumber"),
      hourlyRate: formData.get("hourlyRate"),
    };

    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push(`/dashboard/employees/${employee.id}`);
      } else {
        const result = await response.json();
        setError(result.error || d.failedUpdateEmployee);
      }
    } catch {
      setError(d.failedUpdateEmployee);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="relative overflow-hidden mb-8">
        <div className="warm-orb w-[400px] h-[400px] bg-ocean -top-40 -right-40" />

        <div className="relative z-10 animate-fade-up">
          <Link
            href={`/dashboard/employees/${employee.id}`}
            className="text-ocean hover:text-ocean/70 font-medium inline-flex items-center gap-2 mb-6 transition-colors"
          >
            <i className="fas fa-arrow-left text-sm" />
            {d.backToEmployee}
          </Link>

          <h1 className="font-display text-4xl md:text-5xl mb-2">{d.editTitle}</h1>
          <p className="text-ink/60">{d.editSubtitle}</p>
        </div>

        <div className="accent-line mt-6 animate-line-reveal delay-2" />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-terracotta/10 border border-terracotta/30 rounded-xl text-terracotta text-sm animate-fade-up">
          <i className="fas fa-exclamation-circle mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {/* Personal Information */}
        <div className="bg-white rounded-2xl border border-stone/50 overflow-hidden mb-6 card-hover animate-fade-up delay-1">
          <div className="h-1 bg-gradient-to-r from-ocean via-forest to-transparent" />
          <div className="p-6">
            <h2 className="font-display text-xl mb-6 flex items-center gap-2">
              <i className="fas fa-user text-ocean/40 text-sm" />
              {d.personalInformation}
            </h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{d.firstName}</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    defaultValue={employee.firstName}
                    placeholder={d.placeholderFirstName}
                    className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{d.lastName}</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    defaultValue={employee.lastName}
                    placeholder={d.placeholderLastName}
                    className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean transition-shadow"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{d.emailAddress}</label>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={employee.email}
                  placeholder={d.placeholderEmail}
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{d.phoneNumber}</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  defaultValue={employee.phoneNumber || ""}
                  placeholder={d.placeholderPhone}
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean transition-shadow"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div className="bg-white rounded-2xl border border-stone/50 overflow-hidden mb-6 card-hover animate-fade-up delay-2">
          <div className="h-1 bg-gradient-to-r from-terracotta via-gold to-transparent" />
          <div className="p-6">
            <h2 className="font-display text-xl mb-6 flex items-center gap-2">
              <i className="fas fa-briefcase text-terracotta/40 text-sm" />
              {d.employmentDetails}
            </h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{d.role}</label>
                  <select
                    name="role"
                    required
                    defaultValue={employee.role}
                    className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean transition-shadow"
                  >
                    <option value="EMPLOYEE">{d.roleEmployee}</option>
                    <option value="REPRESENTATIVE">{d.roleRepresentative}</option>
                    <option value="MANAGER">{d.roleManager}</option>
                    <option value="ADMIN">{d.roleAdmin}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{d.department}</label>
                  <select
                    name="department"
                    defaultValue={employee.department || ""}
                    className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean transition-shadow"
                  >
                    <option value="">{d.selectDepartment}</option>
                    <option value="Sales">{d.deptSales}</option>
                    <option value="Operations">{d.deptOperations}</option>
                    <option value="Support">{d.deptSupport}</option>
                    <option value="Engineering">{d.deptEngineering}</option>
                    <option value="HR">{d.deptHR}</option>
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{d.position}</label>
                  <input
                    type="text"
                    name="position"
                    defaultValue={employee.position || ""}
                    placeholder={d.placeholderPosition}
                    className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{d.employeeNumberLabel}</label>
                  <input
                    type="text"
                    name="employeeNumber"
                    defaultValue={employee.employeeNumber || ""}
                    placeholder={d.placeholderEmployeeNumber}
                    className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean transition-shadow"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{d.hourlyRate}</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    step="0.01"
                    min="0"
                    defaultValue={employee.hourlyRate || ""}
                    placeholder={d.placeholderHourlyRate}
                    className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean transition-shadow"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 animate-fade-up delay-3">
          <Link
            href={`/dashboard/employees/${employee.id}`}
            className="px-6 py-3 rounded-xl border border-stone/50 font-medium hover:bg-cream transition-colors"
          >
            {d.cancel}
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl bg-ocean text-white font-medium hover:bg-ocean/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin" />
                {d.updating}
              </>
            ) : (
              <>
                <i className="fas fa-save" />
                {d.updateEmployee}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
