"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [sentId, setSentId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null); // ✅ NEW
  const [savedId, setSavedId] = useState<number | null>(null); // ✅ NEW

  const [editedResponses, setEditedResponses] = useState<{
    [key: number]: string;
  }>({});

  useEffect(() => {
    fetch("/api/lead")
      .then((res) => res.json())
      .then((data) => setLeads(data.data || []));
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

  // ✅ UPDATED — now with UI feedback
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

      setSendingId(null);
      setSentId(id);

      setTimeout(() => setSentId(null), 2000);
    } catch (err) {
      setSendingId(null);
      console.error("Resend failed");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Leads Dashboard</h1>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Summary</th>
                <th className="px-6 py-3">Response</th>
                <th className="px-6 py-3">Status</th>
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
                      <option value="closed">Closed</option>
                    </select>
                  </td>

                  {/* ✅ UPDATED ACTION COLUMN */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-2">
                      {/* Save button */}
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

                      {/* Send button */}
                      <button
                        onClick={() =>
                          resendEmail(
                            lead.id,
                            lead.email,
                            editedResponses[lead.id] ?? lead.suggested_response,
                          )
                        }
                        disabled={sendingId === lead.id}
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
