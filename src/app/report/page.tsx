"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SummaryCard } from "@/components/summary-card";
import {
  ELEVATED_GLUCOSE_THRESHOLD,
  computeGlucoseAnalytics,
  formatMetric,
} from "@/lib/analytics";
import { Entry } from "@/lib/entries";
import { useClientEntries } from "@/lib/use-client-entries";
import { SupportEpisode } from "@/lib/support-episodes";
import { useSupportEpisodes } from "@/lib/use-support-episodes";

type SendFormState = {
  doctorEmail: string;
  doctorName: string;
  message: string;
  subject: string;
};

const initialSendFormState: SendFormState = {
  doctorEmail: "",
  doctorName: "",
  message:
    "Hello,\n\nI am sharing my latest diaBEATes glucose summary PDF for review before our next visit.\n\nThank you.",
  subject: "diaBEATes glucose summary report",
};

function getDisplayTimestamp(entry: Entry) {
  return new Date(entry.timestamp || entry.createdAt).toLocaleString();
}

function getRangeText(entries: Entry[]) {
  if (entries.length === 0) return "No entries yet";

  const timestamps = entries.map((entry) =>
    new Date(entry.timestamp || entry.createdAt).getTime(),
  );
  const minDate = new Date(Math.min(...timestamps));
  const maxDate = new Date(Math.max(...timestamps));

  return `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`;
}

function getTopInsights(insights: string[]) {
  return insights.slice(0, 3);
}

function getProviderSummary(analytics: ReturnType<typeof computeGlucoseAnalytics>) {
  const takeaways: string[] = [];

  if (analytics.comparison === "improved" && analytics.last7DaysAverage !== null) {
    takeaways.push(
      `Last 7-day average improved to ${analytics.last7DaysAverage.toFixed(0)} mg/dL.`,
    );
  }
  if (analytics.comparison === "worsened" && analytics.last7DaysAverage !== null) {
    takeaways.push(
      `Last 7-day average increased to ${analytics.last7DaysAverage.toFixed(0)} mg/dL.`,
    );
  }
  if (
    analytics.averageAfterMealGlucose !== null &&
    analytics.averageFastingGlucose !== null &&
    analytics.averageAfterMealGlucose >= analytics.averageFastingGlucose + 15
  ) {
    takeaways.push(
      `After-meal readings remain higher than fasting readings (${analytics.averageAfterMealGlucose.toFixed(0)} vs ${analytics.averageFastingGlucose.toFixed(0)} mg/dL).`,
    );
  }
  if (analytics.elevatedCount > 0) {
    takeaways.push(
      `${analytics.elevatedCount} elevated reading${analytics.elevatedCount === 1 ? "" : "s"} recorded above ${ELEVATED_GLUCOSE_THRESHOLD} mg/dL.`,
    );
  }
  if (analytics.glucoseRange !== null) {
    takeaways.push(
      `Recorded glucose variability spans ${analytics.glucoseRange.toFixed(0)} mg/dL.`,
    );
  }
  if (analytics.averageSleep !== null) {
    takeaways.push(
      `Average recorded sleep is ${analytics.averageSleep.toFixed(1)} hours.`,
    );
  }

  if (takeaways.length === 0) {
    takeaways.push(
      "There is not yet enough glucose data for a full provider-facing summary, but current entries are being captured consistently.",
    );
  }

  return takeaways.slice(0, 3);
}

function getSleepBehaviorNotes(
  analytics: ReturnType<typeof computeGlucoseAnalytics>,
  entries: Entry[],
) {
  const notes: string[] = [];
  const entriesWithMeals = entries.filter((entry) => entry.mealNote.trim() !== "");
  const entriesWithExercise = entries.filter(
    (entry) => entry.exerciseNote.trim() !== "",
  );
  const entriesWithSleep = entries.filter((entry) => entry.sleepHours !== null);

  if (analytics.averageSleep !== null) {
    notes.push(`Average recorded sleep: ${analytics.averageSleep.toFixed(1)} hours.`);
  }

  const sleepInsight = analytics.insights.find((insight) =>
    insight.toLowerCase().includes("sleep"),
  );
  if (sleepInsight) {
    notes.push(sleepInsight);
  }

  if (entriesWithMeals.length > 0) {
    notes.push(
      `${entriesWithMeals.length} entr${entriesWithMeals.length === 1 ? "y includes" : "ies include"} meal notes, which helps interpret post-meal patterns.`,
    );
  }

  if (entriesWithExercise.length > 0) {
    notes.push(
      `${entriesWithExercise.length} entr${entriesWithExercise.length === 1 ? "y includes" : "ies include"} exercise notes.`,
    );
  } else if (entriesWithSleep.length > 0) {
    notes.push(
      "Exercise notes are still limited, so activity-related interpretation is less certain than sleep-related interpretation.",
    );
  }

  return notes.slice(0, 4);
}

