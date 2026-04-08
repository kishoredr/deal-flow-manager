import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ownersTable = pgTable("owners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOwnerSchema = createInsertSchema(ownersTable).omit({ id: true, createdAt: true });
export type InsertOwner = z.infer<typeof insertOwnerSchema>;
export type Owner = typeof ownersTable.$inferSelect;
