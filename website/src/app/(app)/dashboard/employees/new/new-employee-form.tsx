"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/i18n/dictionaries";

type Props = {
  dictionary: Dictionary["dashboard"]["employees"];
};

export function NewEmployeeForm({ dictionary: d }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      role: formData.get("role"),
      department: formData.get("department"),
      employeeNumber: formData.get("employeeNumber"),
      startDate: formData.get("startDate"),
    };

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push("/dashboard/employees");
      }
    } catch {
      console.error("Failed to create employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/dashboard/employees"
          className="text-ocean hover:text-ocean/70 font-medium flex items-center gap-2 mb-4"
        >
          <i className="fas fa-arrow-left" />
          {d.backToEmployees}
        </Link>
        <h1 className="font-display text-4xl mb-2">{d.newTitle}</h1>
        <p className="text-ink/60">{d.newSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
          <h2 className="font-display text-xl mb-6">{d.personalInformation}</h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{d.firstName}</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder={d.placeholderFirstName}
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{d.lastName}</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder={d.placeholderLastName}
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{d.emailAddress}</label>
              <input
                type="email"
                name="email"
                required
                placeholder={d.placeholderEmail}
                className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{d.phoneNumber}</label>
              <input
                type="tel"
                name="phone"
                placeholder={d.placeholderPhone}
                className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
          <h2 className="font-display text-xl mb-6">{d.employmentDetails}</h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{d.role}</label>
                <select
                  name="role"
                  required
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
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
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
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
                <label className="block text-sm font-medium mb-2">{d.employeeNumberLabel}</label>
                <input
                  type="text"
                  name="employeeNumber"
                  placeholder={d.placeholderEmployeeNumber}
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{d.startDate}</label>
                <input
                  type="date"
                  name="startDate"
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-forest/5 rounded-2xl p-6 border border-forest/20 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-envelope text-forest" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{d.invitationEmailTitle}</h3>
              <p className="text-ink/60 text-sm">
                {d.invitationEmailDescription}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/dashboard/employees"
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
                {d.adding}
              </>
            ) : (
              <>
                <i className="fas fa-user-plus" />
                {d.addEmployee}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
