import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionToken, setSessionCookie, verifyPassword } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    // Limit by IP+email so one bad actor can't lock out other users sharing an IP,
    // while still stopping rapid-fire guesses against a single account.
    const { allowed, retryAfterSeconds } = rateLimit(`signin:${clientIp(req)}:${email}`, {
      max: 8,
      windowMs: 10 * 60 * 1000,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).` },
        { status: 429 }
      );
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "This account uses Google sign-in. Continue with Google instead." },
        { status: 400 }
      );
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = await createSessionToken({ userId: user.id, email: user.email });
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        university: user.university,
        program: user.program,
        targetCgpa: user.targetCgpa,
        scale: user.scale,
      },
    });
  } catch (err) {
    console.error("signin error", err);
    return NextResponse.json({ error: "Could not sign in." }, { status: 500 });
  }
}
