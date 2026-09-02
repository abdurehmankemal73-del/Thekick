import nodemailer from "nodemailer";
import { CLUB } from "@/lib/constants";

export class MailError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "MailError";
  }
}

const REQUIRED_SMTP_VARS = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"] as const;

const PLACEHOLDER_VALUES = new Set([
  "smtp.example.com",
  "your-smtp-username",
  "your-smtp-password",
  "your-gmail@gmail.com",
  "your-16-character-app-password",
  "replace-with-gmail-app-password",
  "noreply@thekick.local",
  "noreply@example.com",
]);

function readEnv(name: string) {
  const raw = process.env[name];
  if (raw == null) return undefined;
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value || undefined;
}

function extractEmail(value: string) {
  const angled = value.match(/<([^>]+)>/);
  return (angled ? angled[1] : value).trim();
}

function isPlaceholder(value: string) {
  const normalized = value.toLowerCase();
  if (PLACEHOLDER_VALUES.has(normalized)) return true;
  if (normalized.startsWith("replace-with-")) return true;
  return [...PLACEHOLDER_VALUES].some((placeholder) => normalized.includes(placeholder));
}

function normalizeHost(host: string) {
  const value = host.toLowerCase();
  if (value === "gmail" || value === "google" || value === "smtp.gmail.com") {
    return "smtp.gmail.com";
  }
  return host;
}

function isGmailUser(value: string | undefined) {
  const email = extractEmail(value ?? "").toLowerCase();
  return email.endsWith("@gmail.com") || email.endsWith("@googlemail.com");
}

function intendsGmail() {
  const host = readEnv("SMTP_HOST")?.toLowerCase();
  return (
    host === "gmail" ||
    host === "google" ||
    host === "smtp.gmail.com" ||
    isGmailUser(readEnv("SMTP_USER")) ||
    isGmailUser(readEnv("SMTP_FROM"))
  );
}

function gmailPass(value: string) {
  return value.replace(/[\s-]/g, "");
}

function looksLikeGmailAppPassword(value: string) {
  return /^[a-z]{16}$/i.test(gmailPass(value));
}

const GMAIL_APP_PASSWORD_HELP =
  "Gmail rejected the login. Create a Google App Password at https://myaccount.google.com/apppasswords and set SMTP_PASS to that 16-character password (spaces are OK). Do not use your normal Gmail password. 2-Step Verification must be on.";

export function getMailConfig() {
  const requestedHost = readEnv("SMTP_HOST");
  const userRaw = readEnv("SMTP_USER");
  const pass = readEnv("SMTP_PASS");
  const from = readEnv("SMTP_FROM") || userRaw;
  const user = userRaw ? extractEmail(userRaw) : undefined;
  const portRaw = readEnv("SMTP_PORT");
  const gmail = intendsGmail();
  const host = requestedHost ? normalizeHost(requestedHost) : gmail ? "smtp.gmail.com" : undefined;
  const port = Number(portRaw ?? (gmail ? 587 : 587));

  const missing = REQUIRED_SMTP_VARS.filter((name) => {
    if (name === "SMTP_HOST" && gmail) return false;
    if (name === "SMTP_FROM" && user && !isPlaceholder(user)) return false;
    const value = readEnv(name);
    return !value || isPlaceholder(value);
  });

  if (gmail && (!user || isPlaceholder(user))) {
    throw new MailError(
      "Gmail is selected but SMTP_USER is missing. Set SMTP_USER to your full Gmail address.",
    );
  }

  if (gmail && (!pass || isPlaceholder(pass))) {
    throw new MailError(GMAIL_APP_PASSWORD_HELP);
  }

  if (gmail && pass && !looksLikeGmailAppPassword(pass)) {
    throw new MailError(GMAIL_APP_PASSWORD_HELP);
  }

  if (missing.length > 0) {
    throw new MailError(
      `Email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM on the server. Missing or placeholder: ${missing.join(", ")}.`,
    );
  }

  if (!host || !user || !pass || !from) {
    throw new MailError(
      "Email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM on the server.",
    );
  }

  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new MailError("SMTP_PORT must be a valid port number.");
  }

  return {
    host,
    port,
    secure: readEnv("SMTP_SECURE") === "true" || port === 465,
    requireTLS: host === "smtp.gmail.com" && port === 587,
    user,
    pass: gmail ? gmailPass(pass) : pass,
    from,
  };
}

