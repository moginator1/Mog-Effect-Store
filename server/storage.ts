import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { purchases, subscribers, type Purchase, type InsertPurchase, type InsertSubscriber, type Subscriber } from "@shared/schema";
import { eq } from "drizzle-orm";

const sqlite = new Database("data.db");
export const db = drizzle(sqlite);

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    name TEXT,
    stripe_session_id TEXT NOT NULL UNIQUE,
    stripe_payment_intent TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    source TEXT NOT NULL DEFAULT 'blueprint',
    created_at INTEGER NOT NULL
  );
`);

export interface IStorage {
  createPurchase(data: InsertPurchase): Purchase;
  getPurchaseBySessionId(sessionId: string): Purchase | undefined;
  updatePurchaseStatus(sessionId: string, status: string, paymentIntent?: string): void;
  getAllPurchases(): Purchase[];
  createSubscriber(data: InsertSubscriber): Subscriber | undefined;
  getSubscriberByEmail(email: string): Subscriber | undefined;
}

export const storage: IStorage = {
  createPurchase(data) {
    return db.insert(purchases).values(data).returning().get();
  },
  getPurchaseBySessionId(sessionId) {
    return db.select().from(purchases).where(eq(purchases.stripeSessionId, sessionId)).get();
  },
  updatePurchaseStatus(sessionId, status, paymentIntent?) {
    if (paymentIntent) {
      sqlite.prepare(
        `UPDATE purchases SET status = ?, stripe_payment_intent = ? WHERE stripe_session_id = ?`
      ).run(status, paymentIntent, sessionId);
    } else {
      sqlite.prepare(
        `UPDATE purchases SET status = ? WHERE stripe_session_id = ?`
      ).run(status, sessionId);
    }
  },
  getAllPurchases() {
    return db.select().from(purchases).all();
  },
  createSubscriber(data) {
    try {
      return db.insert(subscribers).values(data).returning().get();
    } catch {
      return undefined; // unique constraint — already subscribed
    }
  },
  getSubscriberByEmail(email) {
    return db.select().from(subscribers).where(eq(subscribers.email, email)).get();
  },
};
