import supabase from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

function makeReplySubject(subject: string | null | undefined) {
  if (!subject) return "Re: Your inquiry";

  return subject.toLowerCase().startsWith("re:") ? subject : `Re: ${subject}`;
}

export async function POST(req: Request) {
  try {
    const { id, email, response } = await req.json();

    if (!id || !email || !response) {
      return Response.json(
        {
          success: false,
          error: "Missing id, email, or response",
        },
        { status: 400 },
      );
    }

    // ✅ Find the latest customer email so we can reply to the thread
    const { data: latestCustomerMessage, error: messageError } = await supabase
      .from("messages")
      .select("*")
      .eq("lead_id", id)
      .eq("sender", "customer")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (messageError) {
      return Response.json(
        {
          success: false,
          error: messageError.message,
        },
        { status: 500 },
      );
    }

    const subject = makeReplySubject(latestCustomerMessage?.subject);

    const inReplyTo = latestCustomerMessage?.message_id || undefined;

    const references =
      latestCustomerMessage?.references_header ||
      latestCustomerMessage?.message_id ||
      undefined;

    const quotedText = latestCustomerMessage?.content || undefined;

    // ✅ Send as an email reply, not a fresh standalone email
    const sent = await sendEmail(email, subject, response, {
      inReplyTo,
      references,
      quotedText,
    });

    const sentData: any = (sent as any)?.data || sent;

    // ✅ Store manually sent dashboard reply in messages
    await supabase.from("messages").insert([
      {
        lead_id: id,
        sender: "system",
        content: response,
        subject,
        resend_email_id: sentData?.id || null,
        in_reply_to: inReplyTo || null,
        references_header: references || null,
      },
    ]);

    await supabase
      .from("leads")
      .update({
        suggested_response: response,
        status: "contacted",
        last_subject: subject,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return Response.json({ success: true });
  } catch (err: any) {
    console.error("Resend route error:", err);

    return Response.json(
      {
        success: false,
        error: err?.message || "Resend failed",
      },
      { status: 500 },
    );
  }
}
