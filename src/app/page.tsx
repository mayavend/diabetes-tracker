import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="pb-12">
      <section className="relative overflow-hidden rounded-[40px] border border-white/80 bg-gradient-to-br from-white via-sky-50/90 to-cyan-100/70 px-6 py-16 shadow-[0_30px_80px_rgba(148,163,184,0.18)] sm:px-10 lg:px-14 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(186,230,253,0.55),transparent_24%)]" />
        <div className="relative grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Student Project Demo
            </div>

            <h1 className="brand-wordmark mt-8 text-[3.8rem] font-semibold leading-none tracking-[-0.08em] text-slate-950 sm:text-[5.6rem] lg:text-[6.8rem]">
              dia<span className="brand-beat font-bold">BEAT</span>es
            </h1>

            <p className="text-balance mt-6 max-w-2xl text-xl leading-8 text-slate-600 sm:text-2xl">
              Track your glucose. Understand your patterns. Build healthier
              habits.
            </p>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
              A calm, modern diabetes and prediabetes tracking experience for
              logging daily health data, spotting trends, and learning from your
              own routine.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="rounded-full bg-sky-500 px-6 py-3.5 text-center text-base font-semibold text-white shadow-[0_18px_36px_rgba(14,165,233,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-600"
              >
                Open Dashboard
              </Link>
              <Link
                href="/log-entry"
                className="rounded-full border border-sky-200 bg-white/85 px-6 py-3.5 text-center text-base font-semibold text-sky-800 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-50"
              >
                Log Today&apos;s Entry
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[28px] border border-white/90 bg-white/90 p-6 shadow-[0_24px_50px_rgba(148,163,184,0.16)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700/70">
                    Wellness Snapshot
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Built for clarity, not clutter
                  </h2>
                </div>
                <div className="rounded-2xl bg-sky-50 p-4">
                  <div className="relative h-10 w-10">
                    <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-sky-200" />
                    <span className="absolute left-0 top-1/2 h-0.5 w-10 -translate-y-1/2 bg-sky-500 [clip-path:polygon(0_50%,18%_50%,28%_10%,42%_86%,56%_34%,68%_50%,100%_50%,100%_66%,64%_66%,54%_98%,38%_22%,24%_66%,0_66%)]" />
                  </div>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-sky-50/90 p-4">
                  <p className="text-sm font-medium text-slate-500">Log daily</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Glucose
                  </p>
                </div>
                <div className="rounded-2xl bg-cyan-50/90 p-4">
                  <p className="text-sm font-medium text-slate-500">Notice</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Patterns
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">Ask</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Better questions
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-white/90 bg-white/88 p-6 shadow-[0_18px_40px_rgba(148,163,184,0.14)]">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700/70">
                  Designed for habits
                </p>
                <p className="mt-3 text-lg leading-7 text-slate-600">
                  Friendly forms, calmer visuals, and smarter summaries help make
                  the app feel approachable every day.
                </p>
              </div>
              <div className="rounded-[28px] border border-white/90 bg-white/88 p-6 shadow-[0_18px_40px_rgba(148,163,184,0.14)]">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700/70">
                  Demo-ready polish
                </p>
                <p className="mt-3 text-lg leading-7 text-slate-600">
                  A modern blue wellness aesthetic gives your class project the
                  feel of a thoughtful real product.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
