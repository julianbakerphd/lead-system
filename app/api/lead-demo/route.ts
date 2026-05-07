import supabase from "@/lib/supabase";

type UpdateStatusBody = {
  id?: string;
  status?: string;
};

const allowedStatuses = ["new", "contacted", "quoted", "won", "lost"];

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as UpdateStatusBody;

    const id = cleanText(body.id);
    const status = cleanText(body.status).toLowerCase();

    if (!id || !status) {
      return Response.json(
        {
          success: false,
          error: "Missing lead id or status.",
        },
        { status: 400 },
      );
    }

    if (!allowedStatuses.includes(status)) {
      return Response.json(
        {
          success: false,
          error: "Invalid status.",
        },
        { status: 400 },
      );
    }

    const updates: Record<string, string | null> = {
      status,
    };

    const now = new Date().toISOString();

    if (status === "contacted") {
      updates.contacted_at = now;
    }

    if (status === "quoted") {
      updates.quoted_at = now;
    }

    if (status === "won" || status === "lost") {
      updates.closed_at = now;
      updates.outcome = status;
    }

    if (status === "new") {
      updates.outcome = null;
      updates.contacted_at = null;
      updates.quoted_at = null;
      updates.closed_at = null;
    }

    const { data, error } = await supabase
      .from("portfolio_leads")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

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
  } catch (err: any) {
    return Response.json(
      {
        success: false,
        error: err?.message || "Status update failed.",
      },
      { status: 500 },
    );
  }
}
