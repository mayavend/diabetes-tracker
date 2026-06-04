import { Entry } from "@/lib/entries";

export const ELEVATED_GLUCOSE_THRESHOLD = 180;
const SIMILAR_CHANGE_THRESHOLD = 5;
const DAY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type TrendComparison = "improved" | "worsened" | "similar" | "not-enough-data";

function getEntryTimestamp(entry: Entry) {
  return new Date(entry.timestamp || entry.createdAt).getTime();
}

function getAverage(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getGlucoseValues(entries: Entry[]) {
  return entries
    .map((entry) => entry.glucose)
    .filter((value): value is number => value !== null);
}

export function formatMetric(
  value: number | null,
  options?: { digits?: number; suffix?: string },
) {
  if (value === null || Number.isNaN(value)) return "--";

  const digits = options?.digits ?? 0;
  const suffix = options?.suffix ?? "";
  return `${value.toFixed(digits)}${suffix}`;
}

export function computeGlucoseAnalytics(entries: Entry[]) {
  const sortedEntries = [...entries].sort(
    (a, b) => getEntryTimestamp(b) - getEntryTimestamp(a),
  );
  const glucoseEntries = sortedEntries.filter(
    (entry): entry is Entry & { glucose: number } => entry.glucose !== null,
  );
  const glucoseValues = getGlucoseValues(glucoseEntries);
  const fastingValues = getGlucoseValues(
    glucoseEntries.filter((entry) => entry.readingType === "Fasting"),
  );
  const afterMealValues = getGlucoseValues(
    glucoseEntries.filter((entry) => entry.readingType === "After Meal"),
  );
  const sleepValues = sortedEntries
    .map((entry) => entry.sleepHours)
    .filter((value): value is number => value !== null);

  const now = Date.now();
  const last7DaysEntries = glucoseEntries.filter(
    (entry) => getEntryTimestamp(entry) >= now - DAY_WINDOW_MS,
  );
  const previous7DaysEntries = glucoseEntries.filter((entry) => {
    const timestamp = getEntryTimestamp(entry);
    return timestamp < now - DAY_WINDOW_MS && timestamp >= now - DAY_WINDOW_MS * 2;
  });

  const last7DaysAverage = getAverage(getGlucoseValues(last7DaysEntries));
  const previous7DaysAverage = getAverage(getGlucoseValues(previous7DaysEntries));
  const averageGlucose = getAverage(glucoseValues);
  const averageFastingGlucose = getAverage(fastingValues);
  const averageAfterMealGlucose = getAverage(afterMealValues);
  const highestGlucose =
    glucoseValues.length > 0 ? Math.max(...glucoseValues) : null;
  const lowestGlucose =
    glucoseValues.length > 0 ? Math.min(...glucoseValues) : null;
  const glucoseRange =
    highestGlucose !== null && lowestGlucose !== null
      ? highestGlucose - lowestGlucose
      : null;
  const averageSleep = getAverage(sleepValues);
  const elevatedCount = glucoseValues.filter(
    (value) => value > ELEVATED_GLUCOSE_THRESHOLD,
  ).length;

  let comparison: TrendComparison = "not-enough-data";
  if (last7DaysAverage !== null && previous7DaysAverage !== null) {
    const difference = last7DaysAverage - previous7DaysAverage;
    if (Math.abs(difference) <= SIMILAR_CHANGE_THRESHOLD) {
      comparison = "similar";
    } else if (difference < 0) {
      comparison = "improved";
    } else {
      comparison = "worsened";
    }
  }

  let comparisonLabel = "Not enough 7-day data";
  if (comparison === "improved") comparisonLabel = "Improved";
  if (comparison === "worsened") comparisonLabel = "Worsened";
  if (comparison === "similar") comparisonLabel = "Stayed Similar";

  return {
    sortedEntries,
    averageGlucose,
    averageFastingGlucose,
    averageAfterMealGlucose,
    highestGlucose,
    lowestGlucose,
    glucoseRange,
    averageSleep,
    elevatedCount,
    totalEntries: sortedEntries.length,
    last7DaysAverage,
    previous7DaysAverage,
    comparison,
    comparisonLabel,
  };
}
