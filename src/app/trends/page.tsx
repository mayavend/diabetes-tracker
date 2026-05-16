"use client";

import { useMemo, useState } from "react";
import { Entry, getEntries } from "@/lib/entries";

const CHART_WIDTH = 760;
const CHART_HEIGHT = 240;
const PADDING = 24;

export default function TrendsPage() {
  const [entries] = useState<Entry[]>(() => getEntries());

  const glucoseEntries = useMemo(
    () =>
      entries
        .filter((entry): entry is Entry & { glucose: number } => entry.glucose !== null)
        .sort(
          (a, b) =>
            new Date(a.timestamp || a.createdAt).getTime() -
            new Date(b.timestamp || b.createdAt).getTime(),
        ),
    [entries],
  );

  const chartPoints = useMemo(() => {
    if (glucoseEntries.length === 0) return [];

    const values = glucoseEntries.map((entry) => entry.glucose);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = Math.max(maxValue - minValue, 1);

    return glucoseEntries.map((entry, index) => {
      const x =
        PADDING +
        (index * (CHART_WIDTH - PADDING * 2)) /
          Math.max(glucoseEntries.length - 1, 1);
      const y =
        CHART_HEIGHT -
        PADDING -
        ((entry.glucose - minValue) / valueRange) * (CHART_HEIGHT - PADDING * 2);
      return {
        x,
        y,
        value: entry.glucose,
        date: entry.timestamp || entry.createdAt,
        type: entry.readingType || "--",
        id: entry.id,
      };
    });
  }, [glucoseEntries]);

  const chartPath = chartPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <div>
      <h2 className="mb-5 text-2xl font-semibold">Trends</h2>

      {glucoseEntries.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
          No glucose data yet. Add entries from the Log Entry page to see trends.
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-base font-semibold">Glucose Over Time</h3>
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                className="h-64 w-full min-w-[640px]"
                role="img"
                aria-label="Line chart of glucose values over time"
              >
                <line
                  x1={PADDING}
                  y1={CHART_HEIGHT - PADDING}
                  x2={CHART_WIDTH - PADDING}
                  y2={CHART_HEIGHT - PADDING}
                  className="stroke-slate-300"
                />
                <line
                  x1={PADDING}
                  y1={PADDING}
                  x2={PADDING}
                  y2={CHART_HEIGHT - PADDING}
                  className="stroke-slate-300"
                />
                <path
                  d={chartPath}
                  fill="none"
                  className="stroke-sky-600"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
                {chartPoints.map((point) => (
                  <g key={point.id}>
                    <circle cx={point.x} cy={point.y} r={3.5} className="fill-sky-600" />
                    <title>
                      {new Date(point.date).toLocaleString()} ({point.type}):{" "}
                      {point.value} mg/dL
                    </title>
                  </g>
                ))}
              </svg>
            </div>
          </section>

          <section className="mt-6">
            <h3 className="mb-3 text-lg font-semibold">Glucose History</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Glucose (mg/dL)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...glucoseEntries].reverse().map((entry) => (
                    <tr key={entry.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-700">
                        {new Date(
                          entry.timestamp || entry.createdAt,
                        ).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {entry.readingType || "--"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{entry.glucose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
