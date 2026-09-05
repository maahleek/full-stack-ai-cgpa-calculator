import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, semesters, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { computeGpa, normalizeScale } from "@/lib/grades";

async function getOwnedSemester(userId: string, id: string) {
  const [sem] = await db
    .select()
    .from(semesters)
    .where(and(eq(semesters.id, id), eq(semesters.userId, userId)))
    .limit(1);
  return sem;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const sem = await getOwnedSemester(session.userId, id);
  if (!sem) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cs = await db
    .select()
    .from(courses)
    .where(eq(courses.semesterId, sem.id));

  const [owner] = await db.select({ scale: users.scale }).from(users).where(eq(users.id, session.userId)).limit(1);
  const scale = normalizeScale(owner?.scale);

  const { gpa, credits } = computeGpa(cs, scale);
  const attemptedCredits = cs.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);

  return NextResponse.json({
    semester: {
      ...sem,
      courseCount: cs.length,
      gradedCount: cs.filter((c) => c.grade).length,
      creditsAttempted: attemptedCredits,
      creditsEarned: credits,
      gpa,
    },
    courses: cs,
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const sem = await getOwnedSemester(session.userId, id);
  if (!sem) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const update: Partial<typeof semesters.$inferInsert> = {};
  if (body.name !== undefined) update.name = String(body.name).trim();
  if (body.term !== undefined) update.term = String(body.term).trim();
  if (body.year !== undefined) update.year = Number(body.year);
  if (body.isCurrent !== undefined) {
    const isCurrent = Boolean(body.isCurrent);
    if (isCurrent) {
      await db
        .update(semesters)
        .set({ isCurrent: false })
        .where(eq(semesters.userId, session.userId));
    }
    update.isCurrent = isCurrent;
  }

  const [updated] = await db
    .update(semesters)
    .set(update)
    .where(eq(semesters.id, id))
    .returning();

  return NextResponse.json({ semester: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const sem = await getOwnedSemester(session.userId, id);
  if (!sem) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // courses cascade delete
  await db.delete(semesters).where(eq(semesters.id, id));
  return NextResponse.json({ ok: true });
}
