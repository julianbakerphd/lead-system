"use client";

import { Fragment, useEffect, useState } from "react";

export default function Dashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [editedResponses, setEditedResponses] = useState<{
    [key: string]: string;
  }>({});

  const [mode, setMode] = useState<"manual" | "auto">("manual");

  async function fetchLeads() {
    const res = await fetch("/api/lead", {
      cache: "no-store",
    });
    const data = await res.json();
    setLeads(data.data || []);
  }

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeads();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch("/api/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, status }),
    });

    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, status } : lead)),
    );
  }

  async function saveResponse(id: string, response: string) {
    try {
      setSavingId(id);

      await fetch("/api/update-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, response }),
      });

      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === id ? { ...lead, suggested_response: response } : lead,
        ),
      );

      setSavingId(null);
      setSavedId(id);

      setTimeout(() => setSavedId(null), 2000);
    } catch (err) {
      setSavingId(null);
      console.error("Save failed");
    }
  }

  async function resendEmail(id: string, email: string, response: string) {
    try {
      setSendingId(id);

      await fetch("/api/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          email,
          response,
        }),
      });

      await fetchLeads();

      setSendingId(null);
      setSentId(id);

      setTimeout(() => setSentId(null), 2000);
    } catch (err) {
      setSendingId(null);
      console.error("Resend failed");
    }
  }

  useEffect(() => {
    if (mode !== "auto") return;

    leads.forEach((lead) => {
      if (lead.status === "new") {
        resendEmail(lead.id, lead.email, lead.suggested_response);
        updateStatus(lead.id, "contacted");
      }
    });
  }, [leads, mode]);

  function formatDate(value: string | null | undefined) {
    if (!value) return "";
    return new Date(value).toLocaleString();
  }

  function previewMessage(value: string | null | undefined) {
    if (!value) return "(no customer message yet)";

    const cleaned = value
      .split("\n")
      .filter((line) => !line.trim().startsWith(">"))
      .filter((line) => !line.toLowerCase().includes(" wrote:"))
      .join("\n")
      .trim();

    if (cleaned.length <= 220) return cleaned;

    return `${cleaned.slice(0, 220)}...`;
  }

  function statusClass(status: string) {
    if (status === "scheduled") return "bg-green-100 text-green-700";
    if (status === "contacted") return "bg-blue-100 text-blue-700";
    if (status === "closed") return "bg-gray-200 text-gray-700";
    return "bg-yellow-100 text-yellow-700";
  }

  const totalLeads = leads.length;
  const scheduledLeads = leads.filter((lead) => lead.status === "scheduled").length;
  const newLeads = leads.filter((lead) => lead.status === "new").length;
  const autoRepliedLeads = leads.filter(
    (lead) => lead.latest_system_message || lead.suggested_response,
  ).length;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Smart Email Leads Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              AI-powered inbound email replies, lead tracking, and conversation history.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-500">Total Leads</div>
            <div className="text-2xl font-bold">{totalLeads}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-500">New</div>
            <div className="text-2xl font-bold">{newLeads}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-500">Auto-Replied</div>
            <div className="text-2xl font-bold">{autoRepliedLeads}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-500">Scheduled</div>
            <div className="text-2xl font-bold">{scheduledLeads}</div>
          </div>
        </div>

        <div className="mb-4 flex items-center space-x-4">
          <span className="font-medium">Automation Mode:</span>

          <button
            onClick={() => setMode("manual")}
            className={`px-3 py-1 rounded ${
              mode === "manual" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Manual Review
          </button>

          <button
            onClick={() => setMode("auto")}
            className={`px-3 py-1 rounded ${
              mode === "auto" ? "bg-green-500 text-white" : "bg-gray-200"
            }`}
          >
            Auto Reply
          </button>

          <span className="text-xs text-gray-500">
            {mode === "auto"
              ? "AI replies automatically to new leads."
              : "Review AI replies before sending."}
          </span>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Latest Customer Email</th>
                <th className="px-6 py-3 text-left">Latest AI Reply</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Last Update</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {leads.map((lead) => (
                <Fragment key={lead.id}>
                  <tr className="border-b align-middle">
                    <td className="px-6 py-4 font-medium">{lead.name}</td>
                    <td className="px-6 py-4">{lead.email}</td>

                    <td className="px-6 py-4 max-w-xs whitespace-pre-wrap">
                      {previewMessage(
                        lead.latest_customer_message ||
                          lead.latest_message ||
                          lead.summary,
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <textarea
                        className="w-full min-h-28 border rounded p-2 text-sm"
                        value={
                          editedResponses[lead.id] ??
                          lead.latest_system_message ??
                          lead.suggested_response ??
                          ""
                        }
                        onChange={(e) =>
                          setEditedResponses((prev) => ({
                            ...prev,
                            [lead.id]: e.target.value,
                          }))
                        }
                      />
                      {(lead.latest_system_message || lead.suggested_response) && (
                        <div className="mt-1 text-xs text-blue-600">
                          AI reply generated
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${statusClass(
                            lead.status,
                          )}`}
                        >
                          {lead.status || "new"}
                        </span>

                        <select
                          value={lead.status}
                          onChange={(e) =>
                            updateStatus(lead.id, e.target.value)
                          }
                          className="block border rounded px-2 py-1"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-500">
                      {formatDate(lead.last_message_at || lead.created_at)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() =>
                            saveResponse(
                              lead.id,
                              editedResponses[lead.id] ??
                                lead.latest_system_message ??
                                lead.suggested_response ??
                                "",
                            )
                          }
                          disabled={savingId === lead.id}
                          className={`px-3 py-1 rounded text-white ${
                            savingId === lead.id
                              ? "bg-gray-400"
                              : savedId === lead.id
                                ? "bg-green-500"
                                : "bg-gray-600 hover:bg-gray-700"
                          }`}
                        >
                          {savingId === lead.id
                            ? "Saving..."
                            : savedId === lead.id
                              ? "Saved ✓"
                              : "Save"}
                        </button>

                        <button
                          onClick={() =>
                            resendEmail(
                              lead.id,
                              lead.email,
                              editedResponses[lead.id] ??
                                lead.latest_system_message ??
                                lead.suggested_response ??
                                "",
                            )
                          }
                          disabled={sendingId === lead.id || mode === "auto"}
                          className={`px-3 py-1 rounded text-white ${
                            sendingId === lead.id
                              ? "bg-gray-400"
                              : sentId === lead.id
                                ? "bg-green-500"
                                : "bg-blue-500 hover:bg-blue-600"
                          }`}
                        >
                          {sendingId === lead.id
                            ? "Sending..."
                            : sentId === lead.id
                              ? "Sent ✓"
                              : "Send"}
                        </button>

                        <button
                          onClick={() =>
                            setExpandedId(
                              expandedId === lead.id ? null : lead.id,
                            )
                          }
                          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                        >
                          {expandedId === lead.id
                            ? "Hide Thread"
                            : "View Thread"}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedId === lead.id && (
                    <tr className="bg-gray-50 border-b">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="mb-3 text-sm font-semibold text-gray-700">
                          Email Conversation Thread
                        </div>

                        <div className="space-y-3">
                          {(lead.messages || []).map((message: any) => (
                            <div
                              key={message.id}
                              className={`rounded-lg p-4 border max-w-4xl ${
                                message.sender === "customer"
                                  ? "bg-white"
                                  : "bg-blue-50 ml-auto"
                              }`}
                            >
                              <div className="text-xs font-semibold text-gray-500 mb-2">
                                {message.sender === "customer"
                                  ? "Customer"
                                  : "AI Assistant"}{" "}
                                · {formatDate(message.created_at)}
                              </div>

                              <div className="whitespace-pre-wrap leading-relaxed">
                                {message.content || "(empty message)"}
                              </div>
                            </div>
                          ))}

                          {(!lead.messages || lead.messages.length === 0) && (
                            <div className="text-gray-500">
                              No messages yet.
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}