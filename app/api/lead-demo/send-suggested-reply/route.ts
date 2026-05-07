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

function makeMessageId() {
  return `<lead-demo-reply-${crypto.randomUUID()}@contact.jbakertech.com>`;
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

    const replyToSend =
      lead.latest_ai_reply_to_customer || lead.ai_suggested_reply;

    if (!replyToSend) {
      return Response.json(
        {
          success: false,
          error: "This lead has no AI suggested reply to send.",
        },
        { status: 400 },
      );
    }

    const replyMessageId =
      lead.latest_customer_reply_message_id ||
      lead.suggested_reply_message_id ||
      lead.customer_confirmation_message_id;

    if (!replyMessageId) {
      return Response.json(
        {
          success: false,
          error:
            "This lead does not have an email thread anchor. Submit a new lead after the latest update, then try again.",
        },
        { status: 400 },
      );
    }

    const subject = makeReplySubject(
      lead.latest_customer_reply_subject || lead.customer_confirmation_subject,
    );

    const references = [
      lead.customer_confirmation_message_id,
      lead.suggested_reply_message_id,
      lead.latest_customer_reply_references,
      lead.latest_customer_reply_message_id,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const now = new Date().toISOString();
    const suggestedReplyMessageId = makeMessageId();

    const sent = await sendEmail(lead.email, subject, replyToSend, {
      messageId: suggestedReplyMessageId,
      inReplyTo: replyMessageId,
      references: references || replyMessageId,
    });

    const sentData: any = (sent as any)?.data || sent;

    const updates: Record<string, string | null> = {
      status: "contacted",
      suggested_reply_sent_at: now,
      suggested_reply_email_id: sentData?.id || null,
      suggested_reply_message_id: suggestedReplyMessageId,
      suggested_reply_last_error: null,
    };

    if (!lead.contacted_at) {
      updates.contacted_at = now;
    }

    const { error: messageInsertError } = await supabase
      .from("portfolio_lead_messages")
      .insert([
        {
          lead_id: id,
          sender: "business",
          content: replyToSend,
          subject,
          message_id: suggestedReplyMessageId,
          in_reply_to: replyMessageId,
          references_header: references || replyMessageId,
          resend_email_id: sentData?.id || null,
          sent_at: now,
        },
      ]);

    if (messageInsertError) {
      return Response.json(
        {
          success: false,
          error: messageInsertError.message,
        },
        { status: 500 },
      );
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
