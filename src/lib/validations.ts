import { z } from "zod";
import { ABSENCE_TYPES, BELT_LEVELS, EVENT_TYPES } from "@/lib/constants";
import { normalizeTelegram } from "@/lib/utils";
import { isStoredUploadUrl } from "@/lib/upload-url";

export const telegramUsernameSchema = z
  .string()
  .trim()
  .min(1, "Telegram username is required")
  .transform(normalizeTelegram)
  .pipe(
    z
      .string()
      .min(5, "Telegram username must be at least 5 characters")
      .max(32, "Telegram username must be at most 32 characters")
      .regex(
        /^[A-Za-z0-9_]+$/,
        "Use letters, numbers, and underscores only (with or without @)",
      ),
  );

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

export const beltLevelSchema = z.enum(BELT_LEVELS, {
  error: "Select a valid ITF belt level",
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required").max(200),
    email: z.email("Enter a valid email").trim().toLowerCase(),
    telegramUsername: telegramUsernameSchema,
    beltLevel: beltLevelSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(200),
  email: z.email("Enter a valid email"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be at most 2000 characters"),
});

export const permissionCreateSchema = z.object({
  absenceType: z.enum(ABSENCE_TYPES, {
    error: "Select an absence type",
  }),
  reason: z
    .string()
    .trim()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must be at most 500 characters"),
});

export const permissionAdminUpdateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], {
    error: "Status must be Approved or Rejected",
  }),
  adminNote: z.string().trim().max(500).optional(),
});

const score = z.preprocess(
  (value) => (value === "" ? null : value),
  z.union([z.null(), z.coerce.number().int().min(0).max(100)]).optional(),
);

export const gradeSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  assessmentName: z.string().trim().min(2).max(200),
  patternScore: score.optional(),
  sparringScore: score.optional(),
  kicksScore: score.optional(),
  theoryScore: score.optional(),
  disciplineScore: score.optional(),
  result: z.string().trim().max(80).optional().nullable(),
  instructorComment: z.string().trim().max(2000).optional().nullable(),
  assessmentDate: z.string().min(1, "Assessment date is required"),
});

function storedImageUrl(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      return new URL(trimmed).pathname;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

const uploadedImageUrl = z
  .string()
  .trim()
  .max(500)
  .transform(storedImageUrl)
  .refine((value) => isStoredUploadUrl(value), "Use an uploaded club image");

export const announcementSchema = z.object({
  title: z.coerce.string().trim().min(2, "Enter a news title").max(200),
  content: z.coerce.string().trim().min(10, "News content must be at least 10 characters").max(10000),
  imageUrl: z.union([uploadedImageUrl, z.literal(""), z.null()]).optional(),
  extraImageUrls: z.array(uploadedImageUrl).max(8).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishedAt: z.union([z.string().min(1), z.literal(""), z.null()]).optional(),
});

export const calendarEventSchema = z
  .object({
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().min(10).max(4000),
    eventType: z.enum(EVENT_TYPES),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    allDay: z.boolean().optional().default(false),
    location: z.string().trim().max(300).optional().nullable(),
    status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"),
  })
  .superRefine((data, ctx) => {
    if (!data.allDay && !data.startTime) {
      ctx.addIssue({ code: "custom", path: ["startTime"], message: "Start time is required" });
    }
    if (data.startTime && data.endTime && data.endTime <= data.startTime) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "End time must be after start time" });
    }
  });

export const adminStudentUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(200).optional(),
  telegramUsername: telegramUsernameSchema.optional(),
  beltLevel: beltLevelSchema.optional(),
  accountStatus: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"]).optional(),
});

export const clubSettingsSchema = z.object({
  email: z.email(),
  phone: z.string().trim().min(5).max(64),
  telegram: z.string().trim().min(2).max(64),
  location: z.string().trim().min(5).max(500),
  schedule: z.string().trim().min(5).max(2000),
  facebookUrl: z.string().trim().url().optional().or(z.literal("")),
  instagramUrl: z.string().trim().url().optional().or(z.literal("")),
  youtubeUrl: z.string().trim().url().optional().or(z.literal("")),
  about: z.string().trim().min(10),
  mission: z.string().trim().min(10),
  vision: z.string().trim().min(10),
  philosophy: z.string().trim().min(10),
  itfInfo: z.string().trim().min(10),
  activities: z.string().trim().min(10),
  achievements: z.string().trim().min(10),
  instructors: z
    .array(
      z.object({
        name: z.string().trim().min(2),
        title: z.string().trim().min(2),
        bio: z.string().trim().min(10),
      }),
    )
    .optional(),
});

export function fieldErrors(error: z.ZodError) {
  const details: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!details[key]) details[key] = issue.message;
  }
  return details;
}

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GradeInput = z.infer<typeof gradeSchema>;
