"use client";

import { useMemo, useState } from "react";
import { SummaryCard } from "@/components/summary-card";
import { Entry, getEntries } from "@/lib/entries";

export default function Home() {
  const [entries] = useState<Entry[]>(() => getEntries());

  const summary = useMemo(() => {
    const glucoseValues = entries
      .map((entry) => entry.glucose)
      .filter((value): value is number => value !== null);
    const sleepValues = entries
      .map((entry) => entry.sleepHours)
      .filter((value): value is number => value !== null);

    const avgGlucose =
      glucoseValues.length > 0
        ? `${Math.round(
            glucoseValues.reduce((sum, value) => sum + value, 0) /
              glucoseValues.length,
          )} mg/dL`
        : "--";

    const avgSleep =
      sleepValues.length > 0
        ? `${(
            sleepValues.reduce((sum, value) => sum + value, 0) / sleepValues.length
          ).toFixed(1)} hrs`
        : "--";

    return [
      { label: "Avg Glucose", value: avgGlucose },
      { label: "Total Entries", value: String(entries.length) },
      { label: "Sleep Avg", value: avgSleep },
    ];
  }, [entries]);

  return (
    <div>
      <h2 className="mb-5 text-2xl font-semibold">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {summary.map((item) => (
          <SummaryCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      <section className="mt-8">
        <h3 className="mb-3 text-lg font-semibold">Recent Entries</h3>
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
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                    No entries yet. Add your first log from the Log Entry page.
                  </td>
                </tr>
              ) : (
                entries.slice(0, 8).map((entry) => (
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
