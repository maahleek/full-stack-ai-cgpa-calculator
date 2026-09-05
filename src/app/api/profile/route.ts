import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession, clearSessionCookie } from "@/lib/auth";

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const update: Partial<typeof users.$inferInsert> = {};
  if (body.name !== undefined) update.name = String(body.name).trim();
  if (body.university !== undefined) update.university = String(body.university).trim();
  if (body.program !== undefined) update.program = String(body.program).trim();
  if (body.targetCgpa !== undefined) update.targetCgpa = String(Number(body.targetCgpa));
  if (body.scale !== undefined) {
    const scale = String(body.scale) === "4.0" ? "4.00" : "5.00";
    update.scale = scale;
  }

  const [updated] = await db
    .update(users)
    .set(update)
    .where(eq(users.id, session.userId))
    .returning();

  return NextResponse.json({ user: updated });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Cascade deletes on the semesters/courses/password_reset_tokens foreign keys
  // clean up everything tied to this account automatically.
  await db.delete(users).where(eq(users.id, session.userId));
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
