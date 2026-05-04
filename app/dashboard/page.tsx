"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [sentId, setSentId] = useState<number | null>(null);
  const [editedResponses, setEditedResponses] = useState<{
    [key: number]: string;
  }>({}); // ✅ NEW

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
                <th className="px-6 py-3">Response</th> {/* ✅ NEW COLUMN */}
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

                  {/* ✅ EDITABLE RESPONSE */}
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

                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() =>
                        resendEmail(
                          lead.id,
                          lead.email,
                          editedResponses[lead.id] ?? lead.suggested_response, // ✅ KEY CHANGE
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
                          : "Send"}{" "}
                      {/* ✅ renamed */}
                    </button>
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
