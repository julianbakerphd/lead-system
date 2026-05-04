"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/leads")
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

    // refresh UI
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, status } : lead)),
    );
  }

  async function resendEmail(email: string, message: string) {
    await fetch("/api/lead", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Follow-up",
        email,
        message,
      }),
    });
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
                      onClick={() => resendEmail(lead.email, lead.message)}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      Resend
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
