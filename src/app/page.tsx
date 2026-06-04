import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="pb-12">
      <section className="relative overflow-hidden rounded-[40px] border border-white/80 bg-gradient-to-br from-white via-sky-50/90 to-cyan-100/70 px-6 py-16 shadow-[0_30px_80px_rgba(148,163,184,0.18)] sm:px-10 lg:px-14 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(186,230,253,0.55),transparent_24%)]" />
        <div className="relative grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <h1 className="brand-wordmark text-[3.8rem] font-semibold leading-none tracking-[-0.08em] text-slate-950 sm:text-[5.6rem] lg:text-[6.8rem]">
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
                  <svg viewBox="0 0 24 24" className="h-10 w-10" aria-hidden="true">
                    <path
                      d="M12 2C9.8 5.2 5.5 8.6 5.5 13.2C5.5 17.3 8.4 20 12 20C15.6 20 18.5 17.3 18.5 13.2C18.5 8.6 14.2 5.2 12 2Z"
                      fill="#38bdf8"
                    />
                    <path
                      d="M7.5 13.2H9.6L10.8 10.9L12.5 15.1L13.9 12.7H16.5"
                      fill="none"
                      stroke="white"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.7"
                    />
                  </svg>
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
                  Why Tracking Matters
                </p>
                <p className="mt-3 text-lg leading-7 text-slate-600">
                  Tracking glucose helps people with diabetes or prediabetes
                  notice how meals, sleep, exercise, and daily habits shape their
                  numbers, making patterns easier to catch early.
                </p>
                <div className="mt-5 rounded-2xl bg-sky-50/90 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700/70">
                    CDC Snapshot
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    38.4M
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    U.S. adults live with diabetes, according to the CDC.
                  </p>
                </div>
              </div>
              <div className="rounded-[28px] border border-white/90 bg-white/88 p-6 shadow-[0_18px_40px_rgba(148,163,184,0.14)]">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700/70">
                  Beat Through Awareness
                </p>
                <p className="mt-3 text-lg leading-7 text-slate-600">
                  dia<span className="font-semibold text-sky-700">BEAT</span>es is
                  about building awareness first: small daily logs can turn into
                  stronger habits, better questions, and more confident self-management
                  over time.
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  The goal is not perfection. It is learning what your body is
                  responding to, then using that awareness to make steadier,
                  healthier choices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
