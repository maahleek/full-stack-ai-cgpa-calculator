import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, semesters, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { gradePoints, scoreToGrade, normalizeScale } from "@/lib/grades";

async function getOwnedCourse(userId: string, courseId: string) {
  const rows = await db
    .select({ course: courses })
    .from(courses)
    .innerJoin(semesters, eq(courses.semesterId, semesters.id))
    .where(and(eq(courses.id, courseId), eq(semesters.userId, userId)))
    .limit(1);
  return rows[0]?.course ?? null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const course = await getOwnedCourse(session.userId, id);
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [owner] = await db.select({ scale: users.scale }).from(users).where(eq(users.id, session.userId)).limit(1);
  const scale = normalizeScale(owner?.scale);

  const body = await req.json();
  const update: Partial<typeof courses.$inferInsert> = {};
  if (body.code !== undefined) update.code = String(body.code).trim().toUpperCase();
  if (body.title !== undefined) update.title = String(body.title).trim();
  if (body.credits !== undefined) {
    const credits = Number(body.credits);
    if (!Number.isFinite(credits) || credits <= 0 || credits > 12) {
      return NextResponse.json({ error: "Credits must be a number between 0 and 12." }, { status: 400 });
    }
    update.credits = String(credits);
  }
  if (body.difficulty !== undefined) update.difficulty = String(body.difficulty);
  if (body.notes !== undefined) update.notes = body.notes ? String(body.notes) : null;

  if (body.score !== undefined) {
    const score = body.score === "" || body.score === null ? null : Number(body.score);
    if (score !== null && (!Number.isFinite(score) || score < 0 || score > 100)) {
      return NextResponse.json({ error: "Score must be a number between 0 and 100." }, { status: 400 });
    }
    update.score = score !== null ? String(score) : null;
  }

  if (body.grade !== undefined) {
    const g = body.grade ? String(body.grade) : null;
    if (g && gradePoints(g, scale) !== null) {
      update.grade = g;
    } else if (!g) {
      // auto-derive from score if present
      const scoreNum = update.score !== undefined ? Number(update.score) : Number(course.score);
      update.grade = scoreToGrade(scoreNum, scale);
    }
  }

  const [updated] = await db
    .update(courses)
    .set(update)
    .where(eq(courses.id, id))
    .returning();

  return NextResponse.json({ course: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const course = await getOwnedCourse(session.userId, id);
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(courses).where(eq(courses.id, id));
  return NextResponse.json({ ok: true });
}
