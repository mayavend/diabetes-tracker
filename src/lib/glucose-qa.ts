import { computeGlucoseAnalytics } from "@/lib/analytics";
import { Entry } from "@/lib/entries";

type Analytics = ReturnType<typeof computeGlucoseAnalytics>;

function getEntryTimestamp(entry: Entry) {
  return new Date(entry.timestamp || entry.createdAt).getTime();
}

function formatTimestamp(entry: Entry) {
  return new Date(entry.timestamp || entry.createdAt).toLocaleString();
}

function getRecentGlucoseEntries(entries: Entry[], days = 7) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return entries.filter(
    (entry): entry is Entry & { glucose: number } =>
      entry.glucose !== null && getEntryTimestamp(entry) >= cutoff,
  );
}

function getLatestEntryWithGlucose(entries: Entry[]) {
  return entries.find((entry): entry is Entry & { glucose: number } => entry.glucose !== null) ?? null;
}

function getEntryContext(entry: Entry | null) {
  if (!entry) return "";

  const details: string[] = [];
  if (entry.readingType) details.push(`${entry.readingType.toLowerCase()} reading`);
  if (entry.mealNote.trim()) details.push(`meal note: ${entry.mealNote.trim()}`);
  if (entry.exerciseNote.trim()) details.push(`exercise note: ${entry.exerciseNote.trim()}`);
  if (entry.sleepHours !== null) details.push(`sleep: ${entry.sleepHours.toFixed(1)} hours`);

  if (details.length === 0) return "";
  return ` Around that entry, ${details.join(", ")}.`;
}

function buildSpikeAnswer(analytics: Analytics) {
  const recentEntries = getRecentGlucoseEntries(analytics.sortedEntries, 1);
  const targetEntry =
    recentEntries.length > 0
      ? recentEntries.reduce((highest, entry) =>
          entry.glucose > highest.glucose ? entry : highest,
        )
      : getLatestEntryWithGlucose(analytics.sortedEntries);

  if (!targetEntry) {
    return "I do not have a glucose reading yet, but your existing sleep and notes will become more useful here once you log a few readings.";
  }

  const recentAfterMeal = recentEntries.filter(
    (entry) => entry.readingType === "After Meal",
  );
  const recentAfterMealHigh =
    recentAfterMeal.length > 0
      ? recentAfterMeal.reduce((highest, entry) =>
          entry.glucose > highest.glucose ? entry : highest,
        )
      : null;

  if (recentAfterMealHigh && recentAfterMealHigh.glucose >= targetEntry.glucose) {
    return `Your clearest recent spike was an after-meal reading of ${recentAfterMealHigh.glucose.toFixed(0)} mg/dL on ${formatTimestamp(recentAfterMealHigh)}.${getEntryContext(recentAfterMealHigh)} This suggests meals may be one of the main things to watch in the short term.`;
  }

  return `Your highest recent glucose reading was ${targetEntry.glucose.toFixed(0)} mg/dL on ${formatTimestamp(targetEntry)}.${getEntryContext(targetEntry)} That is the strongest clue in your current data about what may be driving a spike.`;
}

function buildPatternAnswer(analytics: Analytics) {
  const points: string[] = [];

  if (
    analytics.averageAfterMealGlucose !== null &&
    analytics.averageFastingGlucose !== null &&
    analytics.averageAfterMealGlucose >= analytics.averageFastingGlucose + 15
  ) {
    points.push(
      `after-meal readings are higher than fasting readings on average (${analytics.averageAfterMealGlucose.toFixed(0)} vs ${analytics.averageFastingGlucose.toFixed(0)} mg/dL)`,
    );
  }

  if (analytics.elevatedCount > 0) {
    points.push(
      `${analytics.elevatedCount} elevated reading${analytics.elevatedCount === 1 ? "" : "s"} have been recorded`,
    );
  }

  const sleepLinkedInsight = analytics.insights.find((insight) =>
    insight.toLowerCase().includes("sleep average was lower"),
  );
  if (sleepLinkedInsight) {
    points.push("lower sleep may be showing up alongside higher glucose");
  }

  if (analytics.glucoseRange !== null && analytics.glucoseRange >= 40) {
    points.push(
      `glucose variability is noticeable with a recorded range of ${analytics.glucoseRange.toFixed(0)} mg/dL`,
    );
  }

  if (points.length === 0) {
    const fallback = analytics.insights[0] ?? "your recorded entries are starting to build a pattern";
    return `The clearest pattern so far is that ${fallback.charAt(0).toLowerCase()}${fallback.slice(1)}`;
  }

  return `The main patterns in your recorded data are that ${points.slice(0, 3).join(", ")}.`;
}

