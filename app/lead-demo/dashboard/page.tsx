"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type LeadStatus = "new" | "contacted" | "quoted" | "won" | "lost";

type PortfolioLead = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  phone: string | null;
  service_needed: string;
  urgency: "normal" | "urgent" | "emergency";
  message: string;
  source: string;
  status: LeadStatus;
  follow_up_deadline: string;
  contacted_at: string | null;
  quoted_at: string | null;
  closed_at: string | null;
  outcome: "won" | "lost" | null;
  business_alert_sent_at: string | null;
  customer_confirmation_sent_at: string | null;
  last_error: string | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatMinutes(minutes: number) {
  if (!Number.isFinite(minutes)) return "—";

  if (minutes < 1) return "Less than 1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;

  const hours = minutes / 60;
  return `${hours.toFixed(1)} hr`;
}

function getMinutesBetween(start: string, end: string) {
  return (new Date(end).getTime() - new Date(start).getTime()) / 60000;
}

function getFollowUpRisk(lead: PortfolioLead, now: Date) {
  if (lead.status !== "new") {
    return {
      label: "Handled",
      className: "bg-green-100 text-green-700",
    };
  }

  const deadline = new Date(lead.follow_up_deadline);
  const minutesRemaining = (deadline.getTime() - now.getTime()) / 60000;

  if (minutesRemaining <= 0) {
    return {
      label: "Overdue",
      className: "bg-red-100 text-red-700",
    };
  }

  if (minutesRemaining <= 15) {
    return {
      label: "At Risk",
      className: "bg-orange-100 text-orange-700",
    };
  }

  return {
    label: "On Track",
    className: "bg-blue-100 text-blue-700",
  };
}

function statusClass(status: LeadStatus) {
  if (status === "won") return "bg-green-100 text-green-700";
  if (status === "lost") return "bg-slate-200 text-slate-700";
  if (status === "quoted") return "bg-purple-100 text-purple-700";
  if (status === "contacted") return "bg-blue-100 text-blue-700";
  return "bg-yellow-100 text-yellow-700";
}

function urgencyClass(urgency: PortfolioLead["urgency"]) {
  if (urgency === "emergency") return "bg-red-100 text-red-700";
  if (urgency === "urgent") return "bg-orange-100 text-orange-700";
  return "bg-slate-100 text-slate-700";
}

