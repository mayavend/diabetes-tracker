import { Entry } from "@/lib/entries";

export const ELEVATED_GLUCOSE_THRESHOLD = 180;
const SIMILAR_CHANGE_THRESHOLD = 5;
const DAY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_FASTING_ENTRIES = 2;
const MIN_AFTER_MEAL_ENTRIES = 2;
const HIGH_GLUCOSE_THRESHOLD = 160;
const MIN_INSIGHTS = 3;
const MAX_INSIGHTS = 5;

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

function getReadingTypeLabel(readingType: Entry["readingType"]) {
  return readingType || "Unspecified";
}

function getMostCommonReadingType(entries: Entry[]) {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const key = getReadingTypeLabel(entry.readingType);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let winner: { label: string; count: number } | null = null;
  for (const [label, count] of counts) {
    if (!winner || count > winner.count) {
      winner = { label, count };
    }
  }

  return winner;
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
  const beforeMealValues = getGlucoseValues(
    glucoseEntries.filter((entry) => entry.readingType === "Before Meal"),
  );
  const averageBeforeMealGlucose = getAverage(beforeMealValues);
  const mostRecentGlucoseEntries = glucoseEntries.slice(0, 3);
  const recentElevatedCount = glucoseEntries.filter(
    (entry) =>
      entry.glucose > ELEVATED_GLUCOSE_THRESHOLD &&
      getEntryTimestamp(entry) >= now - DAY_WINDOW_MS,
  ).length;
  const recentHigh = glucoseEntries[0] ?? null;
  const recentLow = glucoseEntries.length > 1 ? glucoseEntries[glucoseEntries.length - 1] : null;
  const dominantReadingType = getMostCommonReadingType(sortedEntries);

  const primaryInsights: string[] = [];
  const secondaryInsights: string[] = [];

  function pushInsight(target: string[], insight: string) {
    if (!primaryInsights.includes(insight) && !secondaryInsights.includes(insight)) {
      target.push(insight);
    }
  }

  if (glucoseEntries.length === 0) {
    pushInsight(
      primaryInsights,
      "Add a few glucose readings to start seeing personalized insights here.",
    );
  }

  if (comparison === "improved" && last7DaysAverage !== null && previous7DaysAverage !== null) {
    pushInsight(
      primaryInsights,
      `Your average glucose over the last 7 days was lower than the previous 7 days (${last7DaysAverage.toFixed(0)} vs ${previous7DaysAverage.toFixed(0)} mg/dL).`,
    );
  } else if (
    comparison === "worsened" &&
    last7DaysAverage !== null &&
    previous7DaysAverage !== null
  ) {
    pushInsight(
      primaryInsights,
      `Your average glucose over the last 7 days was higher than the previous 7 days (${last7DaysAverage.toFixed(0)} vs ${previous7DaysAverage.toFixed(0)} mg/dL).`,
    );
  } else if (
    comparison === "similar" &&
    last7DaysAverage !== null &&
    previous7DaysAverage !== null
  ) {
    pushInsight(
      primaryInsights,
      `Your average glucose over the last 7 days was similar to the previous 7 days (${last7DaysAverage.toFixed(0)} vs ${previous7DaysAverage.toFixed(0)} mg/dL).`,
    );
  }

  const elevatedAfterMealCount = glucoseEntries.filter(
    (entry) =>
      entry.readingType === "After Meal" && entry.glucose > ELEVATED_GLUCOSE_THRESHOLD,
  ).length;

  if (recentElevatedCount > 0) {
    pushInsight(
      primaryInsights,
      `You logged ${recentElevatedCount} elevated glucose reading${recentElevatedCount === 1 ? "" : "s"} in the last 7 days.`,
    );
  } else if (elevatedCount > 0) {
    pushInsight(
      primaryInsights,
      `You have ${elevatedCount} elevated glucose reading${elevatedCount === 1 ? "" : "s"} recorded overall.`,
    );
  }

  if (elevatedAfterMealCount >= 2) {
    pushInsight(
      primaryInsights,
      `You logged ${elevatedAfterMealCount} elevated readings after meals, which may be worth watching around food timing or meal composition.`,
    );
  } else if (
    afterMealValues.length >= MIN_AFTER_MEAL_ENTRIES &&
    (fastingValues.length >= MIN_FASTING_ENTRIES || beforeMealValues.length >= 2)
  ) {
    const comparisonBaseline =
      averageFastingGlucose !== null ? averageFastingGlucose : averageBeforeMealGlucose;
    const comparisonLabel =
      averageFastingGlucose !== null ? "fasting" : "before-meal";

    if (
      averageAfterMealGlucose !== null &&
      comparisonBaseline !== null &&
      averageAfterMealGlucose >= comparisonBaseline + 15
    ) {
      pushInsight(
        primaryInsights,
        `Your after-meal readings are running higher than your ${comparisonLabel} readings on average (${averageAfterMealGlucose.toFixed(0)} vs ${comparisonBaseline.toFixed(0)} mg/dL).`,
      );
    } else if (
      averageAfterMealGlucose !== null &&
      comparisonBaseline !== null &&
      averageAfterMealGlucose <= comparisonBaseline + 5
    ) {
      pushInsight(
        primaryInsights,
        `Your after-meal glucose is staying fairly close to your ${comparisonLabel} readings (${averageAfterMealGlucose.toFixed(0)} vs ${comparisonBaseline.toFixed(0)} mg/dL).`,
      );
    }
  } else if (afterMealValues.length >= MIN_AFTER_MEAL_ENTRIES) {
    pushInsight(
      secondaryInsights,
      `Your after-meal average was ${averageAfterMealGlucose?.toFixed(0)} mg/dL based on ${afterMealValues.length} readings.`,
    );
  }

  if (fastingValues.length >= MIN_FASTING_ENTRIES) {
    pushInsight(
      primaryInsights,
      `Your fasting average is ${averageFastingGlucose?.toFixed(0)} mg/dL based on ${fastingValues.length} fasting entries.`,
    );
  }

  if (
    highGlucoseSleepAverage !== null &&
    lowerGlucoseSleepAverage !== null &&
    highGlucoseSleepValues.length >= 2 &&
    lowerGlucoseSleepValues.length >= 2
  ) {
    if (highGlucoseSleepAverage + 0.5 < lowerGlucoseSleepAverage) {
      pushInsight(
        primaryInsights,
        `Your recent sleep average was lower on days with higher glucose readings (${highGlucoseSleepAverage.toFixed(1)} vs ${lowerGlucoseSleepAverage.toFixed(1)} hours).`,
      );
    } else if (highGlucoseSleepAverage - 0.5 > lowerGlucoseSleepAverage) {
      pushInsight(
        secondaryInsights,
        `Days with higher glucose readings also had slightly more recorded sleep on average (${highGlucoseSleepAverage.toFixed(1)} vs ${lowerGlucoseSleepAverage.toFixed(1)} hours), so the pattern is not straightforward.`,
      );
    } else {
      pushInsight(
        secondaryInsights,
        "Sleep duration looked fairly similar on days with higher and lower glucose readings.",
      );
    }
  }

  if (highestGlucose !== null && lowestGlucose !== null && glucoseRange !== null) {
    pushInsight(
      primaryInsights,
      `Your recorded glucose ranged from ${lowestGlucose.toFixed(0)} to ${highestGlucose.toFixed(0)} mg/dL, a spread of ${glucoseRange.toFixed(0)} mg/dL.`,
    );
  }

  if (mostRecentGlucoseEntries.length >= 3) {
    const recentNewest = mostRecentGlucoseEntries[0].glucose;
    const recentOldest = mostRecentGlucoseEntries[2].glucose;

    if (recentNewest <= recentOldest - 15) {
      pushInsight(
        primaryInsights,
        `Your most recent glucose readings are trending lower than your last few earlier entries (${recentOldest.toFixed(0)} down to ${recentNewest.toFixed(0)} mg/dL).`,
      );
    } else if (recentNewest >= recentOldest + 15) {
      pushInsight(
        primaryInsights,
        `Your most recent glucose readings are trending higher than your last few earlier entries (${recentOldest.toFixed(0)} up to ${recentNewest.toFixed(0)} mg/dL).`,
      );
    }
  }

  if (recentHigh && recentLow && recentHigh.id !== recentLow.id) {
    pushInsight(
      secondaryInsights,
      `Your highest recent reading was ${recentHigh.glucose.toFixed(0)} mg/dL, while your lowest recorded reading was ${recentLow.glucose.toFixed(0)} mg/dL.`,
    );
  } else if (recentHigh) {
    pushInsight(
      secondaryInsights,
      `Your most recent glucose reading was ${recentHigh.glucose.toFixed(0)} mg/dL.`,
    );
  }

  if (dominantReadingType && dominantReadingType.count >= 2) {
    pushInsight(
      secondaryInsights,
      `${dominantReadingType.label} is your most common reading type so far, with ${dominantReadingType.count} logged entr${dominantReadingType.count === 1 ? "y" : "ies"}.`,
    );
  }

  if (
    primaryInsights.length < MIN_INSIGHTS &&
    comparison === "not-enough-data" &&
    fastingValues.length < MIN_FASTING_ENTRIES
  ) {
    pushInsight(
      secondaryInsights,
      "Your fasting average could not yet be calculated because there are not enough fasting entries.",
    );
  }

  if (
    primaryInsights.length < MIN_INSIGHTS &&
    afterMealValues.length < MIN_AFTER_MEAL_ENTRIES
  ) {
    pushInsight(
      secondaryInsights,
      "Add a few more after-meal readings to make meal-related patterns easier to spot.",
    );
  }

  const insights = [...primaryInsights, ...secondaryInsights].slice(0, MAX_INSIGHTS);

  if (insights.length === 0) {
    insights.push("Add a few more entries to unlock more detailed glucose insights.");
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
