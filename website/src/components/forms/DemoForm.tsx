"use client";

import { useState, type FormEvent } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { pricing } from "@/content";

interface DemoFormProps {
  dictionary: Dictionary;
}

export function DemoForm({ dictionary }: DemoFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    // Simulate submission delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-check text-forest text-2xl" />
        </div>
        <h3 className="font-display text-2xl mb-2">{dictionary.forms.youreIn}</h3>
        <p className="text-ink/60">
          {dictionary.forms.checkEmailForTrial.replace('{days}', String(pricing.trial.days))}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium mb-2">
            {dictionary.forms.firstName} *
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            required
            className="w-full px-4 py-3 rounded-xl border border-stone focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium mb-2">
            {dictionary.forms.lastName} *
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            required
            className="w-full px-4 py-3 rounded-xl border border-stone focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
          />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          {dictionary.forms.workEmail} *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full px-4 py-3 rounded-xl border border-stone focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
        />
      </div>
      <div>
        <label htmlFor="company" className="block text-sm font-medium mb-2">
          {dictionary.forms.companyName} *
        </label>
        <input
          type="text"
          id="company"
          name="company"
          required
          className="w-full px-4 py-3 rounded-xl border border-stone focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
        />
      </div>
      <div>
        <label htmlFor="employees" className="block text-sm font-medium mb-2">
          {dictionary.forms.numberOfEmployees} *
        </label>
        <select
          id="employees"
          name="employees"
          required
          className="w-full px-4 py-3 rounded-xl border border-stone focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20 bg-white"
        >
          <option value="">{dictionary.common.select}</option>
          <option value="1-25">{dictionary.forms.employees1to25}</option>
          <option value="26-100">{dictionary.forms.employees26to100}</option>
          <option value="101-500">{dictionary.forms.employees101to500}</option>
          <option value="500+">{dictionary.forms.employees500plus}</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-forest text-cream px-8 py-4 rounded-full font-semibold hover:bg-forest/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {submitting ? dictionary.common.creatingAccount : dictionary.forms.startFreeTrial}
        {!submitting && <i className="fas fa-arrow-right" />}
      </button>
      <p className="text-center text-ink/40 text-xs">
        {dictionary.forms.termsAgreement}
      </p>
    </form>
  );
}
