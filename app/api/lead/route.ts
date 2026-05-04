import supabase from "@/lib/supabase";
import { processLead, generateResponse } from "@/lib/ai";
import { sendEmail } from "@/lib/email";

async function logStep(
  request_id: string,
  stage: string,
  data: any,
  error: string | null = null,
) {
  await supabase.from("logs").insert([
    {
      request_id,
      stage,
      data,
      error,
    },
  ]);
}

//
// ✅ GET handler (unchanged)
//
export async function GET() {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ success: false, error: error.message });
  }

  return Response.json({ success: true, data });
}

//
// ✅ POST handler (MINIMAL UPDATE)
//
export async function POST(req: Request) {
  const request_id = crypto.randomUUID();

  try {
    const body = await req.json();

    await logStep(request_id, "received", body);

    const { name, email, message } = body;

    if (!name || !email || !message) {
      await logStep(
        request_id,
        "validation_failed",
        body,
        "Missing required fields",
      );

      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!email.includes("@")) {
      await logStep(
        request_id,
        "validation_failed",
        body,
        "Invalid email format",
      );

      return Response.json(
        { success: false, error: "Invalid email format" },
        { status: 400 },
      );
    }

    await logStep(request_id, "validated", { name, email, message });

    let aiResult;

    try {
      aiResult = await processLead(message);
      await logStep(request_id, "ai_processed", aiResult);
    } catch (aiError: any) {
      await logStep(
        request_id,
        "ai_error",
        { message },
        aiError?.message || "AI processing failed",
      );

      return Response.json(
        { success: false, error: "AI processing failed" },
        { status: 500 },
      );
    }

    let reply: string;

    try {
      reply = await generateResponse([
        {
          role: "user",
          content: message,
        },
      ]);
      await logStep(request_id, "response_generated", { reply });
    } catch (respError: any) {
      await logStep(
        request_id,
        "response_error",
        { message },
        respError?.message || "Response generation failed",
      );

      return Response.json(
        { success: false, error: "Response generation failed" },
        { status: 500 },
      );
    }

    try {
      await sendEmail(email, "Thanks for your inquiry", reply);
      await logStep(request_id, "email_sent", { email });
    } catch (emailError: any) {
      await logStep(
        request_id,
        "email_error",
        { email },
        emailError?.message || "Email failed",
      );
    }

    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          request_id,
          name,
          email,
          message,
          summary: aiResult.summary || "No summary",
          category: aiResult.category || "unknown",
          priority: aiResult.priority || "medium",
          lead_quality: aiResult.lead_quality || "unknown",
          suggested_response: reply,
          status: "new",
        },
      ])
      .select();

    if (error) {
      await logStep(request_id, "db_error", body, error.message);

      return Response.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    await logStep(request_id, "inserted", data);

    // ✅ NEW — store initial system message (MINIMAL ADDITION)
    const lead = data?.[0];

    if (lead) {
      await supabase.from("messages").insert([
        {
          lead_id: lead.id,
          sender: "system",
          content: reply,
        },
      ]);
    }

    return Response.json({
      success: true,
      data,
    });
  } catch (err: any) {
    await logStep(
      request_id,
      "unexpected_error",
      null,
      err?.message || "Unknown error",
    );

    return Response.json(
      { success: false, error: "Unexpected error" },
      { status: 500 },
    );
  }
}
