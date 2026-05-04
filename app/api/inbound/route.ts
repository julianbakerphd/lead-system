import supabase from "@/lib/supabase";
import { generateResponse } from "@/lib/ai";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("INBOUND:", body);

    let rawEmail = body?.data?.from || body?.email;

    const emailMatch = rawEmail?.match(/<(.+?)>/);
    const email = (emailMatch ? emailMatch[1] : rawEmail)
      ?.trim()
      ?.toLowerCase();

    const message =
      body?.data?.text ||
      body?.data?.html ||
      body?.message ||
      "";

    if (!email || !message) {
      return Response.json(
        { success: false, error: "Missing email or message" },
        { status: 400 },
      );
    }

    console.log("Parsed email:", email);
    console.log("Parsed message:", message);

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (leadError || !lead) {
      console.log("Lead not found for:", email);
      return Response.json(
        { success: false, error: "Lead not found" },
        { status: 404 },
      );
    }

    console.log("Lead found:", lead.id);

    // 1. store customer message
    const { error: insertCustomerError } = await supabase
      .from("messages")
      .insert([
        {
          lead_id: lead.id,
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

    // 🔥 NEW — get conversation history
    const { data: history } = await supabase
      .from("messages")
      .select("sender, content")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: true });

    // 🔥 NEW — format for AI
    const conversation = (history || []).map((m) => ({
      role: m.sender === "customer" ? "user" : "assistant",
      content: m.content,
    }));

    // 🔥 NEW — include latest message
    conversation.push({
      role: "user",
      content: message,
    });

    // 🔥 UPDATED — contextual AI response
    const reply = await generateResponse(conversation);

    // 4. store system reply
    const { error: insertSystemError } = await supabase
      .from("messages")
      .insert([
        {
          lead_id: lead.id,
          sender: "system",
          content: reply,
        },
      ]);

    if (insertSystemError) {
      console.error("System insert error:", insertSystemError);
    }

    // 5. send email
    await sendEmail(email, "Re: Your inquiry", reply);

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