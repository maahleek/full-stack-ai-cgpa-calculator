import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";
import { DEFAULT_SCALE } from "@/lib/grades";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const { allowed, retryAfterSeconds } = rateLimit(`signup:${clientIp(req)}`, {
      max: 5,
      windowMs: 30 * 60 * 1000,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many signup attempts. Try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const password = String(body.password || "");

    if (!email || !name) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must include at least one letter and one number." },
        { status: 400 }
      );
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const [created] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
        university: body.university || null,
        program: body.program || null,
        targetCgpa: body.targetCgpa ? String(body.targetCgpa) : "3.50",
        scale: DEFAULT_SCALE === "5.0" ? "5.00" : "4.00",
      })
      .returning();

    const token = await createSessionToken({ userId: created.id, email: created.email });
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        university: created.university,
        program: created.program,
        targetCgpa: created.targetCgpa,
        scale: created.scale,
      },
    });
  } catch (err) {
    console.error("signup error", err);
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }
}
