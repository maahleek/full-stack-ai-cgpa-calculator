import Link from "next/link";
import { GraduationCap, Sparkles, TrendingUp, BarChart3, Target, Brain } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="font-semibold tracking-tight">GradeLens</div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white/60"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              Get started
            </Link>
          </div>
        </nav>

        <section className="mt-16 grid gap-10 lg:mt-24 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered academic advisor
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Your CGPA, visualized and <span className="bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">optimized</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Track every semester, watch your GPA trend in real time, and get personalized study plans that help you reach your target CGPA.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40"
              >
                Start free <span aria-hidden>→</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400"
              >
                I already have an account
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3 border-t border-slate-200 pt-6 text-sm sm:gap-6">
              <div>
                <div className="text-lg font-semibold text-slate-900 sm:text-2xl">5.0/4.0</div>
                <div className="text-slate-500">GPA scales</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-900 sm:text-2xl">100%</div>
                <div className="text-slate-500">Private data</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-900 sm:text-2xl">∞</div>
                <div className="text-slate-500">Semesters</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-indigo-200 via-white to-emerald-200 opacity-60 blur-2xl" />
            <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400">Current CGPA</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <div className="text-4xl font-bold tracking-tight text-slate-900">3.67</div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">↑ 0.12</span>
                  </div>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-6 h-32 w-full rounded-xl bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
                <svg viewBox="0 0 400 120" className="h-full w-full">
                  <defs>
                    <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M 0 90 L 60 80 L 120 70 L 180 60 L 240 55 L 300 45 L 360 35 L 400 28 L 400 120 L 0 120 Z" fill="url(#g)" />
                  <path d="M 0 90 L 60 80 L 120 70 L 180 60 L 240 55 L 300 45 L 360 35 L 400 28" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-slate-400">Credits</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">78</div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-slate-400">Semesters</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">5</div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-slate-400">Target</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">3.80</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Everything you need to own your GPA</h2>
            <p className="mt-3 text-slate-600">From first-semester jitters to senior-year target setting.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: BarChart3, title: "Beautiful charts", text: "Track semester-by-semester GPA, grade distribution, and difficulty splits." },
              { icon: Brain, title: "AI advisor", text: "Personalized strengths, weaknesses, and a weekly study plan based on your data." },
              { icon: Target, title: "Goal planner", text: "Know exactly what average you need in remaining courses to hit your target." },
              { icon: TrendingUp, title: "Live trends", text: "See your CGPA trajectory update as you enter new grades." },
              { icon: Sparkles, title: "Smart seeding", text: "Try it with realistic demo data on your first login." },
              { icon: GraduationCap, title: "Built for students", text: "5.0 or 4.0 scale, letter grades, credit weighting — the way universities actually work." },
            ].map((f) => (
              <div key={f.title} className="card-hover rounded-2xl border border-slate-200 bg-white p-6">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-indigo-600">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-24 border-t border-slate-200 py-8 text-center text-sm text-slate-500">
          © 2026 GradeLens. Made for Nigerian students.
        </footer>
      </div>
    </main>
  );
}
