import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { approvalEmail, getMailConfig, MailError, sendMail } from "@/lib/mail";
import { CLUB } from "@/lib/constants";

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(),
    createTestAccount: vi.fn(),
    getTestMessageUrl: vi.fn(),
  },
}));

import nodemailer from "nodemailer";

const mockedCreateTransport = vi.mocked(nodemailer.createTransport);

describe("approval email", () => {
  it("includes the student name and club name", () => {
    const email = approvalEmail("Liya Bekele");
    expect(email.subject).toContain(CLUB.shortName);
    expect(email.text).toContain("Liya Bekele");
    expect(email.text).toContain(CLUB.fullName);
    expect(email.html).toContain("Liya Bekele");
    expect(email.html).toContain(CLUB.fullName);
    expect(email.html).toContain("approved");
  });
});

describe("SMTP configuration", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("throws a clear error when SMTP variables are missing", () => {
    expect(() => getMailConfig()).toThrow(MailError);
    expect(() => getMailConfig()).toThrow(/SMTP_HOST/);
    expect(() => getMailConfig()).toThrow(/SMTP_USER/);
    expect(() => getMailConfig()).toThrow(/SMTP_PASS/);
    expect(() => getMailConfig()).toThrow(/SMTP_FROM/);
  });

  it("treats .env.example placeholders as unconfigured", () => {
    vi.stubEnv("SMTP_HOST", "smtp.example.com");
    vi.stubEnv("SMTP_USER", "your-smtp-username");
    vi.stubEnv("SMTP_PASS", "your-smtp-password");
    vi.stubEnv("SMTP_FROM", '"THE KICK <noreply@example.com>"');
    expect(() => getMailConfig()).toThrow(/placeholder/i);
  });

  it("loads Gmail SMTP settings and strips App Password spaces", () => {
    vi.stubEnv("SMTP_HOST", "gmail");
    vi.stubEnv("SMTP_USER", "club@gmail.com");
    vi.stubEnv("SMTP_PASS", "abcd efgh ijkl mnop");
    vi.stubEnv("SMTP_FROM", '"THE KICK <club@gmail.com>"');
    const config = getMailConfig();
    expect(config.host).toBe("smtp.gmail.com");
    expect(config.port).toBe(587);
    expect(config.requireTLS).toBe(true);
    expect(config.user).toBe("club@gmail.com");
    expect(config.pass).toBe("abcdefghijklmnop");
  });

  it("rejects a normal Gmail password before connecting", () => {
    vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
    vi.stubEnv("SMTP_USER", "club@gmail.com");
    vi.stubEnv("SMTP_PASS", "MyNormalGmailPassword");
    expect(() => getMailConfig()).toThrow(/App Password/i);
  });

  it("treats Coolify SMTP_PASS placeholders as unconfigured", () => {
    vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
    vi.stubEnv("SMTP_USER", "club@gmail.com");
    vi.stubEnv("SMTP_PASS", "replace-with-gmail-app-password");
    expect(() => getMailConfig()).toThrow(/App Password/i);
  });

  it("uses the address inside SMTP_USER display names", () => {
    vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
    vi.stubEnv("SMTP_USER", "THE KICK <club@gmail.com>");
    vi.stubEnv("SMTP_PASS", "abcd efgh ijkl mnop");
    expect(getMailConfig().user).toBe("club@gmail.com");
  });

  it("tells the admin to create a Gmail App Password when SMTP_PASS is missing", () => {
    vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
    vi.stubEnv("SMTP_USER", "club@gmail.com");
    expect(() => getMailConfig()).toThrow(/App Password/i);
  });

  it("loads quoted SMTP values from the environment", () => {
    vi.stubEnv("SMTP_HOST", "smtp.provider.test");
    vi.stubEnv("SMTP_PORT", "587");
    vi.stubEnv("SMTP_USER", "club@provider.test");
    vi.stubEnv("SMTP_PASS", "not-a-real-password");
    vi.stubEnv("SMTP_FROM", '"THE KICK <club@provider.test>"');
    const config = getMailConfig();
    expect(config.host).toBe("smtp.provider.test");
    expect(config.port).toBe(587);
    expect(config.user).toBe("club@provider.test");
    expect(config.from).toBe("THE KICK <club@provider.test>");
    expect(config.pass).toBe("not-a-real-password");
  });

  it("sends mail when SMTP is configured", async () => {
    vi.stubEnv("SMTP_HOST", "smtp.provider.test");
    vi.stubEnv("SMTP_USER", "club@provider.test");
    vi.stubEnv("SMTP_PASS", "not-a-real-password");
    vi.stubEnv("SMTP_FROM", "club@provider.test");
    mockedCreateTransport.mockReturnValue({
      sendMail: vi.fn(async (message: { to: string }) => ({
        messageId: "<test-message>",
        accepted: [message.to],
        rejected: [],
      })),
    } as never);

    const result = await sendMail({
      to: "student@example.test",
      subject: "Approved",
      text: "Your registration was approved.",
      html: "<p>Your registration was approved.</p>",
    });

    expect(result.messageId).toBe("<test-message>");
    expect(mockedCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.provider.test",
        auth: { user: "club@provider.test", pass: "not-a-real-password" },
      }),
    );
  });

  it("sends through Gmail with STARTTLS", async () => {
    vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
    vi.stubEnv("SMTP_USER", "club@gmail.com");
    vi.stubEnv("SMTP_PASS", "abcdefghijklmnop");
    vi.stubEnv("SMTP_FROM", "club@gmail.com");
    mockedCreateTransport.mockReturnValue({
      sendMail: vi.fn(async (message: { to: string }) => ({
        messageId: "<gmail-message>",
        accepted: [message.to],
        rejected: [],
      })),
    } as never);

    const result = await sendMail({
      to: "student@example.test",
      subject: "Approved",
      text: "Your registration was approved.",
      html: "<p>Your registration was approved.</p>",
    });

    expect(result.messageId).toBe("<gmail-message>");
    expect(mockedCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.gmail.com",
        port: 587,
        requireTLS: true,
        auth: { user: "club@gmail.com", pass: "abcdefghijklmnop" },
      }),
    );
  });

  it("sends through Ethereal when SMTP_HOST=ethereal", async () => {
    vi.stubEnv("SMTP_HOST", "ethereal");
    vi.mocked(nodemailer.createTestAccount).mockResolvedValue({
      user: "ethereal-user@example.test",
      pass: "generated-pass",
      smtp: { host: "smtp.ethereal.email", port: 587, secure: false },
    } as never);
    vi.mocked(nodemailer.getTestMessageUrl).mockReturnValue("https://ethereal.email/message/preview");
    mockedCreateTransport.mockReturnValue({
      sendMail: vi.fn(async (message: { to: string }) => ({
        messageId: "<ethereal-message>",
        accepted: [message.to],
        rejected: [],
      })),
    } as never);

    const result = await sendMail({
      to: "student@example.test",
      subject: "Approved",
      text: "Your registration was approved.",
      html: "<p>Your registration was approved.</p>",
    });

    expect(result.messageId).toBe("<ethereal-message>");
    expect(result.previewUrl).toBe("https://ethereal.email/message/preview");
    expect(nodemailer.createTestAccount).toHaveBeenCalled();
  });
});
