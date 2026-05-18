import { Resend } from "resend";
import { env } from "../config/env";

type EmailInput = {
  to: string[];
  subject: string;
  text: string;
};

let resendClient: Resend | null = null;

function getResendClient() {
  if (!env.RESEND_API_KEY) {
    return null;
  }

  resendClient ??= new Resend(env.RESEND_API_KEY);
  return resendClient;
}

export function sendEmailBestEffort(input: EmailInput) {
  const client = getResendClient();
  const recipients = input.to.filter(Boolean);

  if (!client) {
    console.warn("Email notification skipped: RESEND_API_KEY is not configured");
    return;
  }

  if (recipients.length === 0) {
    console.warn("Email notification skipped: no recipients");
    return;
  }

  void client.emails
    .send({
      from: env.EMAIL_FROM,
      to: recipients,
      subject: input.subject,
      text: input.text
    })
    .then((result) => {
      if (result.error) {
        console.error(`Email notification failed: ${result.error.message}`);
        return;
      }

      console.info("Email notification accepted by provider");
    })
    .catch((error) => {
      console.error(
        `Email notification failed: ${error instanceof Error ? error.message : "Unknown email error"}`
      );
    });
}
