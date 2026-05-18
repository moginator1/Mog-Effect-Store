import type { Express, Request, Response } from "express";
import type { Server } from "http";
import path from "path";
import fs from "fs";
import { storage } from "./storage";

// ── ENV VARS ─────────────────────────────────────────────────────────────────
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const PRODUCT_PRICE_CENTS = 2700; // $27.00
const REPLY_EMAIL = "moginator@mogmethod.com";
const FROM_EMAIL = "moginator@mogmethod.com";
const FROM_NAME = "Bryan Mogrovejo — The Mog Effect";

export async function registerRoutes(httpServer: Server, app: Express) {
  // ── STRIPE: Create checkout session ──────────────────────────────────────
  app.post("/api/checkout", async (req: Request, res: Response) => {
    if (!STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: "Stripe not configured. Add STRIPE_SECRET_KEY env var." });
    }
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-04-10" as any });
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: {
              name: "The Mog Effect Blueprint",
              description: "15-Page Body Recomposition System for Busy Men & Dads",
              images: [],
            },
            unit_amount: PRODUCT_PRICE_CENTS,
          },
          quantity: 1,
        }],
        mode: "payment",
        success_url: `${BASE_URL}/#/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${BASE_URL}/#/`,
        customer_email: req.body.email || undefined,
        metadata: {
          product: "mog_effect_blueprint",
          name: req.body.name || "",
        },
        allow_promotion_codes: true,
      });

      // Create a pending purchase record
      storage.createPurchase({
        email: req.body.email || "",
        name: req.body.name || "",
        stripeSessionId: session.id,
        status: "pending",
        createdAt: Date.now(),
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (err: any) {
      console.error("Stripe error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── STRIPE: Webhook (auto-delivery trigger) ───────────────────────────────
  app.post("/api/webhook", async (req: Request, res: Response) => {
    if (!STRIPE_SECRET_KEY) return res.json({ received: true });

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-04-10" as any });

    let event: any;
    if (STRIPE_WEBHOOK_SECRET) {
      try {
        event = stripe.webhooks.constructEvent(
          req.body, // raw body — needs express.raw middleware
          req.headers["stripe-signature"] as string,
          STRIPE_WEBHOOK_SECRET
        );
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    } else {
      event = req.body;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.customer_details?.email || session.customer_email || "";
      const name = session.metadata?.name || session.customer_details?.name || "";

      // Update purchase record
      storage.updatePurchaseStatus(session.id, "complete", session.payment_intent);

      // Add to subscribers
      if (email) {
        storage.createSubscriber({
          email,
          name,
          source: "blueprint_purchase",
          createdAt: Date.now(),
        });
      }

      // Send delivery email
      if (SENDGRID_API_KEY && email) {
        await sendDeliveryEmail(email, name, session.id);
        storage.updatePurchaseStatus(session.id, "delivered");
      }
    }

    res.json({ received: true });
  });

  // ── Verify purchase + serve download ─────────────────────────────────────
  app.get("/api/verify-purchase", async (req: Request, res: Response) => {
    const { session_id } = req.query as { session_id: string };
    if (!session_id) return res.status(400).json({ valid: false });

    if (STRIPE_SECRET_KEY) {
      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-04-10" as any });
        const session = await stripe.checkout.sessions.retrieve(session_id);
        if (session.payment_status === "paid") {
          const email = session.customer_details?.email || "";
          const name = session.metadata?.name || session.customer_details?.name || "";
          // ensure record exists
          const existing = storage.getPurchaseBySessionId(session_id);
          if (!existing) {
            storage.createPurchase({ email, name, stripeSessionId: session_id, status: "complete", createdAt: Date.now() });
          } else if (existing.status === "pending") {
            storage.updatePurchaseStatus(session_id, "complete", session.payment_intent as string);
          }
          if (email) storage.createSubscriber({ email, name, source: "blueprint_purchase", createdAt: Date.now() });
          // Send email if not sent yet
          if (SENDGRID_API_KEY && email) {
            const rec = storage.getPurchaseBySessionId(session_id);
            if (rec?.status !== "delivered") {
              await sendDeliveryEmail(email, name, session_id);
              storage.updatePurchaseStatus(session_id, "delivered");
            }
          }
          return res.json({ valid: true, email, name });
        }
        return res.json({ valid: false });
      } catch {
        return res.json({ valid: false });
      }
    }

    // Demo mode (no Stripe key)
    const purchase = storage.getPurchaseBySessionId(session_id);
    res.json({ valid: !!purchase, email: purchase?.email || "", name: purchase?.name || "" });
  });

  // ── Direct download (after purchase verified) ─────────────────────────────
  app.get("/api/download/:session_id", async (req: Request, res: Response) => {
    const { session_id } = req.params;
    // Verify purchase
    if (STRIPE_SECRET_KEY) {
      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-04-10" as any });
        const session = await stripe.checkout.sessions.retrieve(session_id);
        if (session.payment_status !== "paid") return res.status(403).json({ error: "Unauthorized" });
      } catch {
        return res.status(403).json({ error: "Unauthorized" });
      }
    }

    const pdfPath = path.join(process.cwd(), "public", "the_mog_effect_blueprint.pdf");
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: "File not found" });
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="The_Mog_Effect_Blueprint.pdf"`);
    res.sendFile(pdfPath);
  });

  // ── Admin: list purchases ─────────────────────────────────────────────────
  app.get("/api/admin/purchases", (req: Request, res: Response) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY && process.env.ADMIN_KEY) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(storage.getAllPurchases());
  });
}

// ── SendGrid Email Delivery ───────────────────────────────────────────────────
async function sendDeliveryEmail(email: string, name: string, sessionId: string) {
  try {
    const sgMail = (await import("@sendgrid/mail")).default;
    sgMail.setApiKey(SENDGRID_API_KEY);

    const firstName = name ? name.split(" ")[0] : "there";
    const downloadUrl = `${BASE_URL}/api/download/${sessionId}`;

    await sgMail.send({
      to: email,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      replyTo: REPLY_EMAIL,
      subject: "Your Mog Effect Blueprint is Ready 🔥",
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#1A1814;border-top:4px solid #C8922A;border-radius:4px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid #2D2926;">
            <p style="margin:0;font-size:10px;letter-spacing:2px;color:#C8922A;font-weight:700;text-transform:uppercase;">The Mog Effect</p>
            <h1 style="margin:8px 0 0;font-size:28px;color:#FFFFFF;font-weight:800;line-height:1.2;">Your Blueprint Is Ready, ${firstName}.</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 40px;">
            <p style="margin:0 0 16px;font-size:15px;color:#C8B898;line-height:1.6;">
              You made the right move. Most men spend years trying to figure this out on their own — buying more programs, watching more YouTube, restarting every Monday.
            </p>
            <p style="margin:0 0 16px;font-size:15px;color:#C8B898;line-height:1.6;">
              The Mog Effect Blueprint gives you the system. A 3-day split, a protein-first nutrition framework, a weekend control protocol, and a 12-week plan built for your actual life.
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#C8B898;line-height:1.6;">
              <strong style="color:#FFFFFF;">Click below to download your PDF now:</strong>
            </p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#C8922A;border-radius:3px;padding:14px 28px;">
                  <a href="${downloadUrl}" style="color:#0A0A0A;font-size:15px;font-weight:800;text-decoration:none;letter-spacing:0.5px;">
                    → Download The Mog Effect Blueprint
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;font-size:12px;color:#7A7470;">
              If the button doesn't work, copy this link into your browser:<br>
              <a href="${downloadUrl}" style="color:#C8922A;">${downloadUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 40px;"><div style="height:1px;background:#2D2926;"></div></td></tr>

        <!-- Next Step -->
        <tr>
          <td style="padding:24px 40px 32px;">
            <p style="margin:0 0 8px;font-size:10px;letter-spacing:2px;color:#C8922A;font-weight:700;text-transform:uppercase;">What's Next</p>
            <p style="margin:0 0 12px;font-size:14px;color:#FFFFFF;font-weight:700;">Want results 3–5× faster?</p>
            <p style="margin:0 0 16px;font-size:14px;color:#B8B4B0;line-height:1.6;">
              I work 1-on-1 with a small group of men — sales reps, executives, and dads — who are serious about transforming their body without giving up their life.
              Custom programming. Weekly accountability. Real-time travel adjustments.
            </p>
            <a href="https://bryanmogrovejo.com/coaching" style="font-size:13px;color:#C8922A;font-weight:700;text-decoration:none;">
              → Learn about 1-on-1 coaching →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 40px;background:#111008;border-top:1px solid #2D2926;">
            <p style="margin:0;font-size:11px;color:#4A4540;line-height:1.5;">
              © 2026 Bryan Mogrovejo Coaching · The Mog Effect<br>
              You received this because you purchased The Mog Effect Blueprint.<br>
              <a href="mailto:bryan@bryanmogrovejo.com" style="color:#7A7470;">Unsubscribe</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
      `,
    });

    console.log(`Delivery email sent to ${email}`);
  } catch (err: any) {
    console.error("SendGrid error:", err.response?.body || err.message);
  }
}