function getNotableEntries(entries: Entry[]) {
  const glucoseEntries = entries.filter(
    (entry): entry is Entry & { glucose: number } => entry.glucose !== null,
  );

  const selected: Entry[] = [];

  const highest = glucoseEntries.length
    ? glucoseEntries.reduce((best, entry) =>
        entry.glucose > best.glucose ? entry : best,
      )
    : null;
  const lowest = glucoseEntries.length
    ? glucoseEntries.reduce((best, entry) =>
        entry.glucose < best.glucose ? entry : best,
      )
    : null;
  const latestAfterMealHigh =
    glucoseEntries.find(
      (entry) => entry.readingType === "After Meal" && entry.glucose > 180,
    ) ?? null;
  const latestFasting =
    glucoseEntries.find((entry) => entry.readingType === "Fasting") ?? null;
  const latestOverall = glucoseEntries[0] ?? null;

  [highest, lowest, latestAfterMealHigh, latestFasting, latestOverall].forEach(
    (entry) => {
      if (entry && !selected.some((item) => item.id === entry.id)) {
        selected.push(entry);
      }
    },
  );

  return selected.slice(0, 5);
}

function getDiscussionPoints(
  analytics: ReturnType<typeof computeGlucoseAnalytics>,
  entries: Entry[],
  sharedSupportNotes: SupportEpisode[],
) {
  const points: string[] = [];

  if (
    analytics.averageAfterMealGlucose !== null &&
    analytics.averageFastingGlucose !== null &&
    analytics.averageAfterMealGlucose >= analytics.averageFastingGlucose + 15
  ) {
    points.push(
      "Are after-meal spikes consistently high enough to review meal composition, timing, or portion patterns?",
    );
  }

  if (
    analytics.insights.some((insight) =>
      insight.toLowerCase().includes("sleep average was lower"),
    )
  ) {
    points.push(
      "Could lower sleep be contributing to higher readings on some days?",
    );
  }

  if (analytics.averageFastingGlucose === null) {
    points.push(
      "Would more fasting readings help create a clearer baseline assessment?",
    );
  }

  if (analytics.elevatedCount > 0) {
    points.push(
      "Do the elevated readings cluster around a particular time, reading type, or behavior pattern?",
    );
  }

  const entriesWithoutExercise = entries.filter(
    (entry) => entry.exerciseNote.trim() === "",
  ).length;
  if (entriesWithoutExercise > 0) {
    points.push(
      "Would adding more exercise context improve interpretation of higher readings?",
    );
  }

  if (sharedSupportNotes.some((episode) => episode.emotions.length > 0)) {
    points.push(
      "Do the patient-reported emotions around concerning episodes suggest a need for more support around stress or anxiety during glucose swings?",
    );
  }

  if (
    sharedSupportNotes.some(
      (episode) => episode.feelsLike === "low" || episode.feelsLike === "high",
    )
  ) {
    points.push(
      "Would it help to review the care plan for moments that feel like a low or high, especially when symptoms and readings do not line up clearly?",
    );
  }

  if (points.length === 0) {
    points.push(
      "Are current tracking habits sufficient, or would more fasting and after-meal checks improve interpretation?",
    );
  }

  return points.slice(0, 5);
}

function getReportSummaryText({
  analytics,
  dateRange,
  discussionPoints,
  providerSummary,
  reportDate,
  sharedSupportNotes,
}: {
  analytics: ReturnType<typeof computeGlucoseAnalytics>;
  dateRange: string;
  discussionPoints: string[];
  providerSummary: string[];
  reportDate: string;
  sharedSupportNotes: SupportEpisode[];
}) {
  return [
    "diaBEATes Provider Summary",
    `Report Date: ${reportDate}`,
    `Date Range: ${dateRange}`,
    "",
    "Summary for Provider",
    ...providerSummary.map((line) => `- ${line}`),
    "",
    `Average Glucose: ${formatMetric(analytics.averageGlucose, { suffix: " mg/dL" })}`,
    `Fasting Average: ${formatMetric(analytics.averageFastingGlucose, { suffix: " mg/dL" })}`,
    `After-Meal Average: ${formatMetric(analytics.averageAfterMealGlucose, { suffix: " mg/dL" })}`,
    `Highest / Lowest: ${formatMetric(analytics.highestGlucose, { suffix: " mg/dL" })} / ${formatMetric(analytics.lowestGlucose, { suffix: " mg/dL" })}`,
    `Elevated Readings > ${ELEVATED_GLUCOSE_THRESHOLD}: ${analytics.elevatedCount}`,
    `Glucose Range: ${formatMetric(analytics.glucoseRange, { suffix: " mg/dL" })}`,
    "",
    "Patient-Reported Thoughts",
    ...(sharedSupportNotes.length > 0
      ? sharedSupportNotes.map((episode) => {
          const emotions =
            episode.emotions.length > 0
              ? ` (${episode.emotions.join(", ")})`
              : "";

          return `- ${new Date(episode.createdAt).toLocaleString()}: ${episode.thoughts}${emotions}`;
        })
      : ["- No support notes were marked for provider review."]),
    "",
    "Questions to Discuss",
    ...discussionPoints.map((point) => `- ${point}`),
  ].join("\n");
}

