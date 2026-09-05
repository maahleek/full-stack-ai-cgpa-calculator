import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  numeric,
  integer,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    passwordHash: text("password_hash"),
    googleId: varchar("google_id", { length: 255 }),
    university: varchar("university", { length: 160 }),
    program: varchar("program", { length: 160 }),
    targetCgpa: numeric("target_cgpa", { precision: 4, scale: 2 }),
    scale: numeric("scale", { precision: 4, scale: 2 }).default("5.00"),
    seeded: boolean("seeded").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
    googleIdIdx: uniqueIndex("users_google_id_idx").on(t.googleId),
  })
);

export const semesters = pgTable(
  "semesters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    year: integer("year").notNull(),
    term: varchar("term", { length: 30 }).notNull(),
    order: integer("order").notNull().default(0),
    isCurrent: boolean("is_current").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("semesters_user_idx").on(t.userId),
  })
);

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    semesterId: uuid("semester_id")
      .notNull()
      .references(() => semesters.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 30 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    credits: numeric("credits", { precision: 4, scale: 1 }).notNull(),
    grade: varchar("grade", { length: 4 }),
    score: numeric("score", { precision: 5, scale: 2 }),
    difficulty: varchar("difficulty", { length: 20 }).default("medium"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    semesterIdx: index("courses_semester_idx").on(t.semesterId),
  })
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("password_reset_tokens_user_idx").on(t.userId),
    tokenIdx: uniqueIndex("password_reset_tokens_token_idx").on(t.tokenHash),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Semester = typeof semesters.$inferSelect;
export type NewSemester = typeof semesters.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
