"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SummaryCard } from "@/components/summary-card";
import { computeGlucoseAnalytics, formatMetric } from "@/lib/analytics";
import { useClientEntries } from "@/lib/use-client-entries";

export default function Home() {
  const router = useRouter();
  const { deleteEntry, entries, isClientReady, startEditingEntry } =
    useClientEntries();
  const analytics = computeGlucoseAnalytics(entries);
  const [tableMessage, setTableMessage] = useState("");

  function handleEdit(entry: (typeof analytics.sortedEntries)[number]) {
    startEditingEntry(entry);
    setTableMessage("");
    router.push("/log-entry");
  }

  function handleDelete(entryId: string) {
    const confirmed = window.confirm("Delete this entry?");
    if (!confirmed) return;

    deleteEntry(entryId);
    setTableMessage("Entry deleted.");
  }

  return (
    <div>
      <h2 className="mb-5 text-2xl font-semibold">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Average Glucose"
          value={
            isClientReady
              ? formatMetric(analytics.averageGlucose, { suffix: " mg/dL" })
              : "Loading..."
          }
        />
        <SummaryCard
          label="7-Day Average"
          value={
            isClientReady
              ? formatMetric(analytics.last7DaysAverage, { suffix: " mg/dL" })
              : "Loading..."
          }
        />
        <SummaryCard
          label="Avg Fasting"
          value={
            isClientReady
              ? formatMetric(analytics.averageFastingGlucose, {
                  suffix: " mg/dL",
                })
              : "Loading..."
          }
        />
        <SummaryCard
          label="Elevated Readings"
          value={isClientReady ? String(analytics.elevatedCount) : "Loading..."}
        />
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Glucose Snapshot</h3>
        {isClientReady ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-slate-500">After-Meal Average</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {formatMetric(analytics.averageAfterMealGlucose, {
                  suffix: " mg/dL",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Glucose Range</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {formatMetric(analytics.glucoseRange, { suffix: " mg/dL" })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Highest / Lowest</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {formatMetric(analytics.highestGlucose, { suffix: " mg/dL" })} /{" "}
                {formatMetric(analytics.lowestGlucose, { suffix: " mg/dL" })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">7-Day Trend</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {analytics.comparisonLabel}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Previous:{" "}
                {formatMetric(analytics.previous7DaysAverage, {
                  suffix: " mg/dL",
                })}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Loading glucose insights...</p>
        )}
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Insights</h3>
        {isClientReady ? (
          <div className="mt-4 space-y-3">
            {analytics.insights.map((insight) => (
              <p key={insight} className="text-sm leading-6 text-slate-700">
                {insight}
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Loading insights...</p>
        )}
      </section>

      <section className="mt-8">
        <h3 className="mb-3 text-lg font-semibold">Recent Entries</h3>
        {tableMessage ? (
          <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {tableMessage}
          </p>
        ) : null}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Glucose</th>
                <th className="px-4 py-3 font-medium">Sleep</th>
                <th className="px-4 py-3 font-medium">Meal</th>
                <th className="px-4 py-3 font-medium">Exercise</th>
                <th className="px-4 py-3 font-medium">Medication</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!isClientReady ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    Loading recent entries...
                  </td>
                </tr>
              ) : analytics.sortedEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    No entries yet. Add your first log from the Log Entry page.
                  </td>
                </tr>
              ) : (
                analytics.sortedEntries.slice(0, 8).map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(entry.timestamp || entry.createdAt).toLocaleString()}
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
                    <td className="px-4 py-3 text-slate-700">
                      {entry.mealNote || "--"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {entry.exerciseNote || "--"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {entry.medication || "--"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleEdit(entry)}
                          className="text-sm font-medium text-sky-700 hover:text-sky-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          className="text-sm font-medium text-rose-700 hover:text-rose-800"
                        >
                          Delete
                        </button>
                      </div>
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
