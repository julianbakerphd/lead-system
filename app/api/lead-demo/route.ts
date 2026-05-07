import supabase from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { analyzeLeadDemo } from "@/lib/lead-demo-ai";

type LeadDemoBody = {
  name?: string;
  email?: string;
  phone?: string;
  service_needed?: string;
  serviceNeeded?: string;
  urgency?: string;
  message?: string;
  source?: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUrgency(value: string) {
  const urgency = value.toLowerCase().trim();

  if (urgency === "urgent") return "urgent";
  if (urgency === "emergency") return "emergency";

  return "normal";
}

function buildCustomerConfirmation(name: string, serviceNeeded: string) {
  return `Hi ${name},

Thanks for reaching out. We received your request for ${serviceNeeded}.

Someone from our team will review your message and follow up shortly.

This is an automated confirmation so you know your request was received.`;
}

function buildBusinessAlert(params: {
  name: string;
  email: string;
  phone: string;
  serviceNeeded: string;
  urgency: string;
  message: string;
  source: string;
  followUpDeadline: string;
  aiSummary?: string | null;
  aiPriority?: string | null;
  aiNextAction?: string | null;
  aiSuggestedReply?: string | null;
}) {
  const aiBlock =
    params.aiSummary || params.aiPriority || params.aiNextAction
      ? `

AI Assistance:
Summary: ${params.aiSummary || "Not available"}
Priority: ${params.aiPriority || "Not available"}
Next Action: ${params.aiNextAction || "Not available"}

Suggested Reply:
${params.aiSuggestedReply || "Not available"}`
      : "";

  return `New lead received.

Name: ${params.name}
Email: ${params.email}
Phone: ${params.phone || "Not provided"}
Service Needed: ${params.serviceNeeded}
Urgency: ${params.urgency}
Source: ${params.source}

Message:
${params.message}${aiBlock}

Follow-up deadline:
${new Date(params.followUpDeadline).toLocaleString()}

Action needed:
Contact this lead before the follow-up deadline so it does not become overdue.`;
}

export async function GET() {
  const { data, error } = await supabase
    .from("portfolio_leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }

  return Response.json({
    success: true,
    data: data || [],
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LeadDemoBody;

    const name = cleanText(body.name);
    const email = cleanText(body.email).toLowerCase();
    const phone = cleanText(body.phone);
    const serviceNeeded = cleanText(body.service_needed || body.serviceNeeded);
    const urgency = normalizeUrgency(cleanText(body.urgency));
    const message = cleanText(body.message);
    const source = cleanText(body.source) || "website";

    if (!name || !email || !serviceNeeded || !message) {
      return Response.json(
        {
          success: false,
          error: "Missing required fields.",
        },
        { status: 400 },
      );
    }

    if (!email.includes("@")) {
      return Response.json(
        {
          success: false,
          error: "Invalid email address.",
        },
        { status: 400 },
      );
    }

    const aiResult = await analyzeLeadDemo({
      name,
      email,
      phone,
      serviceNeeded,
      urgency,
      message,
      source,
    });

    const followUpDeadline = new Date(
      Date.now() + 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await supabase
      .from("portfolio_leads")
      .insert([
        {
          name,
          email,
          phone,
          service_needed: serviceNeeded,
          urgency,
          message,
          source,
          status: "new",
          follow_up_deadline: followUpDeadline,
          ai_summary: aiResult.ai_summary,
          ai_priority: aiResult.ai_priority,
          ai_next_action: aiResult.ai_next_action,
          ai_suggested_reply: aiResult.ai_suggested_reply,
          ai_processed_at: aiResult.ai_processed_at,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      return Response.json(
        {
          success: false,
          error: error?.message || "Failed to create lead.",
        },
        { status: 500 },
      );
    }

    const businessAlertEmail = process.env.LEAD_ALERT_EMAIL;

    const emailUpdates: {
      business_alert_sent_at?: string;
      customer_confirmation_sent_at?: string;
      last_error?: string | null;
    } = {};

    if (businessAlertEmail) {
      try {
        await sendEmail(
          businessAlertEmail,
          `New ${urgency} lead: ${name}`,
          buildBusinessAlert({
            name,
            email,
            phone,
            serviceNeeded,
            urgency,
            message,
            source,
            followUpDeadline,
            aiSummary: aiResult.ai_summary,
            aiPriority: aiResult.ai_priority,
            aiNextAction: aiResult.ai_next_action,
            aiSuggestedReply: aiResult.ai_suggested_reply,
          }),
        );

        emailUpdates.business_alert_sent_at = new Date().toISOString();
      } catch (err: any) {
        emailUpdates.last_error =
          err?.message || "Business alert email failed.";
      }
    } else {
      emailUpdates.last_error =
        "LEAD_ALERT_EMAIL is not set, so no business alert was sent.";
    }

    try {
      await sendEmail(
        email,
        "We received your request",
        buildCustomerConfirmation(name, serviceNeeded),
      );

      emailUpdates.customer_confirmation_sent_at = new Date().toISOString();
    } catch (err: any) {
      emailUpdates.last_error =
        err?.message || "Customer confirmation email failed.";
    }

    if (Object.keys(emailUpdates).length > 0) {
      await supabase
        .from("portfolio_leads")
        .update(emailUpdates)
        .eq("id", data.id);
    }

    return Response.json({
      success: true,
      data: {
        ...data,
        ...emailUpdates,
      },
    });
  } catch (err: any) {
    return Response.json(
      {
        success: false,
        error: err?.message || "Lead submission failed.",
      },
      { status: 500 },
    );
  }
}
