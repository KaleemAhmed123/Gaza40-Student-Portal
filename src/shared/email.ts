import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import { env } from "../config/env";

export type EmailInput = {
  to: string[];
  subject: string;
  text: string;
  html?: string;
};

let smtpTransporter: nodemailer.Transporter | null = null;

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
    const transporter = getSmtpTransporter();
    if (!transporter) {
      console.warn("Email notification skipped: SMTP is not configured properly");
      return;
    }

    const logoPath = path.join(process.cwd(), "LOGO.png");
    const attachments = [];
    if (fs.existsSync(logoPath)) {
      attachments.push({
        filename: "LOGO.png",
        path: logoPath,
        cid: "gaza40logo"
      });
    }

    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: recipients,
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments
    });

    console.info("Email notification sent via SMTP");
  } catch (error) {
    console.error(
      `Email notification failed: ${error instanceof Error ? error.message : "Unknown email error"}`
    );
  }
}
