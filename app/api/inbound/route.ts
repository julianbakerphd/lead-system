import supabase from "@/lib/supabase";
import {
  generateResponse,
  detectScheduling,
  extractContactInfo,
} from "@/lib/ai";
import { sendEmail } from "@/lib/email";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

const SYSTEM_EMAILS = ["support@contact.jbakertech.com"];

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function parseEmailAddress(input: any): string {
  let raw = "";

  if (typeof input === "string") {
    raw = input;
  } else if (input && typeof input === "object") {
    raw = input.email || input.address || input.text || "";
  }

  const emailMatch = raw.match(/<(.+?)>/);
  return (emailMatch ? emailMatch[1] : raw).trim().toLowerCase();
}

function isSystemEmail(email: string) {
  return SYSTEM_EMAILS.includes(email.trim().toLowerCase());
}

function isPlaceholderName(name: string | null | undefined, email: string) {
  if (!name) return true;

  const emailUser = email.split("@")[0]?.toLowerCase();

  return (
    name.toLowerCase() === emailUser ||
    name.includes("@") ||
    name.trim().length < 2
  );
}

function getHeader(headers: any, name: string): string {
  if (!headers) return "";

  const target = name.toLowerCase();

  if (Array.isArray(headers)) {
    const found = headers.find((h) => {
      const key = h?.name || h?.key;
      return typeof key === "string" && key.toLowerCase() === target;
    });

    return found?.value || "";
  }

  if (typeof headers === "object") {
    const key = Object.keys(headers).find((k) => k.toLowerCase() === target);
    return key ? headers[key] : "";
  }

  return "";
}

function decodeQuotedPrintable(input: string) {
  return input
    .replace(/=\r?\n/g, "")
    .replace(/=([A-Fa-f0-9]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
}

function decodeBody(body: string, encoding: string) {
  const cleanEncoding = encoding.toLowerCase();

  if (cleanEncoding.includes("quoted-printable")) {
    return decodeQuotedPrintable(body);
  }

  if (cleanEncoding.includes("base64")) {
    try {
      return Buffer.from(body.replace(/\s/g, ""), "base64").toString("utf8");
    } catch {
      return body;
    }
  }

  return body;
}

function extractRawHeader(headerText: string, name: string) {
  const lines = headerText.split(/\r?\n/);
  const unfolded: string[] = [];

  for (const line of lines) {
    if (/^\s/.test(line) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += " " + line.trim();
    } else {
      unfolded.push(line);
    }
  }

  const target = name.toLowerCase() + ":";

  const found = unfolded.find((line) => line.toLowerCase().startsWith(target));

  return found ? found.slice(target.length).trim() : "";
}

function extractMimeBody(raw: string): string {
  const splitIndex = raw.search(/\r?\n\r?\n/);

  if (splitIndex === -1) return raw.trim();

  const headerText = raw.slice(0, splitIndex);
  const bodyText = raw.slice(splitIndex).replace(/^\r?\n\r?\n?/, "");

  const contentType = extractRawHeader(headerText, "Content-Type");
  const encoding = extractRawHeader(headerText, "Content-Transfer-Encoding");

  const boundaryMatch = contentType.match(/boundary="?([^";]+)"?/i);
  const boundary = boundaryMatch?.[1];

  if (boundary) {
    const parts = bodyText
      .split(`--${boundary}`)
      .map((part) => part.trim())
      .filter((part) => part && part !== "--");

    let htmlBody = "";

    for (const part of parts) {
      const partSplitIndex = part.search(/\r?\n\r?\n/);
      if (partSplitIndex === -1) continue;

      const partHeaders = part.slice(0, partSplitIndex);
      const partBody = part.slice(partSplitIndex).replace(/^\r?\n\r?\n?/, "");

      const partContentType = extractRawHeader(partHeaders, "Content-Type");
      const partEncoding = extractRawHeader(
        partHeaders,
        "Content-Transfer-Encoding",
      );

      if (partContentType.toLowerCase().includes("multipart/")) {
        const nested = extractMimeBody(part);
        if (nested) return nested;
      }

      const decoded = decodeBody(partBody, partEncoding).trim();

      if (partContentType.toLowerCase().includes("text/plain") && decoded) {
        return decoded;
      }

      if (partContentType.toLowerCase().includes("text/html") && decoded) {
        htmlBody = stripHtml(decoded);
      }
    }

    return htmlBody;
  }

  const decoded = decodeBody(bodyText, encoding).trim();

  if (contentType.toLowerCase().includes("text/html")) {
    return stripHtml(decoded);
  }

  return decoded;
}

function findEmailBody(value: any): string {
  if (!value || typeof value !== "object") return "";

  const textKeys = [
    "text",
    "text_body",
    "plain_text",
    "body_text",
    "bodyText",
    "plain",
  ];

  for (const key of textKeys) {
    if (typeof value[key] === "string" && value[key].trim()) {
      return value[key].trim();
    }
  }

  const htmlKeys = ["html", "html_body", "body_html", "htmlBody"];

  for (const key of htmlKeys) {
    if (typeof value[key] === "string" && value[key].trim()) {
      return stripHtml(value[key]);
    }
  }

  for (const key of Object.keys(value)) {
    if (key.toLowerCase().includes("subject")) continue;
    if (key.toLowerCase().includes("headers")) continue;

    const nested = value[key];

    if (nested && typeof nested === "object") {
      const found = findEmailBody(nested);
      if (found) return found;
    }
  }

  return "";
}

function getObjectKeysDeep(value: any, prefix = ""): string[] {
  if (!value || typeof value !== "object") return [];

  return Object.keys(value).flatMap((key) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const nested = value[key];

    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return [path, ...getObjectKeysDeep(nested, path)];
    }

    return [path];
  });
}

