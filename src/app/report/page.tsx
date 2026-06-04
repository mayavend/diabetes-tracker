"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SummaryCard } from "@/components/summary-card";
import {
  ELEVATED_GLUCOSE_THRESHOLD,
  computeGlucoseAnalytics,
  formatMetric,
} from "@/lib/analytics";
import { answerGlucoseQuestion } from "@/lib/glucose-qa";
import { Entry } from "@/lib/entries";
import { useClientEntries } from "@/lib/use-client-entries";

function getEntryTimestamp(entry: Entry) {
  return entry.timestamp || entry.createdAt;
}

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const SUGGESTED_QUESTIONS = [
  "Why did my glucose spike today?",
  "What patterns are affecting my glucose?",
  "Are after-meal readings higher than fasting readings?",
  "What should I pay attention to this week?",
];

export default function ReportPage() {
  const { entries, isClientReady } = useClientEntries();
  const [copyMessage, setCopyMessage] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-welcome",
      role: "assistant",
      text: "Ask about your recent glucose patterns, spikes, meal-related readings, or what to focus on this week.",
    },
  ]);
  const analytics = computeGlucoseAnalytics(entries);

  let weeklySummary =
    "There is not enough recent glucose data to compare the last 7 days with the previous 7 days yet.";

  if (
    analytics.last7DaysAverage !== null ||
    analytics.previous7DaysAverage !== null
  ) {
    const recentSentence =
      analytics.last7DaysAverage === null
        ? "No recent 7-day glucose average is available yet."
        : `The last 7 days averaged ${analytics.last7DaysAverage.toFixed(0)} mg/dL.`;
    const previousSentence =
      analytics.previous7DaysAverage === null
        ? "There is not enough prior 7-day data for a full comparison."
        : `The previous 7 days averaged ${analytics.previous7DaysAverage.toFixed(0)} mg/dL.`;
    const trendSentence =
      analytics.comparison === "not-enough-data"
        ? "A clear weekly trend is not available yet."
        : `Overall, glucose ${analytics.comparisonLabel.toLowerCase()} compared with the previous week.`;

    weeklySummary = `${recentSentence} ${previousSentence} ${trendSentence}`;
  }

  const reportText = [
    "Diabetes Tracker Report",
    "",
    `Average Glucose: ${formatMetric(analytics.averageGlucose, { suffix: " mg/dL" })}`,
    `Average Fasting Glucose: ${formatMetric(analytics.averageFastingGlucose, { suffix: " mg/dL" })}`,
    `Average After-Meal Glucose: ${formatMetric(analytics.averageAfterMealGlucose, { suffix: " mg/dL" })}`,
    `Elevated Readings Above ${ELEVATED_GLUCOSE_THRESHOLD}: ${analytics.elevatedCount}`,
    `Highest Glucose: ${formatMetric(analytics.highestGlucose, { suffix: " mg/dL" })}`,
    `Lowest Glucose: ${formatMetric(analytics.lowestGlucose, { suffix: " mg/dL" })}`,
    `Glucose Range: ${formatMetric(analytics.glucoseRange, { suffix: " mg/dL" })}`,
    `7-Day Average Glucose: ${formatMetric(analytics.last7DaysAverage, { suffix: " mg/dL" })}`,
    `Previous 7-Day Average Glucose: ${formatMetric(analytics.previous7DaysAverage, { suffix: " mg/dL" })}`,
    `7-Day Comparison: ${analytics.comparisonLabel}`,
    `Total Entries: ${analytics.totalEntries}`,
    `Average Sleep: ${formatMetric(analytics.averageSleep, { digits: 1, suffix: " hrs" })}`,
    "",
    "Weekly Summary",
    weeklySummary,
  ].join("\n");

  async function handleCopyReport() {
    if (!isClientReady) return;
    await navigator.clipboard.writeText(reportText);
    setCopyMessage("Report copied to clipboard.");
  }

  function submitQuestion(nextQuestion: string) {
    const trimmedQuestion = nextQuestion.trim();
    if (!trimmedQuestion || !isClientReady) return;

    const response = answerGlucoseQuestion(trimmedQuestion, entries);

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        text: trimmedQuestion,
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: response,
      },
    ]);
    setQuestion("");
  }

  function handleQuestionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitQuestion(question);
  }

  return (
    <div className="pb-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageHeader
            eyebrow="Report"
            title="Understand your progress in one place"
            subtitle="Review key analytics, supportive insights, and a smarter glucose Q&A panel built from your own entries."
          />
        </div>
        <button
          type="button"
          onClick={handleCopyReport}
          disabled={!isClientReady}
          className="mt-2 rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(14,165,233,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Copy Report
        </button>
      </div>

      {copyMessage ? (
        <p className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {copyMessage}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          label="Average Glucose"
          value={
            isClientReady
              ? formatMetric(analytics.averageGlucose, { suffix: " mg/dL" })
              : "Loading..."
          }
        />
        <SummaryCard
          label="Avg Fasting Glucose"
          value={
            isClientReady
              ? formatMetric(analytics.averageFastingGlucose, {
                  suffix: " mg/dL",
                })
              : "Loading..."
          }
        />
        <SummaryCard
          label="Avg After-Meal"
          value={
            isClientReady
              ? formatMetric(analytics.averageAfterMealGlucose, {
                  suffix: " mg/dL",
                })
              : "Loading..."
          }
        />
        <SummaryCard
          label="Elevated Readings"
          value={isClientReady ? String(analytics.elevatedCount) : "Loading..."}
        />
        <SummaryCard
          label="Total Entries"
          value={isClientReady ? String(analytics.totalEntries) : "Loading..."}
        />
        <SummaryCard
          label="Average Sleep"
          value={
            isClientReady
              ? formatMetric(analytics.averageSleep, {
                  digits: 1,
                  suffix: " hrs",
                })
              : "Loading..."
          }
        />
      </div>

      <Panel className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
              Analytics
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Glucose analytics
            </h2>
          </div>
        </div>
        {isClientReady ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Highest Glucose</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {formatMetric(analytics.highestGlucose, { suffix: " mg/dL" })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Lowest Glucose</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {formatMetric(analytics.lowestGlucose, { suffix: " mg/dL" })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Glucose Range</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {formatMetric(analytics.glucoseRange, { suffix: " mg/dL" })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">7-Day Average</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {formatMetric(analytics.last7DaysAverage, { suffix: " mg/dL" })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Previous 7-Day Average</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {formatMetric(analytics.previous7DaysAverage, {
                  suffix: " mg/dL",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Weekly Comparison</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {analytics.comparisonLabel}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Loading report analytics...</p>
        )}
      </Panel>

      <Panel className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
          Weekly Story
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Weekly summary
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-700">
          {isClientReady ? weeklySummary : "Loading weekly summary..."}
        </p>
      </Panel>

      <Panel className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
          Insight Feed
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Insights
        </h2>
        {isClientReady ? (
          <div className="mt-5 space-y-3">
            {analytics.insights.map((insight, index) => (
              <div
                key={insight}
                className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50/90 to-white px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700/60">
                  Insight {index + 1}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{insight}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Loading insights...</p>
        )}
      </Panel>

      <Panel className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
          Assistant
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Glucose Q&amp;A
        </h2>
        <p className="mt-3 text-base text-slate-600">
          Ask simple questions about your saved entries and recent patterns.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => submitQuestion(suggestion)}
              disabled={!isClientReady}
              className="rounded-full border border-sky-100 bg-sky-50/80 px-4 py-2 text-sm font-medium text-sky-800 transition-colors duration-200 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3 rounded-[26px] border border-sky-100 bg-sky-50/50 p-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[88%] rounded-[22px] bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-3 text-sm leading-6 text-white shadow-[0_16px_32px_rgba(14,165,233,0.22)]"
                  : "max-w-[88%] rounded-[22px] bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-[0_14px_30px_rgba(148,163,184,0.14)]"
              }
            >
              {message.text}
            </div>
          ))}
        </div>

        <form onSubmit={handleQuestionSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about spikes, patterns, or this week..."
            className="flex-1 rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />
          <button
            type="submit"
            disabled={!isClientReady || question.trim().length === 0}
            className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(14,165,233,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Ask
          </button>
        </form>
      </Panel>

      <section className="mt-8">
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
            Reference
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Most recent entries
          </h2>
        </div>
        <Panel className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-sky-50/80 text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em]">
                    Timestamp
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em]">
                    Type
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em]">
                    Glucose
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em]">
                    Sleep
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/80">
                {!isClientReady ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">
                      Loading recent entries...
                    </td>
                  </tr>
                ) : analytics.sortedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">
                      No entries yet. Add your first log from the Log Entry page.
                    </td>
                  </tr>
                ) : (
                  analytics.sortedEntries.slice(0, 8).map((entry) => (
                    <tr
                      key={entry.id}
                      className="bg-white/75 transition-colors duration-200 hover:bg-sky-50/50"
                    >
                      <td className="px-5 py-4 text-sm text-slate-700">
                        {new Date(getEntryTimestamp(entry)).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                          {entry.readingType || "Unspecified"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-900">
                        {entry.glucose ?? "--"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        {entry.sleepHours ?? "--"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>
    </div>
  );
}
