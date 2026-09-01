import { relations } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
  toDriver(value) {
    return value;
  },
  fromDriver(value) {
    return Buffer.isBuffer(value) ? value : Buffer.from(value as Uint8Array);
  },
});

export const roleEnum = pgEnum("role", ["ADMIN", "STUDENT"]);
export const accountStatusEnum = pgEnum("account_status", [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "REJECTED",
]);
export const beltLevelEnum = pgEnum("belt_level", [
  "WHITE",
  "WHITE_YELLOW_TAG",
  "YELLOW",
  "YELLOW_GREEN_TAG",
  "GREEN",
  "GREEN_BLUE_TAG",
  "BLUE",
  "BLUE_RED_TAG",
  "RED",
  "RED_BLACK_TAG",
  "BLACK",
  "DAN_1",
]);
export const absenceTypeEnum = pgEnum("absence_type", [
  "FAMILY",
  "CLASS_EXAM",
  "SICK",
  "JOURNEY",
]);
export const permissionStatusEnum = pgEnum("permission_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);
export const announcementStatusEnum = pgEnum("announcement_status", [
  "DRAFT",
  "PUBLISHED",
]);
export const eventTypeEnum = pgEnum("event_type", [
  "TRAINING",
  "BELT_EXAM",
  "COMPETITION",
  "GRADUATION",
  "MEETING",
  "SPECIAL",
]);
export const messageStatusEnum = pgEnum("message_status", ["NEW", "READ"]);

export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    fullName: varchar("full_name", { length: 200 }).notNull(),
    telegramUsername: varchar("telegram_username", { length: 64 }),
    passwordHash: text("password_hash"),
    role: roleEnum("role").notNull().default("STUDENT"),
    beltLevel: beltLevelEnum("belt_level"),
    accountStatus: accountStatusEnum("account_status").notNull().default("PENDING"),
    approvedAt: timestamp("approved_at", { mode: "date" }),
    approvalEmailSentAt: timestamp("approval_email_sent_at", { mode: "date" }),
    rejectedAt: timestamp("rejected_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    index("users_belt_level_idx").on(table.beltLevel),
    index("users_account_status_idx").on(table.accountStatus),
    index("users_role_idx").on(table.role),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

export const grades = pgTable(
  "grades",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assessmentName: varchar("assessment_name", { length: 200 }).notNull(),
    patternScore: integer("pattern_score"),
    sparringScore: integer("sparring_score"),
    kicksScore: integer("kicks_score"),
    theoryScore: integer("theory_score"),
    disciplineScore: integer("discipline_score"),
    overallScore: integer("overall_score"),
    result: varchar("result", { length: 80 }),
    instructorComment: text("instructor_comment"),
    assessmentDate: timestamp("assessment_date", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("grades_student_id_idx").on(table.studentId),
    index("grades_assessment_date_idx").on(table.assessmentDate),
  ],
);

export const permissionRequests = pgTable(
  "permission_requests",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    absenceType: absenceTypeEnum("absence_type").notNull(),
    reason: varchar("reason", { length: 500 }).notNull(),
    status: permissionStatusEnum("status").notNull().default("PENDING"),
    adminNote: text("admin_note"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("permissions_student_id_idx").on(table.studentId),
    index("permissions_status_idx").on(table.status),
    index("permissions_absence_type_idx").on(table.absenceType),
  ],
);

export const announcements = pgTable(
  "announcements",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: varchar("title", { length: 200 }).notNull(),
    content: text("content").notNull(),
    imageUrl: text("image_url"),
    status: announcementStatusEnum("status").notNull().default("DRAFT"),
    publishedAt: timestamp("published_at", { mode: "date" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("announcements_status_idx").on(table.status)],
);

export const announcementImages = pgTable(
  "announcement_images",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    announcementId: text("announcement_id")
      .notNull()
      .references(() => announcements.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("announcement_images_announcement_id_idx").on(table.announcementId)],
);

export const uploadedFiles = pgTable(
  "uploaded_files",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    folder: varchar("folder", { length: 32 }).notNull(),
    filename: varchar("filename", { length: 80 }).notNull(),
    contentType: varchar("content_type", { length: 64 }).notNull(),
    data: bytea("data").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("uploaded_files_folder_filename_idx").on(table.folder, table.filename)],
);

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    eventType: eventTypeEnum("event_type").notNull().default("SPECIAL"),
    startsAt: timestamp("starts_at", { mode: "date" }).notNull(),
    endsAt: timestamp("ends_at", { mode: "date" }),
    allDay: boolean("all_day").notNull().default(false),
    location: varchar("location", { length: 300 }),
    status: announcementStatusEnum("status").notNull().default("PUBLISHED"),
    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("calendar_events_starts_at_idx").on(table.startsAt),
    index("calendar_events_status_idx").on(table.status),
  ],
);

