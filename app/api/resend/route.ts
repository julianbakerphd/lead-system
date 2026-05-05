import supabase from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { id, email, response } = await req.json();

    await sendEmail(email, "Follow-up", response);

    // ✅ NEW — store manually sent dashboard reply in messages
    if (id) {
      await supabase.from("messages").insert([
        {
          lead_id: id,
          sender: "system",
          content: response,
        },
      ]);

      await supabase
        .from("leads")
        .update({
          suggested_response: response,
          status: "contacted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    }

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({
      success: false,
      error: "Resend failed",
    });
  }
}
