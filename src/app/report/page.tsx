"use client";

import { useState } from "react";
import { SummaryCard } from "@/components/summary-card";
import {
  ELEVATED_GLUCOSE_THRESHOLD,
  computeGlucoseAnalytics,
  formatMetric,
} from "@/lib/analytics";
import { Entry } from "@/lib/entries";
import { useClientEntries } from "@/lib/use-client-entries";

function getEntryTimestamp(entry: Entry) {
  return entry.timestamp || entry.createdAt;
}

export default function ReportPage() {
  const { entries, isClientReady } = useClientEntries();
  const [copyMessage, setCopyMessage] = useState("");
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
          disabled={!isClientReady}
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

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Glucose Analytics</h3>
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
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Weekly Summary</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {isClientReady ? weeklySummary : "Loading weekly summary..."}
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
              {!isClientReady ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    Loading recent entries...
                  </td>
                </tr>
              ) : analytics.sortedEntries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    No entries yet. Add your first log from the Log Entry page.
                  </td>
                </tr>
              ) : (
                analytics.sortedEntries.slice(0, 8).map((entry) => (
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
