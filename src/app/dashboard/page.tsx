"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlucoseQAPanel } from "@/components/glucose-qa-panel";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SummaryCard } from "@/components/summary-card";
import { computeGlucoseAnalytics, formatMetric } from "@/lib/analytics";
import { useClientEntries } from "@/lib/use-client-entries";

export default function DashboardPage() {
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
    <div className="pb-10">
      <PageHeader
        eyebrow="Dashboard"
        title="Your glucose story at a glance"
        subtitle="A calm, clear view of today’s patterns, recent trends, and the entries that are shaping them."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.25fr]">
        <Panel>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
                Snapshot
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Glucose overview
              </h2>
            </div>
            <div className="rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
              {isClientReady ? analytics.comparisonLabel : "Loading..."}
            </div>
          </div>

          {isClientReady ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-sky-50/80 p-4">
                <p className="text-sm font-medium text-slate-500">
                  After-Meal Average
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {formatMetric(analytics.averageAfterMealGlucose, {
                    suffix: " mg/dL",
                  })}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">Glucose Range</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {formatMetric(analytics.glucoseRange, { suffix: " mg/dL" })}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">
                  Highest / Lowest
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {formatMetric(analytics.highestGlucose, { suffix: " mg/dL" })} /{" "}
                  {formatMetric(analytics.lowestGlucose, { suffix: " mg/dL" })}
                </p>
              </div>
              <div className="rounded-2xl bg-cyan-50/80 p-4">
                <p className="text-sm font-medium text-slate-500">
                  Previous 7-Day Avg
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {formatMetric(analytics.previous7DaysAverage, {
                    suffix: " mg/dL",
                  })}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">Loading glucose snapshot...</p>
          )}
        </Panel>

        <div className="grid gap-6">
          <Panel>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
              Insights
            </p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                  What stands out right now
                </h2>
                <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
                  A larger, clearer read on the habits and signals your recent entries are surfacing.
                </p>
              </div>
              <div className="rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
                Key Feature
              </div>
            </div>
            {isClientReady ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {analytics.insights.map((insight, index) => (
                  <div
                    key={insight}
                    className="rounded-[24px] border border-sky-100 bg-gradient-to-br from-sky-50/95 via-white to-cyan-50/70 px-5 py-5 shadow-[0_16px_34px_rgba(148,163,184,0.08)]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700/60">
                      Insight {index + 1}
                    </p>
                    <p className="mt-3 text-base leading-7 text-slate-700">{insight}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-slate-500">Loading personalized insights...</p>
            )}
          </Panel>

          <Panel>
            <GlucoseQAPanel />
          </Panel>
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
              History
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Recent entries
            </h2>
          </div>
        </div>

        {tableMessage ? (
          <p className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {tableMessage}
          </p>
        ) : null}

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
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em]">
                    Meal
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em]">
                    Exercise
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em]">
                    Medication
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/80">
                {!isClientReady ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-sm text-slate-500">
                      Loading recent entries...
                    </td>
                  </tr>
                ) : analytics.sortedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-sm text-slate-500">
                      No entries yet. Add your first log from the Log Entry page.
                    </td>
                  </tr>
                ) : (
                  analytics.sortedEntries.slice(0, 8).map((entry) => (
                    <tr
                      key={entry.id}
                      className="bg-white/70 transition-colors duration-200 hover:bg-sky-50/50"
                    >
                      <td className="px-5 py-4 text-sm text-slate-700">
                        {new Date(entry.timestamp || entry.createdAt).toLocaleString()}
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
                      <td className="max-w-[240px] px-5 py-4 text-sm text-slate-700">
                        {entry.mealNote || "--"}
                      </td>
                      <td className="max-w-[220px] px-5 py-4 text-sm text-slate-700">
                        {entry.exerciseNote || "--"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        {entry.medication || "--"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(entry)}
                            className="rounded-full bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 transition-colors duration-200 hover:bg-sky-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            className="rounded-full bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 transition-colors duration-200 hover:bg-rose-100"
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
        </Panel>
      </section>
    </div>
  );
}
