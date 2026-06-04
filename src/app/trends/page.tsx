"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Entry } from "@/lib/entries";
import { useClientEntries } from "@/lib/use-client-entries";

const CHART_WIDTH = 860;
const CHART_HEIGHT = 340;
const MARGINS = {
  top: 28,
  right: 26,
  bottom: 78,
  left: 64,
};

type ChartPoint = {
  formattedDate: string;
  formattedTimestamp: string;
  glucose: number;
  id: string;
  readingType: string;
  x: number;
  y: number;
};

function formatShortDate(timestamp: string) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatFullTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getYTicks(minValue: number, maxValue: number) {
  const roundedMin = Math.floor(minValue / 10) * 10;
  const roundedMax = Math.ceil(maxValue / 10) * 10;
  const paddedMin = Math.max(40, roundedMin - 10);
  const paddedMax = roundedMax + 10;
  const range = paddedMax - paddedMin;

  let step = 20;
  if (range > 120) step = 40;
  if (range <= 60) step = 10;

  const ticks: number[] = [];
  for (let value = paddedMin; value <= paddedMax; value += step) {
    ticks.push(value);
  }

  return ticks;
}

function getVisibleXAxisIndexes(totalPoints: number) {
  if (totalPoints <= 6) {
    return Array.from({ length: totalPoints }, (_, index) => index);
  }

  const desiredLabelCount = 6;
  const step = Math.ceil((totalPoints - 1) / (desiredLabelCount - 1));
  const indexes = new Set<number>([0, totalPoints - 1]);

  for (let index = step; index < totalPoints - 1; index += step) {
    indexes.add(index);
  }

  return Array.from(indexes).sort((a, b) => a - b);
}

function getReadingTypeColor(readingType: string) {
  if (readingType === "Fasting") return "#2563eb";
  if (readingType === "Before Meal") return "#0891b2";
  if (readingType === "After Meal") return "#0ea5e9";
  if (readingType === "Bedtime") return "#7c3aed";
  return "#64748b";
}

