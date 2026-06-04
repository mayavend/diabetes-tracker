"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Entry } from "@/lib/entries";
import { useClientEntries } from "@/lib/use-client-entries";

const CHART_WIDTH = 760;
const CHART_HEIGHT = 240;
const PADDING = 24;

export default function TrendsPage() {
  const { entries, isClientReady } = useClientEntries();

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
    <div className="pb-10">
      <PageHeader
        eyebrow="Trends"
        title="See your glucose patterns unfold"
        subtitle="Track how readings move over time and review the history behind every point."
      />

      {!isClientReady ? (
        <Panel className="text-slate-600">
          Loading glucose trends...
        </Panel>
      ) : glucoseEntries.length === 0 ? (
        <Panel className="text-slate-600">
          No glucose data yet. Add entries from the Log Entry page to see trends.
        </Panel>
      ) : (
        <>
          <Panel>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
                  Chart
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Glucose over time
                </h2>
              </div>
              <div className="rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
                {glucoseEntries.length} readings
              </div>
            </div>
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                className="h-72 w-full min-w-[640px]"
                role="img"
                aria-label="Line chart of glucose values over time"
              >
                <defs>
                  <linearGradient id="glucoseLine" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
                <line
                  x1={PADDING}
                  y1={CHART_HEIGHT - PADDING}
                  x2={CHART_WIDTH - PADDING}
                  y2={CHART_HEIGHT - PADDING}
                  className="stroke-sky-100"
                />
                <line
                  x1={PADDING}
                  y1={PADDING}
                  x2={PADDING}
                  y2={CHART_HEIGHT - PADDING}
                  className="stroke-sky-100"
                />
                <path
                  d={chartPath}
                  fill="none"
                  stroke="url(#glucoseLine)"
                  strokeWidth={4}
                  strokeLinecap="round"
                />
                {chartPoints.map((point) => (
                  <g key={point.id}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={5}
                      className="fill-white stroke-sky-500"
                      strokeWidth={3}
                    />
                    <title>
                      {new Date(point.date).toLocaleString()} ({point.type}):{" "}
                      {point.value} mg/dL
                    </title>
                  </g>
                ))}
              </svg>
            </div>
          </Panel>

          <section className="mt-6">
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
                History
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Glucose history
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
                        Glucose (mg/dL)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-100/80">
                    {[...glucoseEntries].reverse().map((entry) => (
                      <tr
                        key={entry.id}
                        className="bg-white/75 transition-colors duration-200 hover:bg-sky-50/50"
                      >
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {new Date(
                            entry.timestamp || entry.createdAt,
                          ).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                            {entry.readingType || "Unspecified"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-900">
                          {entry.glucose}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </section>
        </>
      )}
    </div>
  );
}
