import { pgTable, text, serial, timestamp, numeric, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ownersTable } from "./owners";

export const DEAL_STAGES = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"] as const;
export type DealStage = typeof DEAL_STAGES[number];

export const dealsTable = pgTable("deals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  companyName: text("company_name").notNull(),
  stage: text("stage").$type<DealStage>().notNull().default("lead"),
  value: numeric("value", { precision: 12, scale: 2 }).notNull().default("0"),
  expectedCloseDate: date("expected_close_date").notNull(),
  ownerId: integer("owner_id").notNull().references(() => ownersTable.id),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDealSchema = createInsertSchema(dealsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof dealsTable.$inferSelect;