function allowDevelopmentMailbox() {
  return process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test" && !process.env.NETLIFY;
}

type MailTransport = {
  transporter: nodemailer.Transporter;
  from: string;
  preview: boolean;
};

let developmentAccount: Awaited<ReturnType<typeof nodemailer.createTestAccount>> | null = null;

async function developmentMailbox(): Promise<MailTransport> {
  try {
    developmentAccount ??= await nodemailer.createTestAccount();
  } catch (error) {
    throw new MailError(
      "Email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM on the server.",
      error,
    );
  }

  return {
    transporter: nodemailer.createTransport({
      host: developmentAccount.smtp.host,
      port: developmentAccount.smtp.port,
      secure: developmentAccount.smtp.secure,
      auth: { user: developmentAccount.user, pass: developmentAccount.pass },
    }),
    from: developmentAccount.user,
    preview: true,
  };
}

async function resolveTransport(): Promise<MailTransport> {
  if (readEnv("SMTP_HOST")?.toLowerCase() === "ethereal") {
    return developmentMailbox();
  }

  try {
    const config = getMailConfig();
    return {
      transporter: nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        requireTLS: config.requireTLS,
        auth: { user: config.user, pass: config.pass },
      }),
      from: config.from,
      preview: false,
    };
  } catch (error) {
    if (!allowDevelopmentMailbox() || intendsGmail()) throw error;
    return developmentMailbox();
  }
}

export async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const mail = await resolveTransport();

  try {
    const info = await mail.transporter.sendMail({
      from: formatFrom(mail.from),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    const accepted = (info.accepted ?? []).map((value: unknown) => String(value));
    const rejected = (info.rejected ?? []).map((value: unknown) => String(value));
    const confirmed =
      accepted.some((address: string) => address.toLowerCase().includes(input.to.toLowerCase())) ||
      (accepted.length > 0 && rejected.length === 0);

    if (!confirmed || rejected.length > 0) {
      throw new MailError("The email service did not confirm delivery to the student.");
    }

    const previewUrl = mail.preview ? nodemailer.getTestMessageUrl(info) : false;
    const preview = typeof previewUrl === "string" ? previewUrl : undefined;
    if (preview) {
      console.info("Approval email preview:", preview);
    }

    return {
      messageId: info.messageId,
      accepted,
      previewUrl: preview,
    };
  } catch (error) {
    if (error instanceof MailError) throw error;
    const message = error instanceof Error ? error.message : "Email sending failed";
    if (/invalid login|eauth|username and password|badcredentials/i.test(message)) {
      throw new MailError(GMAIL_APP_PASSWORD_HELP, error);
    }
    throw new MailError(message, error);
  }
}

export function approvalEmail(fullName: string) {
  const subject = `Your ${CLUB.shortName} registration has been approved`;
  const text = [
    `Hello ${fullName},`,
    "",
    `Your registration with ${CLUB.fullName} (${CLUB.shortName}) has been approved.`,
    "You can now sign in with the email and password you used to register.",
    "",
    `Welcome to ${CLUB.shortName}.`,
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <p>Hello ${escapeHtml(fullName)},</p>
      <p>Your registration with <strong>${escapeHtml(CLUB.fullName)}</strong> has been <strong>approved</strong>.</p>
      <p>You can now sign in with the email and password you used to register.</p>
      <p>Welcome to ${escapeHtml(CLUB.shortName)}.</p>
    </div>
  `;
  return { subject, text, html };
}

function formatFrom(from: string) {
  if (from.includes("<")) return from;
  return `"${CLUB.shortName}" <${from}>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
