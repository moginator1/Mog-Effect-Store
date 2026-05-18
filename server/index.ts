import express from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { serveStatic } from "./static";

const app = express();

// Raw body for Stripe webhooks
app.use("/api/webhook", express.raw({ type: "application/json" }));

// JSON + urlencoded for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve public folder for PDF download
app.use(express.static("public"));

const server = createServer(app);

(async () => {
  await registerRoutes(server, app);

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  const port = parseInt(process.env.PORT || "5000");
  server.listen(port, "0.0.0.0", () => {
    console.log(`🔥 The Mog Effect Store running on port ${port}`);
  });
})();
