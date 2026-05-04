import supabase from "@/lib/supabase";
import { generateResponse } from "@/lib/ai";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("INBOUND:", body);

    // ✅ Extract email safely (handle "Name <email>" format)
    let rawEmail = body?.data?.from || body?.email;

    const emailMatch = rawEmail?.match(/<(.+?)>/);
    const email = (emailMatch ? emailMatch[1] : rawEmail)
      ?.trim()
      ?.toLowerCase();

    const message = body?.data?.text || body?.data?.html || body?.message || "";

    if (!email || !message) {
      return Response.json(
        { success: false, error: "Missing email or message" },
        { status: 400 },
      );
    }

    console.log("Parsed email:", email);
    console.log("Parsed message:", message);

    // ✅ FIX — case-insensitive lookup + latest lead
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

    // ✅ Insert customer message (with error check)
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
      console.error("Customer message insert failed:", insertCustomerError);
      return Response.json(
        { success: false, error: "Insert failed" },
        { status: 500 },
      );
    }

    // 3. generate AI reply
    const reply = await generateResponse(message);

    // ✅ Insert system reply (with error check)
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
      console.error("System message insert failed:", insertSystemError);
    }

    // 5. send reply email
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
