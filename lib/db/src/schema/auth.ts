import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const otpRequests = pgTable("otp_requests", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  otpHash: text("otp_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const deviceTokens = pgTable("device_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  email: text("email").notNull(),
  deviceId: text("device_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
