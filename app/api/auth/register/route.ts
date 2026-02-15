import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const allowedDomain = process.env.ALLOWED_DOMAIN?.trim();
if (!allowedDomain) {
  console.warn("ALLOWED_DOMAIN is not set — domain restriction for registration is disabled.");
}

const NAME_SURNAME_MAX = 50;
const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").max(NAME_SURNAME_MAX, `Name up to ${NAME_SURNAME_MAX} characters`),
  surname: z.string().min(1, "Surname is required").max(NAME_SURNAME_MAX, `Surname up to ${NAME_SURNAME_MAX} characters`),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      return NextResponse.json(
        { error: first || "Invalid data" },
        { status: 400 }
      );
    }

    const { email, password, name, surname } = parsed.data;

    if (allowedDomain && !email.endsWith(allowedDomain)) {
      return NextResponse.json(
        { error: "Registration is allowed only for the configured corporate domain." },
        { status: 403 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email is already registered." },
        { status: 409 }
      );
    }

    const count = await prisma.user.count();
    const role = count === 0 ? "ADMIN" : "USER";

    const passwordHash = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        surname,
        role,
      },
      select: { id: true, email: true, name: true, surname: true, role: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json(
      { error: "Registration failed." },
      { status: 500 }
    );
  }
}
