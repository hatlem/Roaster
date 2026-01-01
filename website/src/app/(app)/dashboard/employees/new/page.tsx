"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewEmployeePage() {
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
          Back to Employees
        </Link>
        <h1 className="font-display text-4xl mb-2">Add New Employee</h1>
        <p className="text-ink/60">Add a new team member to your organization</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
          <h2 className="font-display text-xl mb-6">Personal Information</h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="John"
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder="Doe"
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                required
                placeholder="john.doe@company.no"
                className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="+47 123 45 678"
                className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
          <h2 className="font-display text-xl mb-6">Employment Details</h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  name="role"
                  required
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="REPRESENTATIVE">Representative</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Department</label>
                <select
                  name="department"
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                >
                  <option value="">Select Department</option>
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                  <option value="Support">Support</option>
                  <option value="Engineering">Engineering</option>
                  <option value="HR">HR</option>
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Employee Number</label>
                <input
                  type="text"
                  name="employeeNumber"
                  placeholder="EMP-001"
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
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
              <h3 className="font-semibold mb-1">Invitation Email</h3>
              <p className="text-ink/60 text-sm">
                The new employee will receive an email invitation to set up their account and access
                their work schedules through the Roaster mobile app.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/dashboard/employees"
            className="px-6 py-3 rounded-xl border border-stone/50 font-medium hover:bg-cream transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl bg-ocean text-white font-medium hover:bg-ocean/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin" />
                Adding...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus" />
                Add Employee
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
