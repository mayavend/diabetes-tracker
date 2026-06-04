"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { useClientEntries } from "@/lib/use-client-entries";
import {
  FEELING_OPTIONS,
  FeelingOption,
  SupportEpisode,
} from "@/lib/support-episodes";
import { useSupportEpisodes } from "@/lib/use-support-episodes";

type SupportTool = "quick-log" | "emotional-support" | "emergency";

type QuickLogState = {
  currentGlucose: string;
  feelsLike: SupportEpisode["feelsLike"];
  notes: string;
  recentFood: string;
  symptoms: string;
};

type FeelingsState = {
  emotions: FeelingOption[];
  includeInDoctorReport: boolean;
  thoughts: string;
};

const initialQuickLogState: QuickLogState = {
  currentGlucose: "",
  feelsLike: "not-sure",
  notes: "",
  recentFood: "",
  symptoms: "",
};

const initialFeelingsState: FeelingsState = {
  emotions: [],
  includeInDoctorReport: false,
  thoughts: "",
};

const BREATHING_PHASES = [
  { duration: 4, label: "Breathe In", scale: 1.14 },
  { duration: 4, label: "Hold", scale: 1.14 },
  { duration: 6, label: "Breathe Out", scale: 0.82 },
] as const;

function toggleFeeling(
  feelings: FeelingOption[],
  feeling: FeelingOption,
): FeelingOption[] {
  return feelings.includes(feeling)
    ? feelings.filter((item) => item !== feeling)
    : [...feelings, feeling];
}

function ActionCard({
  description,
  label,
  onClick,
  tone = "sky",
}: {
  description: string;
  label: string;
  onClick: () => void;
  tone?: "sky" | "cyan" | "rose";
}) {
  const toneClasses =
    tone === "rose"
      ? "border-rose-100 bg-rose-50/70 hover:border-rose-200 hover:bg-rose-50"
      : tone === "cyan"
        ? "border-cyan-100 bg-cyan-50/70 hover:border-cyan-200 hover:bg-cyan-50"
        : "border-sky-100 bg-white hover:border-sky-200 hover:bg-sky-50/70";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-[24px] border p-5 text-left shadow-[0_14px_30px_rgba(148,163,184,0.08)] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] ${toneClasses}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{label}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-700">{description}</p>
        </div>
        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 shadow-sm transition-transform duration-200 group-hover:translate-x-0.5">
          Open
        </span>
      </div>
    </button>
  );
}

