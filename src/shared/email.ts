import { Resend } from "resend";
import nodemailer from "nodemailer";
import { env } from "../config/env";

export type EmailInput = {
  to: string[];
  subject: string;
  text: string;
  html?: string;
};

let resendClient: Resend | null = null;
let smtpTransporter: nodemailer.Transporter | null = null;

function getResendClient() {
  if (!env.RESEND_API_KEY) {
    return null;
  }

  resendClient ??= new Resend(env.RESEND_API_KEY);
  return resendClient;
}

function getSmtpTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_PORT) {
    return null;
  }

  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: (env.SMTP_USER && env.SMTP_PASS) ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      } : undefined,
    });
  }

  return smtpTransporter;
}

export async function sendEmailBestEffort(input: EmailInput) {
  const recipients = input.to.filter(Boolean);

  if (recipients.length === 0) {
    console.warn("Email notification skipped: no recipients");
    return;
  }

  try {
    if (env.EMAIL_PROVIDER === "smtp") {
      const transporter = getSmtpTransporter();
      if (!transporter) {
        console.warn("Email notification skipped: SMTP is not configured properly");
        return;
      }

      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: recipients,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });

      console.info("Email notification sent via SMTP");

    } else {
      // Default to Resend
      const client = getResendClient();
      if (!client) {
        console.warn("Email notification skipped: RESEND_API_KEY is not configured");
        return;
      }

      const result = await client.emails.send({
        from: env.EMAIL_FROM,
        to: recipients,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });

      if (result.error) {
        console.error(`Email notification failed (Resend): ${result.error.message}`);
        return;
      }

      console.info("Email notification accepted by Resend");
    }
  } catch (error) {
    console.error(
      `Email notification failed: ${error instanceof Error ? error.message : "Unknown email error"}`
    );
  }
}
