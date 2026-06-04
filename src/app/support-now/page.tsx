"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import {
  FEELING_OPTIONS,
  FeelingOption,
  SupportEpisode,
} from "@/lib/support-episodes";
import { useSupportEpisodes } from "@/lib/use-support-episodes";

type QuickLogState = {
  currentGlucose: string;
  emotions: FeelingOption[];
  feelsLike: SupportEpisode["feelsLike"];
  includeInDoctorReport: boolean;
  notes: string;
  recentFood: string;
  symptoms: string;
  thoughts: string;
};

const initialQuickLogState: QuickLogState = {
  currentGlucose: "",
  emotions: [],
  feelsLike: "not-sure",
  includeInDoctorReport: false,
  notes: "",
  recentFood: "",
  symptoms: "",
  thoughts: "",
};

function toggleFeeling(
  feelings: FeelingOption[],
  feeling: FeelingOption,
): FeelingOption[] {
  return feelings.includes(feeling)
    ? feelings.filter((item) => item !== feeling)
    : [...feelings, feeling];
}

export default function SupportNowPage() {
  const { addSupportEpisode, isClientReady, supportEpisodes } = useSupportEpisodes();
  const [form, setForm] = useState<QuickLogState>(initialQuickLogState);
  const [saveMessage, setSaveMessage] = useState("");

  const latestEpisode = supportEpisodes[0] ?? null;

  function handleSaveEpisode() {
    if (!isClientReady) return;

    addSupportEpisode({
      createdAt: new Date().toISOString(),
      currentGlucose: form.currentGlucose ? Number(form.currentGlucose) : null,
      emotions: form.emotions,
      feelsLike: form.feelsLike,
      id: crypto.randomUUID(),
      includeInDoctorReport: form.includeInDoctorReport,
      notes: form.notes.trim(),
      recentFood: form.recentFood.trim(),
      symptoms: form.symptoms.trim(),
      thoughts: form.thoughts.trim(),
    });

    setForm(initialQuickLogState);
    setSaveMessage("Support note saved.");
  }

  return (
    <div className="pb-10">
      <PageHeader
        eyebrow="Support Now"
        title="Gentle support for a concerning moment"
        subtitle="Use this page for a quick check-in, calm guidance, and a simple way to capture what is happening right now."
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
            Quick Log Episode
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Capture the moment quickly
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            This shorter form is meant for urgent or stressful moments when you want
            to log the essentials without opening the full entry flow.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Current glucose</span>
              <input
                type="number"
                placeholder="e.g. 64 or 240"
                value={form.currentGlucose}
                onChange={(event) =>
                  setForm((current) => ({
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
                value={form.feelsLike}
                onChange={(event) =>
                  setForm((current) => ({
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
                value={form.symptoms}
                onChange={(event) =>
                  setForm((current) => ({
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
                value={form.recentFood}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    recentFood: event.target.value,
                  }))
                }
                className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Optional notes</span>
              <textarea
                rows={3}
                placeholder="Anything else you want to remember right now"
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </label>
          </div>

          <div className="mt-6 rounded-[24px] border border-sky-100 bg-sky-50/60 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700/70">
              Thoughts and Feelings
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {FEELING_OPTIONS.map((feeling) => {
                const selected = form.emotions.includes(feeling);
                return (
                  <button
                    key={feeling}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
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
              <span className="font-medium text-slate-700">Write your thoughts and feelings</span>
              <textarea
                rows={4}
                placeholder="You can write what you are feeling, what worried you, or what you want to remember."
                value={form.thoughts}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    thoughts: event.target.value,
                  }))
                }
                className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.includeInDoctorReport}
                  onChange={(event) =>
                    setForm((current) => ({
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
          </div>

          {saveMessage ? (
            <p className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {saveMessage}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleSaveEpisode}
              disabled={!isClientReady}
              className="rounded-full bg-sky-500 px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_36px_rgba(14,165,233,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save Support Episode
            </button>
            {latestEpisode ? (
              <p className="text-sm text-slate-500">
                Last saved: {new Date(latestEpisode.createdAt).toLocaleString()}
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                Saved episodes stay local on this device for now.
              </p>
            )}
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
              Immediate Support
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Calm guidance for right now
            </h2>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[24px] border border-sky-100 bg-sky-50/70 p-5">
                <h3 className="text-lg font-semibold text-slate-950">
                  Low Blood Sugar Support
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  If this feels like a low, take a slow breath and check your
                  glucose if you can. It may help to follow your usual low-blood-sugar
                  care plan, recheck based on that plan, and get help promptly if
                  symptoms feel severe or are not improving.
                </p>
              </div>

              <div className="rounded-[24px] border border-sky-100 bg-white p-5">
                <h3 className="text-lg font-semibold text-slate-950">
                  High Blood Sugar Support
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  If this feels like a high, it may help to log the reading and
                  think gently about possible contributors such as recent food,
                  missed medication, illness, or stress. Recheck according to your
                  usual care plan, and seek urgent help if symptoms feel severe.
                </p>
              </div>

              <div className="rounded-[24px] border border-sky-100 bg-cyan-50/70 p-5">
                <h3 className="text-lg font-semibold text-slate-950">
                  Emotional Support
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Feeling scared, frustrated, or overwhelmed in a glucose moment is
                  understandable. You do not need to solve everything at once. Focus
                  on one next step, then another.
                </p>
              </div>
            </div>
          </Panel>

          <Panel className="border-rose-100 bg-white">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-700/70">
              Emergency Help
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Get urgent help if symptoms are severe
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Emergency help is especially important for severe symptoms such as
              confusion, fainting, seizure, trouble breathing, severe vomiting,
              chest pain, or unresponsiveness. Not every high or low reading needs
              911, but severe symptoms do deserve fast help.
            </p>
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
          </Panel>

          <Panel>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
              Guided Calming
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Take a steady minute
            </h2>
            <div className="mt-5 rounded-[24px] border border-sky-100 bg-sky-50/70 p-5">
              <p className="text-base leading-7 text-slate-700">
                Try this: breathe in for 4, hold for 4, and breathe out for 6.
                Repeat that three times. Then name 3 things you can see, 2 things
                you can feel, and 1 next step you can take.
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                You are allowed to slow the moment down. Calm attention can make the
                next decision easier.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
