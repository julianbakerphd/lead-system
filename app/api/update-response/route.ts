import supabase from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { id, response } = await req.json();

    const { error } = await supabase
      .from("leads")
      .update({
        suggested_response: response,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return Response.json({ success: false, error: error.message });
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({
      success: false,
      error: "Update failed",
    });
  }
}