function referencesContainMessageId(
  referencesForReply: string,
  messageId: string | null | undefined,
) {
  if (!referencesForReply || !messageId) return false;

  const refs = referencesForReply.toLowerCase();
  const id = messageId.trim().toLowerCase();
  const idWithoutBrackets = id.replace(/^</, "").replace(/>$/, "");

  return refs.includes(id) || refs.includes(idWithoutBrackets);
}

async function handleLeadDemoReply(params: {
  email: string;
  subject: string;
  message: string;
  incomingMessageId: string;
  referencesForReply: string;
}) {
  const { data: portfolioLeads, error } = await supabase
    .from("portfolio_leads")
    .select("*")
    .ilike("email", params.email)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Portfolio lead lookup failed:", error);
    return false;
  }

  const portfolioLead = (portfolioLeads || []).find((lead) =>
    referencesContainMessageId(
      params.referencesForReply,
      lead.customer_confirmation_message_id,
    ),
  );

  if (!portfolioLead) {
    return false;
  }

  console.log("Inbound email matched portfolio lead:", portfolioLead.id);

  const conversation = [
    {
      role: "user",
      content: portfolioLead.message || "",
    },
  ];

  if (portfolioLead.ai_suggested_reply) {
    conversation.push({
      role: "assistant",
      content: portfolioLead.ai_suggested_reply,
    });
  }

  conversation.push({
    role: "user",
    content: params.message,
  });

  const suggestedReply = await generateResponse(conversation);

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("portfolio_leads")
    .update({
      latest_customer_reply: params.message,
      latest_customer_reply_at: now,
      latest_customer_reply_subject: params.subject,
      latest_customer_reply_message_id: params.incomingMessageId || null,
      latest_customer_reply_references: params.referencesForReply || null,
      latest_ai_reply_to_customer: suggestedReply,
      latest_ai_reply_generated_at: now,
      updated_at: now,
    })
    .eq("id", portfolioLead.id);

  if (updateError) {
    console.error("Failed to update portfolio lead reply:", updateError);
    throw new Error(updateError.message);
  }

  return true;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("INBOUND:", JSON.stringify(body, null, 2));

    const data = body?.data || {};

    const email = parseEmailAddress(data?.from || body?.email);

    if (isSystemEmail(email)) {
      console.log("Ignoring inbound email from system address:", email);

      return Response.json({
        success: true,
        ignored: true,
        reason: "Ignored system-generated email to prevent auto-reply loop.",
      });
    }

    let subject = data?.subject || "Your inquiry";

    let incomingMessageId =
      data?.message_id ||
      data?.messageId ||
      getHeader(data?.headers, "Message-ID") ||
      "";

    let referencesHeader =
      data?.references ||
      getHeader(data?.headers, "References") ||
      incomingMessageId ||
      "";

    let message = "";
    let htmlContent = "";
    let receivedEmailForStorage: any = null;

    const emailId = data?.email_id || data?.id;

    if (emailId) {
      const { data: receivedEmail, error: receivedEmailError } =
        await resend.emails.receiving.get(emailId);

      if (receivedEmailError) {
        console.error("Failed to fetch received email:", receivedEmailError);

        return Response.json(
          {
            success: false,
            error:
              receivedEmailError.message ||
              "Failed to fetch received email body",
          },
          { status: 500 },
        );
      }

      console.log(
        "RECEIVED EMAIL FULL:",
        JSON.stringify(receivedEmail, null, 2),
      );

      receivedEmailForStorage = receivedEmail;

      const received: any = receivedEmail;
      const receivedHeaders = received?.headers || {};

      subject = received?.subject || subject;

      incomingMessageId =
        received?.message_id ||
        received?.messageId ||
        getHeader(receivedHeaders, "Message-ID") ||
        incomingMessageId;

      referencesHeader =
        received?.references ||
        getHeader(receivedHeaders, "References") ||
        referencesHeader ||
        incomingMessageId;

      htmlContent =
        received?.html || received?.html_body || received?.body?.html || "";

      message = findEmailBody(received);

      const rawUrl =
        received?.raw?.download_url ||
        received?.raw?.downloadUrl ||
        received?.raw?.url ||
        received?.raw_download_url ||
        received?.download_url ||
        "";

      if (!message && rawUrl) {
        console.log("Fetching raw email from:", rawUrl);

        let rawResponse = await fetch(rawUrl);

        if (!rawResponse.ok) {
          rawResponse = await fetch(rawUrl, {
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
          });
        }

        if (rawResponse.ok) {
          const rawEmail = await rawResponse.text();
          message = extractMimeBody(rawEmail);
        } else {
          console.error("Failed to fetch raw email:", rawResponse.status);
        }
      }

      if (!message) {
        console.log(
          "NO BODY FOUND. RECEIVED EMAIL KEYS:",
          getObjectKeysDeep(received),
        );
      }
    } else {
      message =
        data?.text ||
        data?.snippet ||
        body?.message ||
        (data?.html ? stripHtml(data.html) : "");

      htmlContent = data?.html || "";
    }

    message = message.trim();

    if (!email || !message) {
      console.log("Missing parsed fields:", {
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

    const referencesForReply = [referencesHeader, incomingMessageId]
      .filter(Boolean)
      .join(" ")
      .trim();

    const handledLeadDemoReply = await handleLeadDemoReply({
      email,
      subject,
      message,
      incomingMessageId,
      referencesForReply,
    });

    if (handledLeadDemoReply) {
      return Response.json({
        success: true,
        lead_demo_reply: true,
        auto_sent: false,
      });
    }

    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let currentLead = lead;

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
            last_customer_message: message,
            last_subject: subject,
            last_message_at: new Date().toISOString(),
            last_message_id: incomingMessageId,
            references_header: referencesForReply,
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

    const contactInfo = await extractContactInfo(message);

    console.log("Contact info extraction:", contactInfo);

    const contactUpdates: any = {};

    if (contactInfo?.phone) {
      contactUpdates.phone = contactInfo.phone;
    }

    if (contactInfo?.name && isPlaceholderName(currentLead.name, email)) {
      contactUpdates.name = contactInfo.name;
    }

    if (Object.keys(contactUpdates).length > 0) {
      await supabase
        .from("leads")
        .update({
          ...contactUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentLead.id);

      currentLead = {
        ...currentLead,
        ...contactUpdates,
      };
    }

    const { error: insertCustomerError } = await supabase
      .from("messages")
      .insert([
        {
          lead_id: currentLead.id,
          sender: "customer",
          content: message,
          subject,
          resend_email_id: emailId,
          message_id: incomingMessageId,
          references_header: referencesForReply,
          html_content: htmlContent || null,
          raw_payload: {
            webhook: body,
            received_email: receivedEmailForStorage,
          },
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

    await supabase
      .from("leads")
      .update({
        summary: message.substring(0, 120),
        last_customer_message: message,
        last_subject: subject,
        last_message_at: new Date().toISOString(),
        last_message_id: incomingMessageId,
        references_header: referencesForReply,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentLead.id);

    const hasPhone = Boolean(currentLead.phone || contactInfo?.phone);
    const hasRealName =
      Boolean(contactInfo?.name) || !isPlaceholderName(currentLead.name, email);

    if (
      currentLead.conversation_stage === "collecting_contact_info" &&
      hasPhone &&
      hasRealName &&
      (currentLead.scheduled_date || currentLead.scheduled_time)
    ) {
      const confirmation = `Perfect — we have you scheduled for ${
        currentLead.scheduled_time || ""
      } ${currentLead.scheduled_date || ""}. We'll follow up shortly.`;

      await supabase
        .from("leads")
        .update({
          status: "scheduled",
          conversation_stage: "scheduled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentLead.id);

      const sent = await sendEmail(email, `Re: ${subject}`, confirmation, {
        inReplyTo: incomingMessageId,
        references: referencesForReply,
        quotedText: message,
      });

      const sentData: any = (sent as any)?.data || sent;

      await supabase.from("messages").insert([
        {
          lead_id: currentLead.id,
          sender: "system",
          content: confirmation,
          subject: `Re: ${subject}`,
          resend_email_id: sentData?.id || null,
          in_reply_to: incomingMessageId,
          references_header: referencesForReply,
        },
      ]);

      return Response.json({
        success: true,
        scheduled: true,
        contact_info_received: true,
      });
    }

    const scheduling = await detectScheduling(message);

    console.log("Scheduling detection:", scheduling);

    if (scheduling.is_scheduling) {
      if (!hasPhone || !hasRealName) {
        const askForContact =
          "That time should work. Before I confirm the appointment, what is your name and the best phone number to reach you?";

        await supabase
          .from("leads")
          .update({
            status: "contacted",
            conversation_stage: "collecting_contact_info",
            scheduled_date: scheduling.date,
            scheduled_time: scheduling.time,
            suggested_response: askForContact,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentLead.id);

        const sent = await sendEmail(email, `Re: ${subject}`, askForContact, {
          inReplyTo: incomingMessageId,
          references: referencesForReply,
          quotedText: message,
        });

        const sentData: any = (sent as any)?.data || sent;

        await supabase.from("messages").insert([
          {
            lead_id: currentLead.id,
            sender: "system",
            content: askForContact,
            subject: `Re: ${subject}`,
            resend_email_id: sentData?.id || null,
            in_reply_to: incomingMessageId,
            references_header: referencesForReply,
          },
        ]);

        return Response.json({
          success: true,
          needs_contact_info: true,
        });
      }

      const confirmation = `Great — we have you scheduled for ${
        scheduling.time || ""
      } ${scheduling.date || ""}. We'll follow up shortly.`;

      await supabase
        .from("leads")
        .update({
          status: "scheduled",
          conversation_stage: "scheduled",
          scheduled_date: scheduling.date,
          scheduled_time: scheduling.time,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentLead.id);

      const sent = await sendEmail(email, `Re: ${subject}`, confirmation, {
        inReplyTo: incomingMessageId,
        references: referencesForReply,
        quotedText: message,
      });

      const sentData: any = (sent as any)?.data || sent;

      await supabase.from("messages").insert([
        {
          lead_id: currentLead.id,
          sender: "system",
          content: confirmation,
          subject: `Re: ${subject}`,
          resend_email_id: sentData?.id || null,
          in_reply_to: incomingMessageId,
          references_header: referencesForReply,
        },
      ]);

      console.log("Lead scheduled — stopping AI loop");

      return Response.json({
        success: true,
        scheduled: true,
      });
    }

    const { data: history } = await supabase
      .from("messages")
      .select("sender, content")
      .eq("lead_id", currentLead.id)
      .order("created_at", { ascending: true });

    const conversation = (history || []).map((m) => ({
      role: m.sender === "customer" ? "user" : "assistant",
      content: m.content,
    }));

    const reply = await generateResponse(conversation);

    const sent = await sendEmail(email, `Re: ${subject}`, reply, {
      inReplyTo: incomingMessageId,
      references: referencesForReply,
      quotedText: message,
    });

    const sentData: any = (sent as any)?.data || sent;

    const { error: insertSystemError } = await supabase
      .from("messages")
      .insert([
        {
          lead_id: currentLead.id,
          sender: "system",
          content: reply,
          subject: `Re: ${subject}`,
          resend_email_id: sentData?.id || null,
          in_reply_to: incomingMessageId,
          references_header: referencesForReply,
        },
      ]);

    if (insertSystemError) {
      console.error("System insert error:", insertSystemError);
    }

    await supabase
      .from("leads")
      .update({
        suggested_response: reply,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentLead.id);

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