export default function LeadDemoDashboardPage() {
  const [leads, setLeads] = useState<PortfolioLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  async function fetchLeads() {
    try {
      setError(null);

      const res = await fetch("/api/lead-demo", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to load leads.");
      }

      setLeads(data.data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load leads.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());

      if (document.visibilityState === "visible") {
        fetchLeads();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  async function updateStatus(id: string, status: LeadStatus) {
    try {
      setUpdatingId(id);
      setError(null);

      const res = await fetch("/api/lead-demo/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Status update failed.");
      }

      setLeads((prev) =>
        prev.map((lead) => (lead.id === id ? data.data : lead)),
      );
    } catch (err: any) {
      setError(err?.message || "Status update failed.");
    } finally {
      setUpdatingId(null);
    }
  }

  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const newLeads = leads.filter((lead) => lead.status === "new").length;

    const overdueLeads = leads.filter((lead) => {
      const risk = getFollowUpRisk(lead, now);
      return risk.label === "Overdue";
    }).length;

    const wonLeads = leads.filter((lead) => lead.status === "won").length;
    const lostLeads = leads.filter((lead) => lead.status === "lost").length;

    const contactedLeads = leads.filter(
      (lead) => lead.contacted_at && lead.created_at,
    );

    const averageResponseMinutes =
      contactedLeads.length === 0
        ? 0
        : contactedLeads.reduce((sum, lead) => {
            return sum + getMinutesBetween(lead.created_at, lead.contacted_at!);
          }, 0) / contactedLeads.length;

    return {
      totalLeads,
      newLeads,
      overdueLeads,
      wonLeads,
      lostLeads,
      averageResponseMinutes,
    };
  }, [leads, now]);

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Portfolio Demo Dashboard
            </div>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Never Miss a Lead Dashboard
            </h1>

            <p className="mt-3 max-w-3xl text-slate-600">
              Track every inquiry, monitor follow-up status, and flag leads that
              are at risk of being missed.
            </p>
          </div>

          <Link
            href="/lead-demo"
            className="rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
          >
            Submit Test Lead
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Leads
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-950">
              {metrics.totalLeads}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              New Leads
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-950">
              {metrics.newLeads}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Overdue
            </div>
            <div className="mt-2 text-3xl font-bold text-red-600">
              {metrics.overdueLeads}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Avg Response
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-950">
              {formatMinutes(metrics.averageResponseMinutes)}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Won
            </div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {metrics.wonLeads}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Lost
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-600">
              {metrics.lostLeads}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b p-5">
            <h2 className="text-lg font-bold text-slate-950">Lead Queue</h2>
            <p className="mt-1 text-sm text-slate-600">
              New leads become overdue when they pass the follow-up deadline
              without being marked contacted.
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No leads yet. Submit a test lead to see the workflow.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Lead</th>
                    <th className="px-5 py-3">Service</th>
                    <th className="px-5 py-3">Urgency</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Follow-Up Risk</th>
                    <th className="px-5 py-3">Submitted</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {leads.map((lead) => {
                    const risk = getFollowUpRisk(lead, now);

                    return (
                      <>
                        <tr key={lead.id} className="border-t align-top">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-950">
                              {lead.name}
                            </div>
                            <div className="mt-1 text-slate-600">
                              {lead.email}
                            </div>
                            <div className="mt-1 text-slate-500">
                              {lead.phone || "No phone provided"}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-medium text-slate-900">
                              {lead.service_needed}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              Source: {lead.source}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${urgencyClass(
                                lead.urgency,
                              )}`}
                            >
                              {lead.urgency}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass(
                                lead.status,
                              )}`}
                            >
                              {lead.status}
                            </span>

                            <select
                              value={lead.status}
                              onChange={(e) =>
                                updateStatus(
                                  lead.id,
                                  e.target.value as LeadStatus,
                                )
                              }
                              disabled={updatingId === lead.id}
                              className="mt-3 block rounded-lg border px-2 py-1 text-xs"
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="quoted">Quoted</option>
                              <option value="won">Won</option>
                              <option value="lost">Lost</option>
                            </select>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${risk.className}`}
                            >
                              {risk.label}
                            </span>

                            <div className="mt-2 text-xs text-slate-500">
                              Deadline: {formatDate(lead.follow_up_deadline)}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-500">
                            {formatDate(lead.created_at)}
                          </td>

                          <td className="px-5 py-4">
                            <button
                              onClick={() =>
                                setExpandedId(
                                  expandedId === lead.id ? null : lead.id,
                                )
                              }
                              className="rounded-lg bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                            >
                              {expandedId === lead.id
                                ? "Hide Details"
                                : "View Details"}
                            </button>
                          </td>
                        </tr>

                        {expandedId === lead.id && (
                          <tr className="border-t bg-slate-50">
                            <td colSpan={7} className="px-5 py-5">
                              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                                <div className="rounded-xl border bg-white p-4 lg:col-span-2">
                                  <div className="text-sm font-bold text-slate-950">
                                    Customer Message
                                  </div>

                                  <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                    {lead.message}
                                  </div>
                                </div>

                                <div className="rounded-xl border bg-white p-4">
                                  <div className="text-sm font-bold text-slate-950">
                                    Timeline
                                  </div>

                                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                                    <div>
                                      Submitted: {formatDate(lead.created_at)}
                                    </div>
                                    <div>
                                      Alert Sent:{" "}
                                      {formatDate(lead.business_alert_sent_at)}
                                    </div>
                                    <div>
                                      Customer Confirmed:{" "}
                                      {formatDate(
                                        lead.customer_confirmation_sent_at,
                                      )}
                                    </div>
                                    <div>
                                      Contacted: {formatDate(lead.contacted_at)}
                                    </div>
                                    <div>
                                      Quoted: {formatDate(lead.quoted_at)}
                                    </div>
                                    <div>
                                      Closed: {formatDate(lead.closed_at)}
                                    </div>
                                  </div>

                                  {lead.last_error && (
                                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                      {lead.last_error}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
