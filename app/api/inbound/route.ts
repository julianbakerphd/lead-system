import supabase from "@/lib/supabase";
import { generateResponse } from "@/lib/ai";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("INBOUND:", body);

    // ✅ FIX 1 — support BOTH Resend + Postman formats
    const email = body?.data?.from || body?.email;

    const message = body?.data?.text || body?.data?.html || body?.message || "";

    if (!email || !message) {
      return Response.json(
        { success: false, error: "Missing email or message" },
        { status: 400 },
      );
    }

    // ✅ FIX 2 — safer lead lookup (no crash on duplicates)
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false }) // pick latest lead
      .limit(1)
      .maybeSingle();

    if (leadError || !lead) {
      console.log("Lead not found for:", email);
      return Response.json(
        { success: false, error: "Lead not found" },
        { status: 404 },
      );
    }

    // 2. store customer message
    await supabase.from("messages").insert([
      {
        lead_id: lead.id,
        sender: "customer",
        content: message,
      },
    ]);

    // 3. generate AI reply
    const reply = await generateResponse(message);

    // 4. store system reply
    await supabase.from("messages").insert([
      {
        lead_id: lead.id,
        sender: "system",
        content: reply,
      },
    ]);

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
