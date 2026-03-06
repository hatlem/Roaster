"use client";

import { useState, type FormEvent } from "react";
import type { Dictionary } from "@/i18n/dictionaries";

interface ContactFormProps {
  dictionary: Dictionary;
}

export function ContactForm({ dictionary }: ContactFormProps) {
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
        <h3 className="font-display text-2xl mb-2">{dictionary.forms.messageSentTitle}</h3>
        <p className="text-ink/60">
          {dictionary.forms.messageSentDesc}
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
            className="w-full px-4 py-3 rounded-xl border border-stone focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
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
            className="w-full px-4 py-3 rounded-xl border border-stone focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
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
          className="w-full px-4 py-3 rounded-xl border border-stone focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
        />
      </div>
      <div>
        <label htmlFor="company" className="block text-sm font-medium mb-2">
          {dictionary.forms.company} *
        </label>
        <input
          type="text"
          id="company"
          name="company"
          required
          className="w-full px-4 py-3 rounded-xl border border-stone focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2">
          {dictionary.forms.howCanWeHelp} *
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          className="w-full px-4 py-3 rounded-xl border border-stone focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full btn-primary justify-center disabled:opacity-50"
      >
        {submitting ? dictionary.common.sending : dictionary.forms.sendMessage}
        {!submitting && <i className="fas fa-arrow-right" />}
      </button>
    </form>
  );
}
