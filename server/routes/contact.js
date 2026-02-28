import express from "express";
import { z } from "zod";

import { dbRun } from "../lib/db.js";
import { getMailDefaults, getTransport } from "../lib/mailer.js";

export const contactRouter = express.Router();

const ContactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(120),
  message: z.string().trim().min(10).max(3000),
});

// tiny in-memory rate limit (good enough for a small portfolio site)
const lastSentByIp = new Map(); // ip -> timestamp
const RATE_LIMIT_MS = Number(process.env.CONTACT_RATE_LIMIT_MS || 20_000);

function getIp(req) {
  // if deployed behind a proxy, set TRUST_PROXY=true
  if (String(process.env.TRUST_PROXY || "false") === "true") {
    return req.ip;
  }
  return (
    req.socket?.remoteAddress ||
    req.headers["x-forwarded-for"]?.toString()?.split(",")?.[0]?.trim() ||
    "unknown"
  );
}

contactRouter.post("/contact", async (req, res) => {
  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Validation error",
    });
  }

  const ip = getIp(req);
  const ua = req.headers["user-agent"] || null;
  const now = Date.now();
  const last = lastSentByIp.get(ip) || 0;
  if (now - last < RATE_LIMIT_MS) {
    const retryAfterMs = RATE_LIMIT_MS - (now - last);
    res.setHeader("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
    return res.status(429).json({
      success: false,
      message: `Too many requests. Please wait ${Math.ceil(
        retryAfterMs / 1000,
      )}s and try again.`,
      retryAfterMs,
    });
  }
  lastSentByIp.set(ip, now);

  const { name, phone, email, message } = parsed.data;
  const createdAt = new Date().toISOString();

  // Save as "received" first
  const insertResult = await dbRun(
    `INSERT INTO contact_messages
      (created_at, name, phone, email, message, ip, user_agent, status)
     VALUES
      (?, ?, ?, ?, ?, ?, ?, ?)`,
    [createdAt, name, phone, email, message, ip, ua, "received"],
  );
  const messageId = insertResult.lastID;

  try {
    const transport = getTransport();
    const { to, from } = getMailDefaults();

    const subject = `New portfolio contact: ${name}`;
    const text = [
      `New message from your portfolio contact form`,
      ``,
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      `Time: ${createdAt}`,
      `IP: ${ip}`,
      ``,
      `Message:`,
      message,
      ``,
      `Message ID: ${messageId}`,
    ].join("\n");

    await transport.sendMail({
      to,
      from,
      subject,
      text,
      replyTo: email, // replying goes to the user
    });

    await dbRun("UPDATE contact_messages SET status = ? WHERE id = ?", [
      "emailed",
      messageId,
    ]);

    return res.json({
      success: true,
      message: "Message sent successfully!",
    });
  } catch (err) {
    await dbRun("UPDATE contact_messages SET status = ? WHERE id = ?", [
      "email_failed",
      messageId,
    ]);

    // eslint-disable-next-line no-console
    console.error("Contact email failed:", err);

    const errMsg =
      err && typeof err === "object" && "message" in err
        ? String(err.message)
        : "";

    return res.status(500).json({
      success: false,
      message: errMsg
        ? `Message saved but email failed: ${errMsg}`
        : "Message saved but email failed. Check server logs.",
    });
  }
});