export default function TrendsPage() {
  const { entries, isClientReady } = useClientEntries();
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);

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

  const chartData = useMemo(() => {
    if (glucoseEntries.length === 0) {
      return {
        chartPoints: [] as ChartPoint[],
        chartPath: "",
        visibleXAxisIndexes: [] as number[],
        yTicks: [] as number[],
      };
    }

    const chartLeft = MARGINS.left;
    const chartRight = CHART_WIDTH - MARGINS.right;
    const chartTop = MARGINS.top;
    const chartBottom = CHART_HEIGHT - MARGINS.bottom;
    const chartInnerWidth = chartRight - chartLeft;
    const chartInnerHeight = chartBottom - chartTop;

    const values = glucoseEntries.map((entry) => entry.glucose);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const yTicks = getYTicks(rawMin, rawMax);
    const minTick = yTicks[0];
    const maxTick = yTicks[yTicks.length - 1];
    const tickRange = Math.max(maxTick - minTick, 1);

    const chartPoints = glucoseEntries.map((entry, index) => {
      const x =
        chartLeft +
        (index * chartInnerWidth) / Math.max(glucoseEntries.length - 1, 1);
      const y =
        chartBottom -
        ((entry.glucose - minTick) / tickRange) * chartInnerHeight;

      return {
        formattedDate: formatShortDate(entry.timestamp || entry.createdAt),
        formattedTimestamp: formatFullTimestamp(entry.timestamp || entry.createdAt),
        glucose: entry.glucose,
        id: entry.id,
        readingType: entry.readingType || "Unspecified",
        x,
        y,
      };
    });

    const chartPath = chartPoints
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");

    const visibleXAxisIndexes = getVisibleXAxisIndexes(chartPoints.length);

    return {
      chartPoints,
      chartPath,
      visibleXAxisIndexes,
      yTicks,
    };
  }, [glucoseEntries]);

  const hoveredPoint =
    chartData.chartPoints.find((point) => point.id === hoveredPointId) ?? null;

  return (
    <div className="pb-10">
      <PageHeader
        eyebrow="Trends"
        title="See your glucose patterns unfold"
        subtitle="Track how readings move over time and review the history behind every point."
      />

      {!isClientReady ? (
        <Panel className="text-slate-600">Loading glucose trends...</Panel>
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
                className="h-[25rem] w-full min-w-[720px]"
                role="img"
                aria-label="Line chart of glucose values over time with labeled axes"
              >
                <defs>
                  <linearGradient id="glucoseLine" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>

                {chartData.yTicks.map((tick) => {
                  const chartTop = MARGINS.top;
                  const chartBottom = CHART_HEIGHT - MARGINS.bottom;
                  const minTick = chartData.yTicks[0];
                  const maxTick = chartData.yTicks[chartData.yTicks.length - 1];
                  const y =
                    chartBottom -
                    ((tick - minTick) / Math.max(maxTick - minTick, 1)) *
                      (chartBottom - chartTop);

                  return (
                    <g key={tick}>
                      <line
                        x1={MARGINS.left}
                        y1={y}
                        x2={CHART_WIDTH - MARGINS.right}
                        y2={y}
                        stroke="#dbeafe"
                        strokeDasharray="4 6"
                      />
                      <text
                        x={MARGINS.left - 12}
                        y={y + 5}
                        textAnchor="end"
                        className="fill-slate-500 text-[12px]"
                      >
                        {tick}
                      </text>
                    </g>
                  );
                })}

                <line
                  x1={MARGINS.left}
                  y1={MARGINS.top}
                  x2={MARGINS.left}
                  y2={CHART_HEIGHT - MARGINS.bottom}
                  stroke="#cbd5e1"
                />
                <line
                  x1={MARGINS.left}
                  y1={CHART_HEIGHT - MARGINS.bottom}
                  x2={CHART_WIDTH - MARGINS.right}
                  y2={CHART_HEIGHT - MARGINS.bottom}
                  stroke="#cbd5e1"
                />

                <path
                  d={chartData.chartPath}
                  fill="none"
                  stroke="url(#glucoseLine)"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {chartData.chartPoints.map((point) => (
                  <g
                    key={point.id}
                    onMouseEnter={() => setHoveredPointId(point.id)}
                    onMouseLeave={() => setHoveredPointId((current) =>
                      current === point.id ? null : current,
                    )}
                  >
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={hoveredPointId === point.id ? 7 : 5}
                      fill="white"
                      stroke={getReadingTypeColor(point.readingType)}
                      strokeWidth={hoveredPointId === point.id ? 4 : 3}
                    />
                    <title>
                      {point.formattedTimestamp} ({point.readingType}): {point.glucose} mg/dL
                    </title>
                  </g>
                ))}

                {chartData.visibleXAxisIndexes.map((index) => {
                  const point = chartData.chartPoints[index];
                  return (
                    <text
                      key={`${point.id}-label`}
                      x={point.x}
                      y={CHART_HEIGHT - MARGINS.bottom + 24}
                      textAnchor="end"
                      transform={`rotate(-28 ${point.x} ${CHART_HEIGHT - MARGINS.bottom + 24})`}
                      className="fill-slate-500 text-[12px]"
                    >
                      {point.formattedDate}
                    </text>
                  );
                })}

                <text
                  x={(MARGINS.left + CHART_WIDTH - MARGINS.right) / 2}
                  y={CHART_HEIGHT - 12}
                  textAnchor="middle"
                  className="fill-slate-600 text-[13px] font-medium"
                >
                  Date
                </text>

                <text
                  x={18}
                  y={CHART_HEIGHT / 2}
                  textAnchor="middle"
                  transform={`rotate(-90 18 ${CHART_HEIGHT / 2})`}
                  className="fill-slate-600 text-[13px] font-medium"
                >
                  Glucose (mg/dL)
                </text>
              </svg>
            </div>

            {hoveredPoint ? (
              <div className="mt-5 rounded-[22px] border border-sky-100 bg-sky-50/70 px-5 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {hoveredPoint.glucose} mg/dL
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {hoveredPoint.formattedTimestamp}
                    </p>
                  </div>
                  <span
                    className="inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: `${getReadingTypeColor(hoveredPoint.readingType)}18`,
                      color: getReadingTypeColor(hoveredPoint.readingType),
                    }}
                  >
                    {hoveredPoint.readingType}
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-500">
                Hover over a point to see the full timestamp, reading type, and glucose value.
              </p>
            )}
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
