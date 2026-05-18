import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Track purchases for audit + email delivery
export const purchases = sqliteTable("purchases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  name: text("name"),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  stripePaymentIntent: text("stripe_payment_intent"),
  status: text("status").notNull().default("pending"), // pending | complete | delivered
  createdAt: integer("created_at").notNull(),
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({ id: true });
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchases.$inferSelect;

// Email subscribers for funnel
export const subscribers = sqliteTable("subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name"),
  source: text("source").notNull().default("blueprint"),
  createdAt: integer("created_at").notNull(),
});

export const insertSubscriberSchema = createInsertSchema(subscribers).omit({ id: true });
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type Subscriber = typeof subscribers.$inferSelect;
