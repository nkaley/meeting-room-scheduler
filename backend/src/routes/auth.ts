import { Router, Request, Response } from "express";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../middleware/auth.js";
import { sendVerificationCode, isMailConfigured } from "../lib/mail.js";

const router = Router();

const NAME_SURNAME_MAX = 50;
const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").max(NAME_SURNAME_MAX, `Name up to ${NAME_SURNAME_MAX} characters`),
  surname: z.string().min(1, "Surname is required").max(NAME_SURNAME_MAX, `Surname up to ${NAME_SURNAME_MAX} characters`),
});

function getAllowedDomains(): string[] {
  const raw = process.env.ALLOWED_DOMAIN?.trim().replace(/\s+/g, "") ?? "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((d) => {
      const domain = d.replace(/^["']|["']$/g, "").trim();
      return domain.startsWith("@") ? domain : `@${domain}`;
    })
    .filter(Boolean);
}

const CODE_EXPIRES_MINUTES = 15;
function random6DigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  const user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await compare(String(password), user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: `${user.surname} ${user.name}`,
      role: user.role,
    },
  });
});

// POST /api/auth/register/send-code
router.post("/register/send-code", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    res.status(400).json({ error: first || "Invalid data" });
    return;
  }
  const { email, password, name, surname } = parsed.data;
  const emailLower = email.toLowerCase();

  const allowedDomains = getAllowedDomains();
  const domainAllowed =
    allowedDomains.length === 0 || allowedDomains.some((d) => emailLower.endsWith(d));
  if (!domainAllowed) {
    res.status(403).json({ error: "Registration is allowed only for the configured corporate domain." });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: emailLower } });
  if (existing) {
    res.status(409).json({ error: "A user with this email is already registered." });
    return;
  }

  if (!isMailConfigured()) {
    res.status(503).json({ error: "Email sending is not configured. Contact the administrator." });
    return;
  }

  const code = random6DigitCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRES_MINUTES * 60 * 1000);
  await prisma.verificationCode.upsert({
    where: { email: emailLower },
    create: { email: emailLower, code, expiresAt },
    update: { code, expiresAt },
  });

  const result = await sendVerificationCode(emailLower, code);
  if (!result.ok) {
    res.status(500).json({ error: result.error || "Failed to send verification email." });
    return;
  }
  res.json({ ok: true });
});

// POST /api/auth/register/complete
router.post("/register/complete", async (req: Request, res: Response) => {
  const { email, code, password, name, surname } = req.body;
  if (!email || !code || !password || !name || !surname) {
    res.status(400).json({ error: "Please fill in all fields." });
    return;
  }
  const parsed = registerSchema.safeParse({ email, password, name, surname });
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    res.status(400).json({ error: first || "Invalid data" });
    return;
  }
  const emailLower = String(email).trim().toLowerCase();

  const allowedDomains = getAllowedDomains();
  const domainAllowed =
    allowedDomains.length === 0 || allowedDomains.some((d) => emailLower.endsWith(d));
  if (!domainAllowed) {
    res.status(403).json({ error: "Registration is allowed only for the configured corporate domain." });
    return;
  }

  const record = await prisma.verificationCode.findUnique({ where: { email: emailLower } });
  if (!record) {
    res.status(400).json({ error: "Code not found. Request a new code." });
    return;
  }
  if (record.code !== String(code).trim()) {
    res.status(400).json({ error: "Invalid verification code." });
    return;
  }
  if (new Date() > record.expiresAt) {
    await prisma.verificationCode.delete({ where: { email: emailLower } }).catch(() => {});
    res.status(400).json({ error: "Code has expired. Request a new code." });
    return;
  }

  const existingUser = await prisma.user.findUnique({ where: { email: emailLower } });
  if (existingUser) {
    await prisma.verificationCode.delete({ where: { email: emailLower } }).catch(() => {});
    res.status(409).json({ error: "A user with this email is already registered." });
    return;
  }

  const count = await prisma.user.count();
  const role = count === 0 ? "ADMIN" : "USER";
  const passwordHash = await hash(parsed.data.password, 12);
  await prisma.user.create({
    data: {
      email: emailLower,
      passwordHash,
      name: parsed.data.name,
      surname: parsed.data.surname,
      role,
    },
  });
  await prisma.verificationCode.delete({ where: { email: emailLower } }).catch(() => {});

  res.status(201).json({ ok: true });
});

export default router;
