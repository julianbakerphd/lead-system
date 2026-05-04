import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email, response } = await req.json();

    await sendEmail(email, "Follow-up", response);

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({
      success: false,
      error: "Resend failed",
    });
  }
}