function buildComparisonAnswer(analytics: Analytics) {
  if (
    analytics.averageAfterMealGlucose !== null &&
    analytics.averageFastingGlucose !== null
  ) {
    const difference =
      analytics.averageAfterMealGlucose - analytics.averageFastingGlucose;
    if (difference >= 10) {
      return `Yes. Across your recorded entries, after-meal readings are higher than fasting readings on average (${analytics.averageAfterMealGlucose.toFixed(0)} vs ${analytics.averageFastingGlucose.toFixed(0)} mg/dL).`;
    }

    return `They are fairly close in your recorded data: after-meal readings average ${analytics.averageAfterMealGlucose.toFixed(0)} mg/dL and fasting readings average ${analytics.averageFastingGlucose.toFixed(0)} mg/dL.`;
  }

  if (analytics.averageAfterMealGlucose !== null) {
    return `I do not have enough fasting entries for a direct comparison yet, but your recorded after-meal average is ${analytics.averageAfterMealGlucose.toFixed(0)} mg/dL.`;
  }

  if (analytics.averageFastingGlucose !== null) {
    return `I do not have enough after-meal entries for a direct comparison yet, but your recorded fasting average is ${analytics.averageFastingGlucose.toFixed(0)} mg/dL.`;
  }

  return "I do not have enough fasting or after-meal readings for a direct comparison yet, but logging both types this week would make that answer much stronger.";
}

function buildWeeklyFocusAnswer(analytics: Analytics) {
  const focusPoints: string[] = [];

  if (analytics.comparison === "worsened") {
    focusPoints.push("your last 7-day average is running higher than the previous 7 days");
  } else if (analytics.comparison === "improved") {
    focusPoints.push("your last 7-day average has improved, so it may help to keep repeating what worked");
  }

  const recentElevated = getRecentGlucoseEntries(analytics.sortedEntries, 7).filter(
    (entry) => entry.glucose > 180,
  );
  if (recentElevated.length > 0) {
    focusPoints.push(
      `${recentElevated.length} elevated reading${recentElevated.length === 1 ? "" : "s"} showed up in the last 7 days`,
    );
  }

  const latestAfterMeal = analytics.sortedEntries.find(
    (entry) => entry.readingType === "After Meal" && entry.glucose !== null,
  );
  if (latestAfterMeal && latestAfterMeal.mealNote.trim()) {
    focusPoints.push(`your latest after-meal note mentions "${latestAfterMeal.mealNote.trim()}"`);
  }

  if (analytics.averageSleep !== null && analytics.averageSleep < 7) {
    focusPoints.push(`your recorded sleep average is ${analytics.averageSleep.toFixed(1)} hours`);
  }

  if (focusPoints.length === 0) {
    return "This week, pay attention to keeping your readings consistent across fasting and after-meal checks so the app can identify stronger patterns for you.";
  }

  return `This week, I would pay the most attention to ${focusPoints.slice(0, 3).join(", ")}.`;
}

function buildClosestUsefulAnswer(entries: Entry[], analytics: Analytics) {
  const latest = getLatestEntryWithGlucose(analytics.sortedEntries);

  if (latest) {
    return `A useful starting point is your most recent recorded glucose reading of ${latest.glucose.toFixed(0)} mg/dL on ${formatTimestamp(latest)}.${getEntryContext(latest)} ${analytics.insights[0] ?? ""}`.trim();
  }

  if (analytics.averageSleep !== null) {
    return `You do not have a glucose pattern to answer that directly yet, but your recorded sleep average is ${analytics.averageSleep.toFixed(1)} hours and future glucose entries can be compared against it.`;
  }

  return "I do not have enough glucose data for that exact question yet, but if you add a few fasting and after-meal readings I can give much more specific feedback.";
}

export function answerGlucoseQuestion(question: string, entries: Entry[]) {
  const analytics = computeGlucoseAnalytics(entries);
  const normalizedQuestion = question.trim().toLowerCase();

  if (normalizedQuestion.length === 0) {
    return "Ask about spikes, patterns, after-meal versus fasting readings, or what to watch this week.";
  }

  if (analytics.totalEntries === 0) {
    return "I do not have any saved entries yet. Once you log a few readings, I can answer questions about spikes, patterns, and weekly focus areas.";
  }

  if (
    normalizedQuestion.includes("spike") ||
    normalizedQuestion.includes("high") ||
    normalizedQuestion.includes("today")
  ) {
    return buildSpikeAnswer(analytics);
  }

  if (
    normalizedQuestion.includes("pattern") ||
    normalizedQuestion.includes("affect") ||
    normalizedQuestion.includes("impact")
  ) {
    return buildPatternAnswer(analytics);
  }

  if (
    normalizedQuestion.includes("after-meal") ||
    normalizedQuestion.includes("after meal") ||
    normalizedQuestion.includes("fasting") ||
    normalizedQuestion.includes("before meal")
  ) {
    return buildComparisonAnswer(analytics);
  }

  if (
    normalizedQuestion.includes("week") ||
    normalizedQuestion.includes("attention") ||
    normalizedQuestion.includes("focus")
  ) {
    return buildWeeklyFocusAnswer(analytics);
  }

  return buildClosestUsefulAnswer(entries, analytics);
}
