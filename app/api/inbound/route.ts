import supabase from "@/lib/supabase";
import { generateResponse, detectScheduling } from "@/lib/ai";
import { sendEmail } from "@/lib/email";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("INBOUND:", JSON.stringify(body, null, 2));

    const data = body?.data || {};

    // email parsing
    let rawEmail = data?.from?.email || data?.from || body?.email || "";

    const emailMatch = rawEmail.match(/<(.+?)>/);
    const email = (emailMatch ? emailMatch[1] : rawEmail).trim().toLowerCase();

    // subject / threading info
    let subject = data?.subject || "Your inquiry";
    let incomingMessageId =
      data?.message_id ||
      data?.messageId ||
      data?.headers?.["message-id"] ||
      data?.headers?.["Message-ID"] ||
      "";

    let referencesHeader =
      data?.references ||
      data?.headers?.references ||
      data?.headers?.References ||
      incomingMessageId ||
      "";

    // Fetch full received email body from Resend
    let message = "";

    const emailId = data?.email_id || data?.id;

    if (emailId) {
      const { data: receivedEmail, error: receivedEmailError } =
        await resend.emails.receiving.get(emailId);

      if (receivedEmailError) {
        console.error("Failed to fetch received email:", receivedEmailError);
      }

      console.log(
        "RECEIVED EMAIL FULL:",
        JSON.stringify(receivedEmail, null, 2),
      );

      const received: any = receivedEmail;
      const receivedBody = received?.body || {};
      const receivedHeaders = received?.headers || {};

      subject = received?.subject || subject;

      incomingMessageId =
        received?.message_id ||
        received?.messageId ||
        receivedHeaders?.["message-id"] ||
        receivedHeaders?.["Message-ID"] ||
        incomingMessageId;

      referencesHeader =
        received?.references ||
        receivedHeaders?.references ||
        receivedHeaders?.References ||
        referencesHeader ||
        incomingMessageId;

      message =
        received?.text ||
        received?.text_body ||
        received?.plain_text ||
        received?.body_text ||
        receivedBody?.text ||
        receivedBody?.plain ||
        receivedBody?.plain_text ||
        (received?.html ? stripHtml(received.html) : "") ||
        (received?.html_body ? stripHtml(received.html_body) : "") ||
        (receivedBody?.html ? stripHtml(receivedBody.html) : "") ||
        "";
    } else {
      // fallback for Postman/manual tests
      message =
        data?.text ||
        data?.snippet ||
        body?.message ||
        (data?.html ? stripHtml(data.html) : "");
    }

    message = message.trim();

    if (!email || !message) {
      console.log("⚠️ Missing parsed fields:", {
        email,
        message,
        emailId,
        subject,
      });

      return Response.json(
        { success: false, error: "Missing email or message body" },
        { status: 400 },
      );
    }

    console.log("Parsed email:", email);
    console.log("Parsed subject:", subject);
    console.log("Parsed message:", message);

    // STEP 1 — find existing lead
    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let currentLead = lead;

    // STEP 2 — create lead if not exists
    if (!currentLead) {
      console.log("Creating new lead for:", email);

      const { data: newLead, error: insertLeadError } = await supabase
        .from("leads")
        .insert([
          {
            name: email.split("@")[0],
            email: email,
            summary: message.substring(0, 120),
            status: "new",
          },
        ])
        .select()
        .single();

      if (insertLeadError || !newLead) {
        console.error("Lead creation failed:", insertLeadError);

        return Response.json(
          { success: false, error: "Failed to create lead" },
          { status: 500 },
        );
      }

      currentLead = newLead;
    }

    console.log("Lead ID:", currentLead.id);

    // 1. store customer message
    const { error: insertCustomerError } = await supabase
      .from("messages")
      .insert([
        {
          lead_id: currentLead.id,
          sender: "customer",
          content: message,
        },
      ]);

    if (insertCustomerError) {
      console.error("Customer insert error:", insertCustomerError);

      return Response.json(
        {
          success: false,
          error: insertCustomerError.message,
        },
        { status: 500 },
      );
    }

    // update lead for dashboard
    await supabase
      .from("leads")
      .update({
        summary: message.substring(0, 120),
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentLead.id);

    // detect scheduling
    const scheduling = await detectScheduling(message);

    console.log("Scheduling detection:", scheduling);

    if (scheduling.is_scheduling) {
      await supabase
        .from("leads")
        .update({
          status: "scheduled",
          scheduled_date: scheduling.date,
          scheduled_time: scheduling.time,
        })
        .eq("id", currentLead.id);

      await sendEmail(
        email,
        `Re: ${subject}`,
        `Great — we have you scheduled for ${scheduling.time || ""} ${scheduling.date || ""}. We'll follow up shortly.`,
        {
          inReplyTo: incomingMessageId,
          references: referencesHeader,
          quotedText: message,
        },
      );

      console.log("Lead scheduled — stopping AI loop");

      return Response.json({
        success: true,
        scheduled: true,
      });
    }

    // EXISTING FLOW

    const { data: history } = await supabase
      .from("messages")
      .select("sender, content")
      .eq("lead_id", currentLead.id)
      .order("created_at", { ascending: true });

    const conversation = (history || []).map((m) => ({
      role: m.sender === "customer" ? "user" : "assistant",
      content: m.content,
    }));

    conversation.push({
      role: "user",
      content: message,
    });

    const reply = await generateResponse(conversation);

    const { error: insertSystemError } = await supabase
      .from("messages")
      .insert([
        {
          lead_id: currentLead.id,
          sender: "system",
          content: reply,
        },
      ]);

    if (insertSystemError) {
      console.error("System insert error:", insertSystemError);
    }

    await sendEmail(email, `Re: ${subject}`, reply, {
      inReplyTo: incomingMessageId,
      references: referencesHeader,
      quotedText: message,
    });

    console.log("Reply sent to:", email);

    return Response.json({ success: true });
  } catch (err: any) {
    console.error("INBOUND ERROR:", err);

    return Response.json(
      { success: false, error: err.message || "Error" },
      { status: 500 },
    );
  }
}
