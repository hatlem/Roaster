"use client";

import { useState, type FormEvent } from "react";
import { contact } from "@/content";

export function ContactForm() {
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
        <h3 className="font-display text-2xl mb-2">Message sent</h3>
        <p className="text-ink/60">
          We&apos;ll get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium mb-2">
            First name *
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
            Last name *
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
          Work email *
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
          Company *
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
          How can we help? *
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
        {submitting ? "Sending..." : contact.form.submitText}
        {!submitting && <i className="fas fa-arrow-right" />}
      </button>
    </form>
  );
}
