import path from "node:path";
import { fileURLToPath } from "node:url";

import "dotenv/config";
import express from "express";
import helmet from "helmet";

import cors from "cors"; 

import { initDb } from "./lib/db.js";
import { contactRouter } from "./routes/contact.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR =
  process.env.PUBLIC_DIR || path.resolve(__dirname, "..", "THE END"); // serve your existing frontend

// Security headers (safe defaults)
app.use(
  helmet({
    contentSecurityPolicy: false, // keep off for now because of external fonts + particles CDN
  }),
);

// Parse JSON for APIs
app.use(express.json({ limit: "250kb" }));

// Initialize DB (creates file + table if missing)
initDb();

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// API routes
app.use("/api", contactRouter);

// Static site
app.use(express.static(PUBLIC_DIR));

// SPA-ish fallback: if someone refreshes on a hash-less route, serve index.html
app.get("*", (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Serving frontend from: ${PUBLIC_DIR}`);
});
