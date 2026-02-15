"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendVerificationCode, isMailConfigured } from "@/lib/mail";

function getAllowedDomains(): string[] {
  const raw = process.env.ALLOWED_DOMAIN?.trim().replace(/\s+/g, "") ?? "";
  if (!raw) return [];
  return raw.split(",").map((d) => {
    const domain = d.replace(/^["']|["']$/g, "").trim();
    return domain.startsWith("@") ? domain : `@${domain}`;
  }).filter(Boolean);
}

const CODE_EXPIRES_MINUTES = 15;
const NAME_SURNAME_MAX = 50;

const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").max(NAME_SURNAME_MAX, `Name up to ${NAME_SURNAME_MAX} characters`),
  surname: z.string().min(1, "Surname is required").max(NAME_SURNAME_MAX, `Surname up to ${NAME_SURNAME_MAX} characters`),
});

function random6DigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendRegisterCode(formData: FormData): Promise<{ error?: string }> {
  const email = (formData.get("email") as string)?.trim()?.toLowerCase();
  const password = formData.get("password") as string;
  const name = (formData.get("name") as string)?.trim();
  const surname = (formData.get("surname") as string)?.trim();

  const parsed = registerSchema.safeParse({ email, password, name, surname });
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: first || "Invalid data" };
  }

  const allowedDomains = getAllowedDomains();
  const emailLower = parsed.data.email.toLowerCase();
  const domainAllowed = allowedDomains.length === 0 || allowedDomains.some((d) => emailLower.endsWith(d));
  if (!domainAllowed) {
    const base = "Registration is allowed only for the configured corporate domain.";
    const devHint =
      process.env.NODE_ENV === "development"
        ? ` [DEV: ALLOWED_DOMAIN="${(process.env.ALLOWED_DOMAIN ?? "").replace(/"/g, "")}" → domains: ${allowedDomains.join(", ") || "(none)"}]`
        : "";
    return { error: base + devHint };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "A user with this email is already registered." };
  }

  if (!isMailConfigured()) {
    return { error: "Email sending is not configured. Contact the administrator." };
  }

  const code = random6DigitCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRES_MINUTES * 60 * 1000);

  await prisma.verificationCode.upsert({
    where: { email: parsed.data.email },
    create: { email: parsed.data.email, code, expiresAt },
    update: { code, expiresAt },
  });

  const result = await sendVerificationCode(parsed.data.email, code);
  if (!result.ok) {
    return { error: result.error || "Failed to send verification email." };
  }

  return {};
}

export async function completeRegistration(formData: FormData): Promise<{ error?: string }> {
  const email = (formData.get("email") as string)?.trim()?.toLowerCase();
  const code = (formData.get("code") as string)?.trim();
  const password = formData.get("password") as string;
  const name = (formData.get("name") as string)?.trim();
  const surname = (formData.get("surname") as string)?.trim();

  if (!email || !code || !password || !name || !surname) {
    return { error: "Please fill in all fields." };
  }

  const parsed = registerSchema.safeParse({ email, password, name, surname });
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: first || "Invalid data" };
  }

  const allowedDomains = getAllowedDomains();
  const emailLower = email.toLowerCase();
  const domainAllowed = allowedDomains.length === 0 || allowedDomains.some((d) => emailLower.endsWith(d));
  if (!domainAllowed) {
    return { error: "Registration is allowed only for the configured corporate domain." };
  }

  const record = await prisma.verificationCode.findUnique({
    where: { email },
  });

  if (!record) {
    return { error: "Code not found. Request a new code." };
  }

  if (record.code !== code) {
    return { error: "Invalid verification code." };
  }

  if (new Date() > record.expiresAt) {
    await prisma.verificationCode.delete({ where: { email } }).catch(() => {});
    return { error: "Code has expired. Request a new code." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    await prisma.verificationCode.delete({ where: { email } }).catch(() => {});
    return { error: "A user with this email is already registered." };
  }

  const count = await prisma.user.count();
  const role = count === 0 ? "ADMIN" : "USER";
  const passwordHash = await hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      surname,
      role,
    },
  });

  await prisma.verificationCode.delete({ where: { email } }).catch(() => {});

  return {};
}
