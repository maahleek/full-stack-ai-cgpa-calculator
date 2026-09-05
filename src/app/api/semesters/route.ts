import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, semesters, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { computeGpa, normalizeScale } from "@/lib/grades";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [owner] = await db.select({ scale: users.scale }).from(users).where(eq(users.id, session.userId)).limit(1);
  const scale = normalizeScale(owner?.scale);

  const semList = await db
    .select()
    .from(semesters)
    .where(eq(semesters.userId, session.userId))
    .orderBy(asc(semesters.order), asc(semesters.year));

  const result = await Promise.all(
    semList.map(async (s) => {
      const cs = await db
        .select()
        .from(courses)
        .where(eq(courses.semesterId, s.id));
      const { gpa, credits } = computeGpa(cs, scale);
      const graded = cs.filter((c) => c.grade);
      const attemptedCredits = cs.reduce(
        (sum, c) => sum + (Number(c.credits) || 0),
        0
      );
      return {
        ...s,
        courseCount: cs.length,
        gradedCount: graded.length,
        creditsAttempted: attemptedCredits,
        creditsEarned: credits,
        gpa,
      };
    })
  );

  return NextResponse.json({ semesters: result });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name || "").trim();
  const term = String(body.term || "Semester").trim();
  const year = Number(body.year);
  const isCurrent = Boolean(body.isCurrent);

  if (!name || !Number.isFinite(year)) {
    return NextResponse.json({ error: "Name and year are required." }, { status: 400 });
  }

  const [maxOrder] = await db
    .select({ o: semesters.order })
    .from(semesters)
    .where(eq(semesters.userId, session.userId))
    .orderBy(asc(semesters.order));

  // Get max order
  const all = await db
    .select({ o: semesters.order })
    .from(semesters)
    .where(eq(semesters.userId, session.userId));
  const maxO = all.reduce((m, r) => Math.max(m, r.o ?? 0), 0);

  if (isCurrent) {
    await db
      .update(semesters)
      .set({ isCurrent: false })
      .where(eq(semesters.userId, session.userId));
  }

  const [created] = await db
    .insert(semesters)
    .values({
      userId: session.userId,
      name,
      term,
      year,
      order: maxO + 1,
      isCurrent,
    })
    .returning();

  // suppress unused
  void maxOrder;

  return NextResponse.json({ semester: { ...created, courseCount: 0, gradedCount: 0, creditsAttempted: 0, creditsEarned: 0, gpa: 0 } });
}
