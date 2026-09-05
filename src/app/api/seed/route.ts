import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { courses, semesters, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { DEMO_PROFILE, DEMO_SEMESTERS } from "@/lib/seed-data";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await db
    .select({ id: semesters.id })
    .from(semesters)
    .where(eq(semesters.userId, session.userId))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ seeded: false, reason: "already-seeded" });
  }

  await db
    .update(users)
    .set({
      university: DEMO_PROFILE.university,
      program: DEMO_PROFILE.program,
      targetCgpa: DEMO_PROFILE.targetCgpa,
      // Demo data now uses grades valid on the 5.0 scale, so this no longer
      // needs to override the account's chosen grading scale.
      seeded: true,
    })
    .where(eq(users.id, session.userId));

  for (const s of DEMO_SEMESTERS) {
    const [sem] = await db
      .insert(semesters)
      .values({
        userId: session.userId,
        name: s.meta.name,
        year: s.meta.year,
        term: s.meta.term,
        order: s.meta.order,
        isCurrent: s.meta.isCurrent ?? false,
      })
      .returning();
    if (s.courses.length > 0) {
      await db.insert(courses).values(
        s.courses.map((c) => ({
          semesterId: sem.id,
          code: c.code,
          title: c.title,
          credits: c.credits,
          grade: c.grade ?? null,
          score: c.score ?? null,
          difficulty: c.difficulty ?? "medium",
          notes: c.notes ?? null,
        }))
      );
    }
  }

  const semList = await db
    .select()
    .from(semesters)
    .where(eq(semesters.userId, session.userId))
    .orderBy(asc(semesters.order));

  return NextResponse.json({ seeded: true, semesterCount: semList.length });
}
