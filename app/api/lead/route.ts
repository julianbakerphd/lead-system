import supabase from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, email, message } = body;

    // VALIDATION
    if (!name || !email || !message) {
      return Response.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      );
    }

    // simple email check
    if (!email.includes("@")) {
      return Response.json(
        {
          success: false,
          error: "Invalid email format",
        },
        { status: 400 },
      );
    }

    // INSERT
    const { data, error } = await supabase
      .from("leads")
      .insert([{ name, email, message }])
      .select();

    if (error) {
      return Response.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      data,
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        error: "Invalid JSON",
      },
      { status: 400 },
    );
  }
}
