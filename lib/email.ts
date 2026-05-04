import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmail(to: string, subject: string, body: string) {
  return await resend.emails.send({
    from: "onboarding@resend.dev",
    to,
    subject,
    text: body,
  });
}
