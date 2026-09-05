import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, semesters, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { gradePoints, scoreToGrade, normalizeScale } from "@/lib/grades";

async function getOwnedSemester(userId: string, semesterId: string) {
  const [sem] = await db
    .select()
    .from(semesters)
    .where(and(eq(semesters.id, semesterId), eq(semesters.userId, userId)))
    .limit(1);
  return sem;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const semesterId = String(body.semesterId || "");
  const code = String(body.code || "").trim().toUpperCase();
  const title = String(body.title || "").trim();
  const credits = Number(body.credits);
  const grade = body.grade ? String(body.grade).trim() : null;
  const score = body.score !== null && body.score !== undefined && body.score !== "" ? Number(body.score) : null;
  const difficulty = String(body.difficulty || "medium");
  const notes = body.notes ? String(body.notes) : null;

  const sem = await getOwnedSemester(session.userId, semesterId);
  if (!sem) return NextResponse.json({ error: "Semester not found." }, { status: 404 });

  if (!code || !title || !Number.isFinite(credits) || credits <= 0) {
    return NextResponse.json({ error: "Code, title, and positive credits are required." }, { status: 400 });
  }
  if (credits > 12) {
    return NextResponse.json({ error: "Credits must be 12 or fewer for a single course." }, { status: 400 });
  }
  if (score !== null && (!Number.isFinite(score) || score < 0 || score > 100)) {
    return NextResponse.json({ error: "Score must be a number between 0 and 100." }, { status: 400 });
  }

  const [owner] = await db.select({ scale: users.scale }).from(users).where(eq(users.id, session.userId)).limit(1);
  const scale = normalizeScale(owner?.scale);

  const finalGrade = grade && gradePoints(grade, scale) !== null ? grade : scoreToGrade(score, scale);

  const [created] = await db
    .insert(courses)
    .values({
      semesterId,
      code,
      title,
      credits: String(credits),
      grade: finalGrade,
      score: score !== null ? String(score) : null,
      difficulty,
      notes,
    })
    .returning();

  return NextResponse.json({ course: created });
}
