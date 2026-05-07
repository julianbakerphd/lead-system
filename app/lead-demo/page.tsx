"use client";

import Link from "next/link";
import { useState } from "react";

type LeadForm = {
  name: string;
  email: string;
  phone: string;
  service_needed: string;
  urgency: "normal" | "urgent" | "emergency";
  source: string;
  message: string;
};

const initialForm: LeadForm = {
  name: "",
  email: "",
  phone: "",
  service_needed: "",
  urgency: "normal",
  source: "Website",
  message: "",
};

export default function LeadDemoPage() {
  const [form, setForm] = useState<LeadForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof LeadForm>(key: K, value: LeadForm[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setSuccess(false);
      setError(null);

      const res = await fetch("/api/lead-demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Lead submission failed.");
      }

      setSuccess(true);
      setForm(initialForm);
    } catch (err: any) {
      setError(err?.message || "Lead submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Portfolio Demo
            </div>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Never Miss a Lead System
            </h1>

            <p className="mt-3 max-w-3xl text-slate-600">
              This demo shows a custom lead capture and follow-up workflow for a
              small business. Customer inquiries are saved, email alerts are
              sent, and overdue leads can be tracked from a dashboard.
            </p>
          </div>

          <Link
            href="/lead-demo/dashboard"
            className="rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
          >
            View Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-950">
              Request Service
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Submit a sample customer inquiry to test the workflow.
            </p>

            {success && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                Request received. The lead was saved and notification emails
                were triggered.
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={submitLead} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    required
                    placeholder="Sarah Johnson"
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    required
                    placeholder="sarah@example.com"
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Phone
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="555-123-4567"
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Service Needed
                  </label>
                  <input
                    value={form.service_needed}
                    onChange={(e) =>
                      updateField("service_needed", e.target.value)
                    }
                    required
                    placeholder="AC repair, plumbing, website help..."
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Urgency
                  </label>
                  <select
                    value={form.urgency}
                    onChange={(e) =>
                      updateField(
                        "urgency",
                        e.target.value as LeadForm["urgency"],
                      )
                    }
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Source
                  </label>
                  <select
                    value={form.source}
                    onChange={(e) => updateField("source", e.target.value)}
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Website">Website</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Referral">Referral</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Message
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  required
                  placeholder="Tell us what you need help with..."
                  className="mt-2 min-h-36 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`rounded-lg px-5 py-2 text-sm font-semibold text-white ${
                  submitting ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {submitting ? "Submitting..." : "Submit Inquiry"}
              </button>
            </form>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">
                Workflow Shown
              </h2>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div>1. Customer submits inquiry form</div>
                <div>2. Lead is saved to Supabase/Postgres</div>
                <div>3. Business receives an instant alert</div>
                <div>4. Customer receives confirmation</div>
                <div>5. Dashboard tracks follow-up status</div>
                <div>6. Overdue leads are flagged</div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
              <h2 className="text-lg font-bold">Business Problem</h2>

              <p className="mt-3 text-sm leading-6 text-slate-200">
                Small businesses lose money when website inquiries are missed,
                buried in an inbox, or followed up too late. This system creates
                a simple operating workflow for capturing and tracking every
                lead.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