export const contactMessages = pgTable("contact_messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: messageStatusEnum("status").notNull().default("NEW"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const beltHistory = pgTable(
  "belt_history",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fromBelt: beltLevelEnum("from_belt"),
    toBelt: beltLevelEnum("to_belt").notNull(),
    changedById: text("changed_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("belt_history_student_id_idx").on(table.studentId)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 80 }).notNull(),
    targetType: varchar("target_type", { length: 80 }).notNull(),
    targetId: text("target_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_actor_id_idx").on(table.actorId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);

export const clubSettings = pgTable("club_settings", {
  id: text("id").primaryKey().default("default"),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 64 }).notNull(),
  telegram: varchar("telegram", { length: 64 }).notNull(),
  location: text("location").notNull(),
  schedule: text("schedule").notNull(),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  youtubeUrl: text("youtube_url"),
  about: text("about").notNull(),
  mission: text("mission").notNull(),
  vision: text("vision").notNull(),
  philosophy: text("philosophy").notNull(),
  itfInfo: text("itf_info").notNull(),
  activities: text("activities").notNull(),
  achievements: text("achievements").notNull(),
  instructors: jsonb("instructors")
    .$type<Array<{ name: string; title: string; bio: string }>>()
    .notNull()
    .default([]),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
  grades: many(grades),
  permissionRequests: many(permissionRequests),
  announcements: many(announcements),
  calendarEvents: many(calendarEvents, { relationName: "eventCreator" }),
  beltHistory: many(beltHistory),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const gradesRelations = relations(grades, ({ one }) => ({
  student: one(users, { fields: [grades.studentId], references: [users.id] }),
}));

export const permissionRequestsRelations = relations(
  permissionRequests,
  ({ one }) => ({
    student: one(users, {
      fields: [permissionRequests.studentId],
      references: [users.id],
    }),
  }),
);

export const announcementsRelations = relations(announcements, ({ one, many }) => ({
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
  images: many(announcementImages),
}));

export const announcementImagesRelations = relations(announcementImages, ({ one }) => ({
  announcement: one(announcements, {
    fields: [announcementImages.announcementId],
    references: [announcements.id],
  }),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  createdBy: one(users, {
    fields: [calendarEvents.createdById],
    references: [users.id],
    relationName: "eventCreator",
  }),
}));

export const beltHistoryRelations = relations(beltHistory, ({ one }) => ({
  student: one(users, {
    fields: [beltHistory.studentId],
    references: [users.id],
  }),
  changedBy: one(users, {
    fields: [beltHistory.changedById],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Grade = typeof grades.$inferSelect;
export type PermissionRequest = typeof permissionRequests.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type AnnouncementImage = typeof announcementImages.$inferSelect;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type ClubSettings = typeof clubSettings.$inferSelect;
export type BeltLevel = (typeof beltLevelEnum.enumValues)[number];
export type Role = (typeof roleEnum.enumValues)[number];
export type AccountStatus = (typeof accountStatusEnum.enumValues)[number];
export type AbsenceType = (typeof absenceTypeEnum.enumValues)[number];
export type EventType = (typeof eventTypeEnum.enumValues)[number];