function SupportModal({
  children,
  onClose,
  subtitle,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/30 px-4 py-6 backdrop-blur-[2px] sm:items-center">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.22)] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
              Support Tool
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-800 transition-colors duration-200 hover:bg-sky-50"
          >
            Close
          </button>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export default function SupportNowPage() {
  const { addEntry, isClientReady: areEntriesReady, entries } = useClientEntries();
  const {
    addSupportEpisode,
    isClientReady: areSupportEpisodesReady,
    supportEpisodes,
  } = useSupportEpisodes();
  const isClientReady = areEntriesReady && areSupportEpisodesReady;
  const [activeTool, setActiveTool] = useState<SupportTool | null>(null);
  const [quickLogForm, setQuickLogForm] = useState<QuickLogState>(initialQuickLogState);
  const [feelingsForm, setFeelingsForm] =
    useState<FeelingsState>(initialFeelingsState);
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathingPhaseIndex, setBreathingPhaseIndex] = useState(0);
  const [breathingSecondsRemaining, setBreathingSecondsRemaining] = useState(
    BREATHING_PHASES[0].duration,
  );
  const [completedBreathingCycles, setCompletedBreathingCycles] = useState(0);
  const [pageMessage, setPageMessage] = useState("");

  const latestSupportEpisode = supportEpisodes[0] ?? null;
  const latestEntry = entries[0] ?? null;
  const sharedSupportCount = useMemo(
    () =>
      supportEpisodes.filter((episode) => episode.includeInDoctorReport).length,
    [supportEpisodes],
  );
  const breathingPhase = BREATHING_PHASES[breathingPhaseIndex];
  const breathingScale = isBreathingActive ? breathingPhase.scale : 0.82;
  const breathingCycleLabel =
    completedBreathingCycles >= 3
      ? "Completed"
      : `Cycle ${Math.min(completedBreathingCycles + 1, 3)} of 3`;

  useEffect(() => {
    if (!isBreathingActive || activeTool !== "emotional-support") return;

    const timer = window.setTimeout(() => {
      if (breathingSecondsRemaining > 1) {
        setBreathingSecondsRemaining((current) => current - 1);
        return;
      }

      const isLastPhase = breathingPhaseIndex === BREATHING_PHASES.length - 1;

      if (isLastPhase) {
        const nextCycles = completedBreathingCycles + 1;
        if (nextCycles >= 3) {
          setCompletedBreathingCycles(nextCycles);
          setIsBreathingActive(false);
          setBreathingPhaseIndex(0);
          setBreathingSecondsRemaining(BREATHING_PHASES[0].duration);
          return;
        }

        setCompletedBreathingCycles(nextCycles);
      }

      const nextPhaseIndex = isLastPhase ? 0 : breathingPhaseIndex + 1;
      setBreathingPhaseIndex(nextPhaseIndex);
      setBreathingSecondsRemaining(BREATHING_PHASES[nextPhaseIndex].duration);
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    activeTool,
    breathingPhaseIndex,
    breathingSecondsRemaining,
    completedBreathingCycles,
    isBreathingActive,
  ]);

  function resetBreathingExercise() {
    setIsBreathingActive(false);
    setBreathingPhaseIndex(0);
    setBreathingSecondsRemaining(BREATHING_PHASES[0].duration);
    setCompletedBreathingCycles(0);
  }

  function startBreathingExercise() {
    resetBreathingExercise();
    setIsBreathingActive(true);
  }

  function closeTool() {
    setActiveTool(null);
    resetBreathingExercise();
  }

  function handleQuickLogSave() {
    if (!isClientReady) return;

    const timestamp = new Date().toISOString();
    const quickSummary = [
      quickLogForm.feelsLike === "low"
        ? "Support Now: feels like low blood sugar."
        : quickLogForm.feelsLike === "high"
          ? "Support Now: feels like high blood sugar."
          : "Support Now: unsure whether this felt high or low.",
      quickLogForm.symptoms.trim()
        ? `Symptoms: ${quickLogForm.symptoms.trim()}.`
        : "",
      quickLogForm.notes.trim() ? `Quick note: ${quickLogForm.notes.trim()}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    addEntry({
      createdAt: timestamp,
      glucose: quickLogForm.currentGlucose
        ? Number(quickLogForm.currentGlucose)
        : null,
      id: crypto.randomUUID(),
      mealNote: quickLogForm.recentFood.trim(),
      exerciseNote: "",
      medication: "",
      notes: quickSummary,
      readingType: "",
      sleepHours: null,
      timestamp,
    });

    setQuickLogForm(initialQuickLogState);
    setPageMessage(
      "Quick log saved to your glucose history. Dashboard, trends, report, and insights are now updated.",
    );
    closeTool();
  }

  function handleFeelingsSave() {
    if (!isClientReady) return;

    addSupportEpisode({
      createdAt: new Date().toISOString(),
      currentGlucose: null,
      emotions: feelingsForm.emotions,
      feelsLike: "not-sure",
      id: crypto.randomUUID(),
      includeInDoctorReport: feelingsForm.includeInDoctorReport,
      notes: "",
      recentFood: "",
      symptoms: "",
      thoughts: feelingsForm.thoughts.trim(),
    });

    setFeelingsForm(initialFeelingsState);
    setPageMessage(
      feelingsForm.includeInDoctorReport
        ? "Feelings note saved and marked for the doctor report."
        : "Feelings note saved privately on this device.",
    );
    closeTool();
  }

  return (
    <div className="relative pb-10">
      <PageHeader
        eyebrow="Support Now"
        title="Calm tools for a concerning glucose moment"
        subtitle="Choose the support tool you need right now. Each one opens in a focused floating panel so you can move one step at a time."
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel className="border-sky-100/90 bg-gradient-to-br from-white via-sky-50/50 to-cyan-50/60">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
            Choose a Support Tool
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Tap the support you need most
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            These tools are designed to feel simple and steady during a stressful
            moment. The page stays in view while each tool opens in a focused
            floating panel.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ActionCard
              label="Quick Log"
              description="Fast logging for your current glucose moment, saved into the same app history used by trends, insights, and reports."
              onClick={() => setActiveTool("quick-log")}
            />
            <ActionCard
              label="Emotional Support"
              description="A calmer space for breathing, emotions, supportive reflection, and choosing whether to include a note in the doctor report."
              onClick={() => setActiveTool("emotional-support")}
              tone="cyan"
            />
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel className="border-rose-100 bg-white">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-700/70">
              Emergency / Urgent Support
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Keep urgent help easy to reach
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Severe symptoms deserve fast help. This panel keeps emergency options
              close without making every glucose moment feel alarming.
            </p>
            <div className="mt-5">
              <ActionCard
                label="Open Emergency Help"
                description="View emergency guidance, a 911 action, and placeholders for a doctor or emergency contact."
                onClick={() => setActiveTool("emergency")}
                tone="rose"
              />
            </div>
          </Panel>

          <Panel>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
              Support Snapshot
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              What has been saved so far
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-sky-100 bg-sky-50/70 p-5">
                <p className="text-sm text-slate-500">Last glucose log</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {isClientReady && latestEntry
                    ? new Date(latestEntry.timestamp || latestEntry.createdAt).toLocaleString()
                    : "Loading..."}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {isClientReady && latestEntry
                    ? latestEntry.glucose !== null
                      ? `${latestEntry.glucose} mg/dL`
                      : "Saved without a glucose number"
                    : "Recent quick logs will appear here."}
                </p>
              </div>

              <div className="rounded-[24px] border border-cyan-100 bg-cyan-50/70 p-5">
                <p className="text-sm text-slate-500">Doctor-report notes</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {isClientReady ? sharedSupportCount : "Loading..."}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {latestSupportEpisode
                    ? `Most recent support note: ${new Date(
                        latestSupportEpisode.createdAt,
                      ).toLocaleString()}`
                    : "Private and shared feelings notes stay local on this device."}
                </p>
              </div>
            </div>

            {pageMessage ? (
              <p className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {pageMessage}
              </p>
            ) : null}
          </Panel>
        </div>
      </div>

      {activeTool === "quick-log" ? (
        <SupportModal
          title="Quick Log"
          subtitle="Capture the essentials quickly. This saves into your regular diaBEATes history so trends and reports stay up to date."
          onClose={closeTool}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Current glucose</span>
              <input
                type="number"
                placeholder="e.g. 64 or 240"
                value={quickLogForm.currentGlucose}
                onChange={(event) =>
                  setQuickLogForm((current) => ({
                    ...current,
                    currentGlucose: event.target.value,
                  }))
                }
                className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">
                What does this feel like?
              </span>
              <select
                value={quickLogForm.feelsLike}
                onChange={(event) =>
                  setQuickLogForm((current) => ({
                    ...current,
                    feelsLike: event.target.value as SupportEpisode["feelsLike"],
                  }))
                }
                className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              >
                <option value="low">Feels like low blood sugar</option>
                <option value="high">Feels like high blood sugar</option>
                <option value="not-sure">Not sure</option>
              </select>
            </label>
          </div>

          <div className="mt-5 grid gap-5">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Symptoms</span>
              <input
                type="text"
                placeholder="e.g. shaky, sweaty, thirsty, dizzy"
                value={quickLogForm.symptoms}
                onChange={(event) =>
                  setQuickLogForm((current) => ({
                    ...current,
                    symptoms: event.target.value,
                  }))
                }
                className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">What did you recently eat?</span>
              <input
                type="text"
                placeholder="Optional meal or snack note"
                value={quickLogForm.recentFood}
                onChange={(event) =>
                  setQuickLogForm((current) => ({
                    ...current,
                    recentFood: event.target.value,
                  }))
                }
                className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Optional note</span>
              <textarea
                rows={3}
                placeholder="Anything else you want to remember right now"
                value={quickLogForm.notes}
                onChange={(event) =>
                  setQuickLogForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleQuickLogSave}
              disabled={!isClientReady}
              className="rounded-full bg-sky-500 px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_36px_rgba(14,165,233,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save to App History
            </button>
            <p className="text-sm text-slate-500">
              This quick log feeds your dashboard, trends, report, and insights.
            </p>
          </div>
        </SupportModal>
      ) : null}

      {activeTool === "emotional-support" ? (
        <SupportModal
          title="Emotional Support"
          subtitle="A supportive space for breathing, reflection, and choosing whether to include your note in the doctor report."
          onClose={closeTool}
        >
          <div className="space-y-6">
            <div className="rounded-[28px] border border-cyan-100 bg-gradient-to-br from-cyan-50 via-sky-50/70 to-white p-5 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700/70">
                    Guided Breathing
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Follow the rhythm
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                    Let the circle guide you through a steady 4-4-6 pattern:
                    breathe in, hold, and breathe out. The visual is meant to do
                    the pacing for you.
                  </p>
                </div>
                <div className="rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                  {breathingCycleLabel}
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center">
                <div className="relative flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
                  <div className="absolute inset-6 rounded-full bg-sky-100/80 blur-2xl" />
                  <div
                    className="absolute inset-4 rounded-full border border-cyan-200/80 bg-white/55 shadow-[0_0_0_18px_rgba(186,230,253,0.35)] transition-transform ease-in-out"
                    style={{
                      transform: `scale(${breathingScale})`,
                      transitionDuration: `${breathingPhase.duration}s`,
                    }}
                  />
                  <div
                    className="absolute inset-10 rounded-full bg-gradient-to-br from-cyan-300 via-sky-300 to-blue-200 opacity-85 transition-transform ease-in-out"
                    style={{
                      transform: `scale(${breathingScale})`,
                      transitionDuration: `${breathingPhase.duration}s`,
                    }}
                  />
                  <div className="relative z-10 rounded-full border border-white/80 bg-white/85 px-8 py-8 text-center shadow-[0_20px_50px_rgba(148,163,184,0.18)] backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700/70">
                      Current Phase
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                      {isBreathingActive || completedBreathingCycles >= 3
                        ? breathingPhase.label
                        : "Ready"}
                    </p>
                    <p className="mt-3 text-5xl font-semibold tracking-tight text-slate-950">
                      {isBreathingActive ? breathingSecondsRemaining : "4"}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      seconds
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] border border-white/80 bg-white/85 px-5 py-4 text-center shadow-[0_14px_30px_rgba(148,163,184,0.08)]">
                  <p className="text-sm leading-6 text-slate-700">
                    {completedBreathingCycles >= 3
                      ? "You finished three calm breathing cycles. Stay here for another moment if that feels helpful."
                      : isBreathingActive
                        ? `${breathingPhase.label} for ${breathingPhase.duration} seconds, and let the motion set the pace.`
                        : "Press start when you want the guided breathing visual to begin."}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={isBreathingActive ? resetBreathingExercise : startBreathingExercise}
                  className="rounded-full bg-amber-400 px-6 py-3.5 text-base font-semibold text-slate-900 shadow-[0_18px_36px_rgba(251,191,36,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300"
                >
                  {isBreathingActive ? "Reset Breathing" : "Start Breathing"}
                </button>
                <p className="text-sm text-slate-500">
                  A slow breath can make the next decision feel a little more manageable.
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-cyan-100 bg-cyan-50/70 p-5">
              <p className="text-base leading-7 text-slate-700">
                Feeling scared, frustrated, or overwhelmed right now is understandable.
                You do not need to solve everything at once.
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                <li>Start with one next step instead of the whole picture.</li>
                <li>A quick log or a note here can reduce the pressure to remember everything.</li>
                <li>If you need support, it is okay to reach out to someone you trust.</li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
                Feelings Check-In
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Capture what this moment feels like
              </h3>
              <div className="mt-5 flex flex-wrap gap-2">
                {FEELING_OPTIONS.map((feeling) => {
                  const selected = feelingsForm.emotions.includes(feeling);
                  return (
                    <button
                      key={feeling}
                      type="button"
                      onClick={() =>
                        setFeelingsForm((current) => ({
                          ...current,
                          emotions: toggleFeeling(current.emotions, feeling),
                        }))
                      }
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                        selected
                          ? "bg-sky-500 text-white shadow-[0_12px_24px_rgba(14,165,233,0.22)]"
                          : "border border-sky-100 bg-white text-sky-800 hover:bg-sky-50"
                      }`}
                    >
                      {feeling}
                    </button>
                  );
                })}
              </div>

              <label className="mt-5 flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Thoughts and feelings</span>
                <textarea
                  rows={5}
                  placeholder="Write what you are feeling, what felt hard, or what you want to remember."
                  value={feelingsForm.thoughts}
                  onChange={(event) =>
                    setFeelingsForm((current) => ({
                      ...current,
                      thoughts: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </label>

              <div className="mt-5 flex flex-col gap-3 rounded-[24px] border border-sky-100 bg-sky-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={feelingsForm.includeInDoctorReport}
                    onChange={(event) =>
                      setFeelingsForm((current) => ({
                        ...current,
                        includeInDoctorReport: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-sky-300 text-sky-500 focus:ring-sky-300"
                  />
                  Include in doctor report
                </label>
                <p className="text-sm text-slate-500">
                  Leave unchecked to keep this note private.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleFeelingsSave}
                  disabled={!isClientReady}
                  className="rounded-full bg-sky-500 px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_36px_rgba(14,165,233,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Save Feelings Note
                </button>
                <p className="text-sm text-slate-500">
                  Shared notes can appear in the provider report later.
                </p>
              </div>
            </div>
          </div>
        </SupportModal>
      ) : null}

      {activeTool === "emergency" ? (
        <SupportModal
          title="Emergency Help"
          subtitle="Not every high or low reading needs emergency care, but severe symptoms deserve fast help."
          onClose={closeTool}
        >
          <div className="rounded-[24px] border border-rose-100 bg-rose-50/70 p-5">
            <p className="text-base leading-7 text-slate-700">
              Emergency help is especially important for confusion, fainting,
              seizure, trouble breathing, severe vomiting, chest pain, or
              unresponsiveness.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <a
              href="tel:911"
              className="rounded-[24px] bg-rose-500 px-5 py-4 text-center text-base font-semibold text-white shadow-[0_18px_36px_rgba(244,63,94,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-600"
            >
              Call 911
            </a>
            <button
              type="button"
              className="rounded-[24px] border border-sky-200 bg-white px-5 py-4 text-base font-semibold text-sky-800 transition-colors duration-200 hover:bg-sky-50"
            >
              Emergency Contact
            </button>
            <button
              type="button"
              className="rounded-[24px] border border-sky-200 bg-white px-5 py-4 text-base font-semibold text-sky-800 transition-colors duration-200 hover:bg-sky-50"
            >
              Call Doctor
            </button>
          </div>
        </SupportModal>
      ) : null}
    </div>
  );
}
