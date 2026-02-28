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

// Vercel هو اللي بيحدد البورت تلقائياً
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "..", "THE END"); 

app.use(cors()); // إضافة cors عشان لو الـ frontend كلم الـ backend
app.use(
  helmet({
    contentSecurityPolicy: false, 
  }),
);

app.use(express.json({ limit: "250kb" }));

// تنبيه: قواعد البيانات SQLite على Vercel بتكون Read-Only
// لو الموقع بيكتب بيانات، هتتمسح كل ما السيرفر يرست
initDb();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", contactRouter);
app.use(express.static(PUBLIC_DIR));

app.get("*", (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// ده السطر المهم لـ Vercel
export default app; 

// بنشغل الـ listen بس لو إحنا شغالين local مش على Vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
}
