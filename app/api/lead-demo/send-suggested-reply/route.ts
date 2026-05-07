import supabase from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

type SendSuggestedReplyBody = {
  id?: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function makeReplySubject(subject: string | null | undefined) {
  return subject || "We received your request";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SendSuggestedReplyBody;
    const id = cleanText(body.id);

    if (!id) {
      return Response.json(
        {
          success: false,
          error: "Missing lead id.",
        },
        { status: 400 },
      );
    }

    const { data: lead, error: leadError } = await supabase
      .from("portfolio_leads")
      .select("*")
      .eq("id", id)
      .single();

    if (leadError || !lead) {
      return Response.json(
        {
          success: false,
          error: leadError?.message || "Lead not found.",
        },
        { status: 404 },
      );
    }

    if (!lead.email) {
      return Response.json(
        {
          success: false,
          error: "Lead has no customer email address.",
        },
        { status: 400 },
      );
    }

    if (!lead.ai_suggested_reply) {
      return Response.json(
        {
          success: false,
          error: "This lead has no AI suggested reply to send.",
        },
        { status: 400 },
      );
    }

    if (!lead.customer_confirmation_message_id) {
      return Response.json(
        {
          success: false,
          error:
            "This lead does not have a confirmation email thread anchor. Submit a new lead after the latest update, then try again.",
        },
        { status: 400 },
      );
    }

    const subject = makeReplySubject(lead.customer_confirmation_subject);
    const now = new Date().toISOString();

    const sent = await sendEmail(lead.email, subject, lead.ai_suggested_reply, {
      inReplyTo: lead.customer_confirmation_message_id,
      references: lead.customer_confirmation_message_id,
    });

    const sentData: any = (sent as any)?.data || sent;

    const updates: Record<string, string | null> = {
      status: "contacted",
      suggested_reply_sent_at: now,
      suggested_reply_email_id: sentData?.id || null,
      suggested_reply_last_error: null,
    };

    if (!lead.contacted_at) {
      updates.contacted_at = now;
    }

    const { data: updatedLead, error: updateError } = await supabase
      .from("portfolio_leads")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return Response.json(
        {
          success: false,
          error: updateError.message,
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      data: updatedLead,
    });
  } catch (err: any) {
    return Response.json(
      {
        success: false,
        error: err?.message || "Suggested reply send failed.",
      },
      { status: 500 },
    );
  }
}
