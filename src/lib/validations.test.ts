import { describe, expect, it } from "vitest";
import {
  announcementSchema,
  calendarEventSchema,
  contactSchema,
  loginSchema,
  permissionCreateSchema,
  registerSchema,
  gradeSchema,
} from "@/lib/validations";
import { BELT_LEVELS } from "@/lib/constants";
import { sameBeltMember } from "@/lib/dtos";
import { loginRateLimit, clearLoginAttempts } from "@/lib/rate-limit";

describe("registration validation", () => {
  const valid = {
    fullName: "Liya Bekele",
    email: "liya@thekick.local",
    telegramUsername: "@liya_kick",
    beltLevel: "YELLOW",
    password: "Student123",
    confirmPassword: "Student123",
  };

  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.telegramUsername).toBe("liya_kick");
    }
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects password mismatch", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "Other123" });
    expect(result.success).toBe(false);
  });

  it("rejects arbitrary belt values", () => {
    const result = registerSchema.safeParse({ ...valid, beltLevel: "Rainbow" });
    expect(result.success).toBe(false);
  });

  it("only allows the official ITF belt list", () => {
    expect(BELT_LEVELS).toHaveLength(12);
    expect(BELT_LEVELS[0]).toBe("WHITE");
    expect(BELT_LEVELS[10]).toBe("BLACK");
    expect(BELT_LEVELS[11]).toBe("DAN_1");
  });
});

describe("login validation", () => {
  it("requires email and password", () => {
    expect(loginSchema.safeParse({ email: "", password: "" }).success).toBe(false);
  });

  it("normalizes email case", () => {
    const result = loginSchema.safeParse({
      email: "Admin@TheKick.local",
      password: "secret",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("admin@thekick.local");
    }
  });
});

describe("permission validation", () => {
  it("requires absence type and reason length", () => {
    expect(
      permissionCreateSchema.safeParse({ absenceType: "", reason: "short" }).success,
    ).toBe(false);
    expect(
      permissionCreateSchema.safeParse({
        absenceType: "SICK",
        reason: "I have an exam tomorrow.",
      }).success,
    ).toBe(true);
  });
});

describe("contact validation", () => {
  it("validates contact fields", () => {
    expect(
      contactSchema.safeParse({
        fullName: "A",
        email: "bad",
        message: "hi",
      }).success,
    ).toBe(false);
  });
});

describe("calendar and news validation", () => {
  it("requires a start time unless the event is all day", () => {
    expect(
      calendarEventSchema.safeParse({
        title: "Morning class",
        description: "Regular ITF training session.",
        eventType: "TRAINING",
        date: "2026-09-01",
        allDay: false,
      }).success,
    ).toBe(false);
    expect(
      calendarEventSchema.safeParse({
        title: "Morning class",
        description: "Regular ITF training session.",
        eventType: "TRAINING",
        date: "2026-09-01",
        startTime: "05:30",
        allDay: false,
        status: "PUBLISHED",
      }).success,
    ).toBe(true);
  });

  it("accepts the admin create payload shape", () => {
    const withImage = announcementSchema.safeParse({
      title: "Club training update",
      content: "This is a published news item with an uploaded image.",
      imageUrl: "/api/media/news/ea14a17a-06f4-47cb-9955-80d485de5d8d.png",
      extraImageUrls: [],
      status: "PUBLISHED",
      publishedAt: null,
    });
    expect(withImage.success).toBe(true);

    const noImage = announcementSchema.safeParse({
      title: "Club training update",
      content: "This is a published news item without an image.",
      imageUrl: null,
      extraImageUrls: [],
      status: "PUBLISHED",
      publishedAt: null,
    });
    expect(noImage.success).toBe(true);
  });

  it("accepts an absolute uploaded image URL by using its path", () => {
    const parsed = announcementSchema.safeParse({
      title: "Belt exam date",
      content: "Belt examinations will be held this month at the dojang.",
      imageUrl: "http://localhost:3000/api/media/news/ea14a17a-06f4-47cb-9955-80d485de5d8d.png",
      extraImageUrls: [],
      status: "PUBLISHED",
      publishedAt: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.imageUrl).toBe("/api/media/news/ea14a17a-06f4-47cb-9955-80d485de5d8d.png");
      expect(parsed.data.publishedAt).toBe("");
    }
  });

  it("accepts a news post with a stored upload path", () => {
    expect(
      announcementSchema.safeParse({
        title: "Belt exam date",
        content: "Belt examinations will be held this month at the dojang.",
        imageUrl: "/uploads/news/cover.jpg",
        extraImageUrls: ["/uploads/news/extra.jpg"],
        status: "PUBLISHED",
      }).success,
    ).toBe(true);
    expect(
      announcementSchema.safeParse({
        title: "Belt exam date",
        content: "Belt examinations will be held this month at the dojang.",
        imageUrl: "/api/media/news/cover.jpg",
        extraImageUrls: ["/api/media/news/extra.jpg"],
        status: "PUBLISHED",
      }).success,
    ).toBe(true);
  });
});

describe("grade validation", () => {
  const valid = {
    studentId: "student-1",
    assessmentName: "Monthly grading",
    assessmentDate: "2026-09-01",
    patternScore: "82",
    sparringScore: 78,
    kicksScore: "",
    theoryScore: null,
  };

  it("accepts skill scores and leaves omitted scores unset", () => {
    const result = gradeSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.patternScore).toBe(82);
      expect(result.data.sparringScore).toBe(78);
      expect(result.data.kicksScore).toBeNull();
      expect(result.data.disciplineScore).toBeUndefined();
      expect(result.data).not.toHaveProperty("overallScore");
    }
  });

  it("keeps omitted scores undefined on partial updates", () => {
    const result = gradeSchema.partial().safeParse({ patternScore: 90 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.patternScore).toBe(90);
      expect(result.data.sparringScore).toBeUndefined();
    }
  });
});

describe("same-belt DTO", () => {
  it("exposes only public member fields", () => {
    const member = sameBeltMember({
      fullName: "Liya Bekele",
      beltLevel: "YELLOW",
    });
    expect(member).toEqual({
      fullName: "Liya Bekele",
      beltLevel: "YELLOW",
      beltLabel: "Yellow Belt",
    });
    expect(member).not.toHaveProperty("email");
    expect(member).not.toHaveProperty("passwordHash");
  });
});

describe("login rate limit", () => {
  it("blocks after too many attempts", () => {
    const key = `test-${Date.now()}`;
    for (let i = 0; i < 20; i += 1) {
      expect(loginRateLimit(key).ok).toBe(true);
    }
    expect(loginRateLimit(key).ok).toBe(false);
    clearLoginAttempts(key);
  });
});