export default function ReportPage() {
  const { entries, isClientReady } = useClientEntries();
  const {
    isClientReady: isSupportClientReady,
    supportEpisodes,
  } = useSupportEpisodes();
  const [copyMessage, setCopyMessage] = useState("");
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendForm, setSendForm] = useState<SendFormState>(initialSendFormState);
  const [sendMessage, setSendMessage] = useState("");
  const analytics = computeGlucoseAnalytics(entries);
  const reportReady = isClientReady && isSupportClientReady;
  const sharedSupportNotes = supportEpisodes
    .filter(
      (episode) =>
        episode.includeInDoctorReport &&
        (episode.thoughts.trim() !== "" || episode.emotions.length > 0),
    )
    .slice(0, 4);

  const reportDate = reportReady ? new Date().toLocaleDateString() : "Loading...";
  const dateRange = reportReady ? getRangeText(analytics.sortedEntries) : "Loading...";
  const providerSummary = getProviderSummary(analytics);
  const keyInsights = getTopInsights(analytics.insights);
  const sleepBehaviorNotes = getSleepBehaviorNotes(analytics, analytics.sortedEntries);
  const notableEntries = getNotableEntries(analytics.sortedEntries);
  const discussionPoints = getDiscussionPoints(
    analytics,
    analytics.sortedEntries,
    sharedSupportNotes,
  );
  const reportText = getReportSummaryText({
    analytics,
    dateRange,
    discussionPoints,
    providerSummary,
    reportDate,
    sharedSupportNotes,
  });

  async function handleCopyReport() {
    if (!reportReady) return;
    await navigator.clipboard.writeText(reportText);
    setCopyMessage("Report summary copied.");
  }

  function handlePrintPdf() {
    if (!reportReady) return;
    window.print();
  }

  function handlePrepareSend() {
    setIsSendModalOpen(true);
    setSendMessage("");
  }

  function closeSendModal() {
    setIsSendModalOpen(false);
    setSendMessage("");
  }

  function handlePrepareDraft() {
    setSendMessage(
      "Prepared locally. Real email sending can be connected later with a secure backend or approved email service.",
    );
  }

  return (
    <div className="report-print-root pb-10">
      <div className="print:hidden">
        <PageHeader
          eyebrow="Provider Report"
          title="Professional summary for review and sharing"
          subtitle="A cleaner provider-facing snapshot of glucose patterns, behavior context, and discussion points that can be shared as a PDF."
        />
      </div>

      <Panel className="border-sky-100/80 bg-white p-0 print:rounded-none print:border-0 print:bg-white print:shadow-none">
        <div className="border-b border-sky-100 px-6 py-6 sm:px-8 print:px-0">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
                diaBEATes Clinical Summary
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Glucose Tracking Report
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Structured summary of recent glucose entries, related behavior notes,
                and questions that may support a provider conversation.
              </p>
            </div>

            <div className="grid gap-3 rounded-[24px] border border-sky-100 bg-sky-50/70 p-5 text-sm text-slate-700 sm:min-w-[280px]">
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium text-slate-500">Report Date</span>
                <span className="font-semibold text-slate-900">{reportDate}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium text-slate-500">Date Range</span>
                <span className="font-semibold text-right text-slate-900">
                  {dateRange}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium text-slate-500">Entries Included</span>
                <span className="font-semibold text-slate-900">
                  {reportReady ? analytics.totalEntries : "Loading..."}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 print:hidden">
            <button
              type="button"
              onClick={handlePrintPdf}
              disabled={!reportReady}
              className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(14,165,233,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={handlePrepareSend}
              disabled={!reportReady}
              className="rounded-full border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-800 transition-all duration-200 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Prepare to Send Report
            </button>
            <button
              type="button"
              onClick={handleCopyReport}
              disabled={!reportReady}
              className="rounded-full border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Copy Report Summary
            </button>
          </div>

          {copyMessage ? (
            <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 print:hidden">
              {copyMessage}
            </p>
          ) : null}
        </div>

        <div className="px-6 py-6 sm:px-8 print:px-0">
          <section className="mb-8">
            <div className="rounded-[28px] border border-sky-100 bg-gradient-to-br from-sky-50/90 via-white to-cyan-50/70 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
                Summary for Provider
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Important takeaways
              </h2>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {providerSummary.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/90 bg-white/90 px-4 py-4 shadow-[0_12px_28px_rgba(148,163,184,0.08)]"
                  >
                    <p className="text-sm leading-6 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
              Overview
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Core metrics at a glance
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <SummaryCard
                label="Average Glucose"
                value={
                  reportReady
                    ? formatMetric(analytics.averageGlucose, { suffix: " mg/dL" })
                    : "Loading..."
                }
              />
              <SummaryCard
                label="Fasting Average"
                value={
                  reportReady
                    ? formatMetric(analytics.averageFastingGlucose, {
                        suffix: " mg/dL",
                      })
                    : "Loading..."
                }
              />
              <SummaryCard
                label="After-Meal Average"
                value={
                  reportReady
                    ? formatMetric(analytics.averageAfterMealGlucose, {
                        suffix: " mg/dL",
                      })
                    : "Loading..."
                }
              />
            </div>
          </section>

          <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
                Key Insights
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Highest-value findings
              </h2>
              <div className="mt-5 space-y-3">
                {reportReady ? (
                  keyInsights.map((insight, index) => (
                    <div
                      key={insight}
                      className="rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700/60">
                        Finding {index + 1}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{insight}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Loading provider insights...</p>
                )}
              </div>
            </section>

            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
                Glucose Summary
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Doctor-facing metrics
              </h2>
              <div className="mt-5 rounded-[28px] border border-sky-100 bg-slate-50/70 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-500">Highest Glucose</p>
                    <p className="mt-1 text-xl font-semibold text-slate-950">
                      {formatMetric(analytics.highestGlucose, { suffix: " mg/dL" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Lowest Glucose</p>
                    <p className="mt-1 text-xl font-semibold text-slate-950">
                      {formatMetric(analytics.lowestGlucose, { suffix: " mg/dL" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Elevated Readings</p>
                    <p className="mt-1 text-xl font-semibold text-slate-950">
                      {reportReady ? analytics.elevatedCount : "Loading..."}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Above {ELEVATED_GLUCOSE_THRESHOLD} mg/dL
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Glucose Range</p>
                    <p className="mt-1 text-xl font-semibold text-slate-950">
                      {formatMetric(analytics.glucoseRange, { suffix: " mg/dL" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Last 7-Day Average</p>
                    <p className="mt-1 text-xl font-semibold text-slate-950">
                      {formatMetric(analytics.last7DaysAverage, {
                        suffix: " mg/dL",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Previous 7-Day Average</p>
                    <p className="mt-1 text-xl font-semibold text-slate-950">
                      {formatMetric(analytics.previous7DaysAverage, {
                        suffix: " mg/dL",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
                Sleep / Behavior Notes
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Context that may matter
              </h2>
              <div className="mt-5 rounded-[28px] border border-sky-100 bg-white p-5">
                <ul className="space-y-3">
                  {sleepBehaviorNotes.map((note) => (
                    <li key={note} className="text-sm leading-6 text-slate-700">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
                Questions or Points to Discuss with Doctor
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Discussion prompts
              </h2>
              <div className="mt-5 rounded-[28px] border border-sky-100 bg-white p-5">
                <ul className="space-y-3">
                  {discussionPoints.map((point) => (
                    <li key={point} className="text-sm leading-6 text-slate-700">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>

          <section className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
              Patient-Reported Thoughts
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Notes chosen for provider review
            </h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {!reportReady ? (
                <div className="rounded-2xl border border-sky-100 bg-white px-5 py-5 text-sm text-slate-500">
                  Loading shared support notes...
                </div>
              ) : sharedSupportNotes.length === 0 ? (
                <div className="rounded-2xl border border-sky-100 bg-white px-5 py-5 text-sm text-slate-500">
                  No support notes have been marked to include in the doctor report.
                </div>
              ) : (
                sharedSupportNotes.map((episode) => (
                  <div
                    key={episode.id}
                    className="rounded-2xl border border-sky-100 bg-white px-5 py-5 shadow-[0_14px_30px_rgba(148,163,184,0.08)]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                        {new Date(episode.createdAt).toLocaleString()}
                      </span>
                      <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
                        {episode.feelsLike === "low"
                          ? "Feels like low"
                          : episode.feelsLike === "high"
                            ? "Feels like high"
                            : "Not sure"}
                      </span>
                    </div>
                    {episode.emotions.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {episode.emotions.map((emotion) => (
                          <span
                            key={emotion}
                            className="rounded-full border border-sky-100 bg-sky-50/70 px-3 py-1 text-xs font-medium text-slate-700"
                          >
                            {emotion}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {episode.thoughts ? (
                      <p className="mt-4 text-sm leading-6 text-slate-700">
                        {episode.thoughts}
                      </p>
                    ) : null}
                    <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                      {episode.currentGlucose !== null ? (
                        <p>Glucose at the time: {episode.currentGlucose} mg/dL</p>
                      ) : null}
                      {episode.symptoms ? <p>Symptoms: {episode.symptoms}</p> : null}
                      {episode.recentFood ? (
                        <p>Recent food: {episode.recentFood}</p>
                      ) : null}
                      {episode.notes ? <p>Support note: {episode.notes}</p> : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
              Recent Notable Entries
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Selected entries for quick review
            </h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {!reportReady ? (
                <div className="rounded-2xl border border-sky-100 bg-white px-5 py-5 text-sm text-slate-500">
                  Loading notable entries...
                </div>
              ) : notableEntries.length === 0 ? (
                <div className="rounded-2xl border border-sky-100 bg-white px-5 py-5 text-sm text-slate-500">
                  No notable entries yet. More glucose logs will populate this section.
                </div>
              ) : (
                notableEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-sky-100 bg-white px-5 py-5 shadow-[0_14px_30px_rgba(148,163,184,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          {getDisplayTimestamp(entry)}
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                          {entry.glucose} mg/dL
                        </p>
                      </div>
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                        {entry.readingType || "Unspecified"}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                      {entry.mealNote ? <p>Meal: {entry.mealNote}</p> : null}
                      {entry.exerciseNote ? <p>Exercise: {entry.exerciseNote}</p> : null}
                      {entry.sleepHours !== null ? (
                        <p>Sleep: {entry.sleepHours.toFixed(1)} hours</p>
                      ) : null}
                      {entry.notes ? <p>Notes: {entry.notes}</p> : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </Panel>

      {isSendModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 print:hidden">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-white/80 bg-white p-6 shadow-[0_26px_70px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
                  Prepare to Send
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Share report with doctor
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  This flow prepares the details for sending and keeps the generated
                  PDF workflow ready for real backend delivery later.
                </p>
              </div>
              <button
                type="button"
                onClick={closeSendModal}
                className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-800 hover:bg-sky-50"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Doctor Name</span>
                <input
                  type="text"
                  value={sendForm.doctorName}
                  onChange={(event) =>
                    setSendForm((current) => ({
                      ...current,
                      doctorName: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Doctor Email</span>
                <input
                  type="email"
                  value={sendForm.doctorEmail}
                  onChange={(event) =>
                    setSendForm((current) => ({
                      ...current,
                      doctorEmail: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </label>
            </div>

            <label className="mt-5 flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Subject Line</span>
              <input
                type="text"
                value={sendForm.subject}
                onChange={(event) =>
                  setSendForm((current) => ({
                    ...current,
                    subject: event.target.value,
                  }))
                }
                className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <label className="mt-5 flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Message</span>
              <textarea
                rows={6}
                value={sendForm.message}
                onChange={(event) =>
                  setSendForm((current) => ({
                    ...current,
                    message: event.target.value,
                  }))
                }
                className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <div className="mt-5 rounded-[24px] border border-sky-100 bg-sky-50/60 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700/70">
                Attachment
              </p>
              <p className="mt-2 text-base font-medium text-slate-900">
                diaBEATes Provider Summary PDF
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Generated from the current report view using the browser&apos;s
                print-to-PDF workflow.
              </p>
            </div>

            {sendMessage ? (
              <p className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {sendMessage}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handlePrintPdf}
                className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(14,165,233,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-600"
              >
                Generate PDF
              </button>
              <button
                type="button"
                onClick={handlePrepareDraft}
                className="rounded-full border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-800 hover:bg-sky-50"
              >
                Prepare Draft
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
