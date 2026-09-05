import { NextResponse } from "next/server";
import crypto from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { allowed, retryAfterSeconds } = rateLimit(`reset-password:${clientIp(req)}`, {
      max: 10,
      windowMs: 30 * 60 * 1000,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const token = String(body.token || "");
    const password = String(body.password || "");

    if (!token) {
      return NextResponse.json({ error: "Reset link is missing or invalid." }, { status: 400 });
    }
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters and include a letter and a number." },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);
    const [record] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt)))
      .limit(1);

    if (!record || record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Request a new one." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await db.update(users).set({ passwordHash }).where(eq(users.id, record.userId));
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, record.id));

    return NextResponse.json({ message: "Password updated. You can now sign in." });
  } catch (err) {
    console.error("reset-password error", err);
    return NextResponse.json({ error: "Could not reset password." }, { status: 500 });
  }
}
