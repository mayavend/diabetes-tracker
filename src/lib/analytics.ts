import { Entry } from "@/lib/entries";

export const ELEVATED_GLUCOSE_THRESHOLD = 180;
const SIMILAR_CHANGE_THRESHOLD = 5;
const DAY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_FASTING_ENTRIES = 2;
const MIN_AFTER_MEAL_ENTRIES = 2;
const HIGH_GLUCOSE_THRESHOLD = 160;

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

  const highGlucoseSleepValues = sortedEntries
    .filter(
      (entry): entry is Entry & { glucose: number; sleepHours: number } =>
        entry.glucose !== null &&
        entry.sleepHours !== null &&
        entry.glucose >= HIGH_GLUCOSE_THRESHOLD,
    )
    .map((entry) => entry.sleepHours);
  const lowerGlucoseSleepValues = sortedEntries
    .filter(
      (entry): entry is Entry & { glucose: number; sleepHours: number } =>
        entry.glucose !== null &&
        entry.sleepHours !== null &&
        entry.glucose < HIGH_GLUCOSE_THRESHOLD,
    )
    .map((entry) => entry.sleepHours);
  const highGlucoseSleepAverage = getAverage(highGlucoseSleepValues);
  const lowerGlucoseSleepAverage = getAverage(lowerGlucoseSleepValues);

  const insights: string[] = [];

  if (comparison === "improved" && last7DaysAverage !== null && previous7DaysAverage !== null) {
    insights.push(
      `Your average glucose over the last 7 days was lower than the previous 7 days (${last7DaysAverage.toFixed(0)} vs ${previous7DaysAverage.toFixed(0)} mg/dL).`,
    );
  } else if (
    comparison === "worsened" &&
    last7DaysAverage !== null &&
    previous7DaysAverage !== null
  ) {
    insights.push(
      `Your average glucose over the last 7 days was higher than the previous 7 days (${last7DaysAverage.toFixed(0)} vs ${previous7DaysAverage.toFixed(0)} mg/dL).`,
    );
  } else if (
    comparison === "similar" &&
    last7DaysAverage !== null &&
    previous7DaysAverage !== null
  ) {
    insights.push(
      `Your average glucose over the last 7 days was similar to the previous 7 days (${last7DaysAverage.toFixed(0)} vs ${previous7DaysAverage.toFixed(0)} mg/dL).`,
    );
  } else {
    insights.push(
      "There is not enough 7-day glucose history yet to compare this week with the previous week.",
    );
  }

  const elevatedAfterMealCount = glucoseEntries.filter(
    (entry) =>
      entry.readingType === "After Meal" && entry.glucose > ELEVATED_GLUCOSE_THRESHOLD,
  ).length;

  if (elevatedAfterMealCount >= 2) {
    insights.push(
      `You logged ${elevatedAfterMealCount} elevated readings after meals, which may be worth watching around food timing or meal composition.`,
    );
  } else if (afterMealValues.length >= MIN_AFTER_MEAL_ENTRIES) {
    insights.push(
      `Your after-meal average was ${averageAfterMealGlucose?.toFixed(0)} mg/dL based on ${afterMealValues.length} readings.`,
    );
  } else {
    insights.push(
      "Your after-meal average could not yet be interpreted confidently because there are not enough after-meal entries.",
    );
  }

  if (fastingValues.length >= MIN_FASTING_ENTRIES) {
    insights.push(
      `Your fasting average is ${averageFastingGlucose?.toFixed(0)} mg/dL based on ${fastingValues.length} fasting entries.`,
    );
  } else {
    insights.push(
      "Your fasting average could not yet be calculated because there are not enough fasting entries.",
    );
  }

  if (
    highGlucoseSleepAverage !== null &&
    lowerGlucoseSleepAverage !== null &&
    highGlucoseSleepValues.length >= 2 &&
    lowerGlucoseSleepValues.length >= 2
  ) {
    if (highGlucoseSleepAverage + 0.5 < lowerGlucoseSleepAverage) {
      insights.push(
        `Your recent sleep average was lower on days with higher glucose readings (${highGlucoseSleepAverage.toFixed(1)} vs ${lowerGlucoseSleepAverage.toFixed(1)} hours).`,
      );
    } else if (highGlucoseSleepAverage - 0.5 > lowerGlucoseSleepAverage) {
      insights.push(
        `Days with higher glucose readings also had slightly more recorded sleep on average (${highGlucoseSleepAverage.toFixed(1)} vs ${lowerGlucoseSleepAverage.toFixed(1)} hours), so the pattern is not straightforward.`,
      );
    } else {
      insights.push(
        "Sleep duration looked fairly similar on days with higher and lower glucose readings.",
      );
    }
  } else {
    insights.push(
      "There is not enough combined sleep and glucose data yet to describe a sleep-related pattern.",
    );
  }

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
    insights,
  };
}
