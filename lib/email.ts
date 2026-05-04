import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

type SendEmailOptions = {
  inReplyTo?: string;
  references?: string;
  quotedText?: string;
};

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  options: SendEmailOptions = {},
) {
  const textBody = options.quotedText
    ? `${body}

On the previous email, the customer wrote:
> ${options.quotedText.replace(/\n/g, "\n> ")}`
    : body;

  const headers: Record<string, string> = {};

  if (options.inReplyTo) {
    headers["In-Reply-To"] = options.inReplyTo;
  }

  if (options.references) {
    headers["References"] = options.references;
  }

  return await resend.emails.send({
    from: "support@contact.jbakertech.com",
    to,
    subject,
    text: textBody,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  });
}
