"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [sentId, setSentId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  const [editedResponses, setEditedResponses] = useState<{
    [key: number]: string;
  }>({});

  const [mode, setMode] = useState<"manual" | "auto">("manual");

  // 🔥 FIX — disable cache so updates actually show
  async function fetchLeads() {
    const res = await fetch("/api/lead", {
      cache: "no-store", // ✅ IMPORTANT FIX
    });
    const data = await res.json();
    setLeads(data.data || []);
  }

  useEffect(() => {
    fetchLeads();
  }, []);

  // 🔥 polling (works, just keep it)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeads();
    }, 3000); // slightly faster

    return () => clearInterval(interval);
  }, []);

  async function updateStatus(id: number, status: string) {
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

  async function saveResponse(id: number, response: string) {
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

  async function resendEmail(id: number, email: string, response: string) {
    try {
      setSendingId(id);

      await fetch("/api/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          response,
        }),
      });

      await fetchLeads(); // refresh

      setSendingId(null);
      setSentId(id);

      setTimeout(() => setSentId(null), 2000);
    } catch (err) {
      setSendingId(null);
      console.error("Resend failed");
    }
  }

  // AUTO MODE
  useEffect(() => {
    if (mode !== "auto") return;

    leads.forEach((lead) => {
      if (lead.status === "new") {
        resendEmail(lead.id, lead.email, lead.suggested_response);
        updateStatus(lead.id, "contacted");
      }
    });
  }, [leads, mode]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Leads Dashboard</h1>

        <div className="mb-4 flex items-center space-x-4">
          <span className="font-medium">Mode:</span>

          <button
            onClick={() => setMode("manual")}
            className={`px-3 py-1 rounded ${
              mode === "manual" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Manual
          </button>

          <button
            onClick={() => setMode("auto")}
            className={`px-3 py-1 rounded ${
              mode === "auto" ? "bg-green-500 text-white" : "bg-gray-200"
            }`}
          >
            Auto
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Summary</th>
                <th className="px-6 py-3">Response</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Last Update</th> {/* 🔥 NEW */}
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b">
                  <td className="px-6 py-4">{lead.name}</td>
                  <td className="px-6 py-4">{lead.email}</td>
                  <td className="px-6 py-4">{lead.summary}</td>

                  <td className="px-6 py-4">
                    <textarea
                      className="w-full border rounded p-2 text-sm"
                      value={
                        editedResponses[lead.id] ?? lead.suggested_response
                      }
                      onChange={(e) =>
                        setEditedResponses((prev) => ({
                          ...prev,
                          [lead.id]: e.target.value,
                        }))
                      }
                    />
                  </td>

                  <td className="px-6 py-4">
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>

                  {/* 🔥 NEW — shows activity */}
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {lead.created_at}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() =>
                          saveResponse(
                            lead.id,
                            editedResponses[lead.id] ?? lead.suggested_response,
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
                            editedResponses[lead.id] ?? lead.suggested_response,
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
