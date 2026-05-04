import supabase from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { id, status } = await req.json();

    const { error } = await supabase
      .from("leads")
      .update({ status })
      .eq("id", id);

    if (error) {
      return Response.json({ success: false, error: error.message });
    }

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({
      success: false,
      error: "Update failed",
    });
  }
}
