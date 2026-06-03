"use client";

import { useMemo, useState } from "react";
import { SummaryCard } from "@/components/summary-card";
import { Entry, getEntries } from "@/lib/entries";

function formatNumber(value: number | null, suffix = "") {
  if (value === null || Number.isNaN(value)) return "--";
  return `${value}${suffix}`;
}

function formatAverage(value: number | null, digits = 0, suffix = "") {
  if (value === null || Number.isNaN(value)) return "--";
  return `${value.toFixed(digits)}${suffix}`;
}

function getAverage(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getEntryTimestamp(entry: Entry) {
  return entry.timestamp || entry.createdAt;
}

export default function ReportPage() {
  const [entries] = useState<Entry[]>(() => getEntries());
  const [copyMessage, setCopyMessage] = useState("");

  const reportData = useMemo(() => {
    const sortedEntries = [...entries].sort(
      (a, b) =>
        new Date(getEntryTimestamp(b)).getTime() -
        new Date(getEntryTimestamp(a)).getTime(),
    );

    const glucoseEntries = sortedEntries.filter(
      (entry): entry is Entry & { glucose: number } => entry.glucose !== null,
    );
    const glucoseValues = glucoseEntries.map((entry) => entry.glucose);
    const fastingValues = glucoseEntries
      .filter((entry) => entry.readingType === "Fasting")
      .map((entry) => entry.glucose);
    const sleepValues = sortedEntries
      .map((entry) => entry.sleepHours)
      .filter((value): value is number => value !== null);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyEntries = sortedEntries.filter(
      (entry) => new Date(getEntryTimestamp(entry)).getTime() >= weekAgo.getTime(),
    );
    const weeklyGlucoseValues = weeklyEntries
      .map((entry) => entry.glucose)
      .filter((value): value is number => value !== null);
    const weeklySleepValues = weeklyEntries
      .map((entry) => entry.sleepHours)
      .filter((value): value is number => value !== null);

    const averageGlucose = getAverage(glucoseValues);
    const averageFastingGlucose = getAverage(fastingValues);
    const highestGlucose =
      glucoseValues.length > 0 ? Math.max(...glucoseValues) : null;
    const lowestGlucose =
      glucoseValues.length > 0 ? Math.min(...glucoseValues) : null;
    const averageSleep = getAverage(sleepValues);
    const weeklyAverageGlucose = getAverage(weeklyGlucoseValues);
    const weeklyAverageSleep = getAverage(weeklySleepValues);

    let weeklySummary =
      "No entries were logged in the last 7 days, so there is not enough recent data for a weekly summary yet.";

    if (weeklyEntries.length > 0) {
      const glucoseSentence =
        weeklyAverageGlucose === null
          ? "No glucose readings were recorded this week."
          : `Average glucose this week was ${weeklyAverageGlucose.toFixed(0)} mg/dL.`;
      const sleepSentence =
        weeklyAverageSleep === null
          ? "Sleep data was limited this week."
          : `Average sleep was ${weeklyAverageSleep.toFixed(1)} hours.`;
      const fastingSentence =
        fastingValues.length > 0
          ? `Fasting readings averaged ${getAverage(fastingValues)?.toFixed(0)} mg/dL overall.`
          : "No fasting reading pattern is available yet.";

      weeklySummary = `${weeklyEntries.length} entries were logged in the last 7 days. ${glucoseSentence} ${sleepSentence} ${fastingSentence}`;
    }

    const reportText = [
      "Diabetes Tracker Report",
      "",
      `Average Glucose: ${formatAverage(averageGlucose, 0, " mg/dL")}`,
      `Average Fasting Glucose: ${formatAverage(averageFastingGlucose, 0, " mg/dL")}`,
      `Highest Glucose: ${formatNumber(highestGlucose, " mg/dL")}`,
      `Lowest Glucose: ${formatNumber(lowestGlucose, " mg/dL")}`,
      `Total Entries: ${sortedEntries.length}`,
      `Average Sleep: ${formatAverage(averageSleep, 1, " hrs")}`,
      "",
      "Weekly Summary",
      weeklySummary,
    ].join("\n");

    return {
      sortedEntries,
      averageGlucose,
      averageFastingGlucose,
      highestGlucose,
      lowestGlucose,
      averageSleep,
      weeklySummary,
      reportText,
    };
  }, [entries]);

  async function handleCopyReport() {
    await navigator.clipboard.writeText(reportData.reportText);
    setCopyMessage("Report copied to clipboard.");
  }

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Report</h2>
          <p className="mt-1 text-sm text-slate-600">
            A simple summary based on saved local entries.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopyReport}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Copy Report
        </button>
      </div>

      {copyMessage ? (
        <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {copyMessage}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          label="Average Glucose"
          value={formatAverage(reportData.averageGlucose, 0, " mg/dL")}
        />
        <SummaryCard
          label="Avg Fasting Glucose"
          value={formatAverage(reportData.averageFastingGlucose, 0, " mg/dL")}
        />
        <SummaryCard
          label="Highest Glucose"
          value={formatNumber(reportData.highestGlucose, " mg/dL")}
        />
        <SummaryCard
          label="Lowest Glucose"
          value={formatNumber(reportData.lowestGlucose, " mg/dL")}
        />
        <SummaryCard
          label="Total Entries"
          value={String(reportData.sortedEntries.length)}
        />
        <SummaryCard
          label="Average Sleep"
          value={formatAverage(reportData.averageSleep, 1, " hrs")}
        />
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Weekly Summary</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {reportData.weeklySummary}
        </p>
      </section>

      <section className="mt-8">
        <h3 className="mb-3 text-lg font-semibold">Most Recent Entries</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Glucose</th>
                <th className="px-4 py-3 font-medium">Sleep</th>
              </tr>
            </thead>
            <tbody>
              {reportData.sortedEntries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    No entries yet. Add your first log from the Log Entry page.
                  </td>
                </tr>
              ) : (
                reportData.sortedEntries.slice(0, 8).map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(getEntryTimestamp(entry)).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {entry.readingType || "--"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {entry.glucose ?? "--"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {entry.sleepHours ?? "--"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
