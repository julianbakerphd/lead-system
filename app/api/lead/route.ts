import supabase from "@/lib/supabase";

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

export async function POST(req: Request) {
  const request_id = crypto.randomUUID();

  try {
    const body = await req.json();

    // 🔹 Log incoming request
    await logStep(request_id, "received", body);

    const { name, email, message } = body;

    // 🔹 Validate required fields
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

    // 🔹 Validate email format
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

    // 🔹 Log validated data
    await logStep(request_id, "validated", { name, email, message });

    // 🔹 Insert into database
    const { data, error } = await supabase
      .from("leads")
      .insert([{ name, email, message }])
      .select();

    if (error) {
      await logStep(request_id, "db_error", body, error.message);

      return Response.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    // 🔹 Log successful insert
    await logStep(request_id, "inserted", data);

    return Response.json({
      success: true,
      data,
    });
  } catch (err) {
    await logStep(request_id, "json_error", null, "Invalid JSON");

    return Response.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }
}
