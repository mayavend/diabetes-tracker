// Rule-based Q&A layer for answering natural-language questions without an
// external model. Each answer tries to combine a direct response, evidence from
// saved entries, and a practical next step.
import { computeGlucoseAnalytics } from "@/lib/analytics";
import { Entry } from "@/lib/entries";

type Analytics = ReturnType<typeof computeGlucoseAnalytics>;
type QuestionIntent =
  | "avoid-spike"
  | "spike"
  | "patterns"
  | "comparison"
  | "weekly-focus"
  | "improvement"
  | "general";

const DAY_MS = 24 * 60 * 60 * 1000;

function getEntryTimestamp(entry: Entry) {
  return new Date(entry.timestamp || entry.createdAt).getTime();
}

function formatTimestamp(entry: Entry) {
  return new Date(entry.timestamp || entry.createdAt).toLocaleString();
}

function getRecentEntries(entries: Entry[], days = 7) {
  const cutoff = Date.now() - days * DAY_MS;
  return entries.filter((entry) => getEntryTimestamp(entry) >= cutoff);
}

function getRecentGlucoseEntries(entries: Entry[], days = 7) {
  return getRecentEntries(entries, days).filter(
    (entry): entry is Entry & { glucose: number } => entry.glucose !== null,
  );
}

function getLatestEntryWithGlucose(entries: Entry[]) {
  return (
    entries.find(
      (entry): entry is Entry & { glucose: number } => entry.glucose !== null,
    ) ?? null
  );
}

function summarizeEntryClues(entry: Entry | null) {
  if (!entry) return "";

  const parts: string[] = [];
  if (entry.readingType) parts.push(`${entry.readingType.toLowerCase()} reading`);
  if (entry.mealNote.trim()) parts.push(`meal note "${entry.mealNote.trim()}"`);
  if (entry.exerciseNote.trim()) parts.push(`exercise note "${entry.exerciseNote.trim()}"`);
  if (entry.sleepHours !== null) parts.push(`${entry.sleepHours.toFixed(1)} hours of sleep`);

  if (parts.length === 0) return "";
  return parts.join(", ");
}

function findHighestEntry(entries: Entry[]) {
  const glucoseEntries = entries.filter(
    (entry): entry is Entry & { glucose: number } => entry.glucose !== null,
  );
  if (glucoseEntries.length === 0) return null;
  return glucoseEntries.reduce((highest, entry) =>
    entry.glucose > highest.glucose ? entry : highest,
  );
}

function findLowestEntry(entries: Entry[]) {
  const glucoseEntries = entries.filter(
    (entry): entry is Entry & { glucose: number } => entry.glucose !== null,
  );
  if (glucoseEntries.length === 0) return null;
  return glucoseEntries.reduce((lowest, entry) =>
    entry.glucose < lowest.glucose ? entry : lowest,
  );
}

function detectIntent(question: string): QuestionIntent {
  // Intent matching stays lightweight on purpose. The app is local-only, so
  // exact/near-exact phrase buckets are easier to reason about and test.
  if (
    question.includes("what should i do in the future to avoid a spike") ||
    question.includes("avoid a spike") ||
    question.includes("prevent a spike") ||
    question.includes("avoid spikes in the future")
  ) {
    return "avoid-spike";
  }

  if (
    question.includes("spike") ||
    question.includes("high today") ||
    question.includes("why did") ||
    question.includes("why was")
  ) {
    return "spike";
  }

  if (
    question.includes("pattern") ||
    question.includes("affect") ||
    question.includes("impact") ||
    question.includes("trend")
  ) {
    return "patterns";
  }

  if (
    question.includes("after-meal") ||
    question.includes("after meal") ||
    question.includes("fasting") ||
    question.includes("before meal") ||
    question.includes("compare")
  ) {
    return "comparison";
  }

  if (
    question.includes("this week") ||
    question.includes("focus") ||
    question.includes("attention")
  ) {
    return "weekly-focus";
  }

  if (
    question.includes("change") ||
    question.includes("improve") ||
    question.includes("better") ||
    question.includes("work on")
  ) {
    return "improvement";
  }

  return "general";
}

function composeAnswer(parts: {
  direct: string;
  evidence?: string | null;
  nextStep?: string | null;
  disclaimer?: string | null;
}) {
  return [parts.direct, parts.evidence, parts.nextStep, parts.disclaimer]
    .filter(Boolean)
    .join(" ");
}

function buildGentleSpikeTodayAnswer(analytics: Analytics) {
  // For "today" spike questions, prefer the last 24 hours first and only fall
  // back to the last week if today does not yet have a logged glucose value.
  const todayEntries = getRecentGlucoseEntries(analytics.sortedEntries, 1);
  const recentWeekEntries = getRecentGlucoseEntries(analytics.sortedEntries, 7);
  const spikeEntry =
    findHighestEntry(todayEntries) ??
    findHighestEntry(recentWeekEntries) ??
    getLatestEntryWithGlucose(analytics.sortedEntries);

  if (!spikeEntry) {
    return composeAnswer({
      direct:
        "I do not have enough glucose information to explain today’s spike yet, but we can still look for gentle patterns as you keep logging.",
      nextStep:
        "A helpful next step could be to log the meal, movement, and sleep around the next reading so the pattern is easier to understand.",
    });
  }

  const evidenceParts: string[] = [];
  let direct = `One possible reason for today’s higher reading is the glucose entry of ${spikeEntry.glucose.toFixed(0)} mg/dL on ${formatTimestamp(spikeEntry)}.`;

  if (spikeEntry.mealNote.trim()) {
    direct = `One possible reason for today’s spike is the food logged around your ${spikeEntry.glucose.toFixed(0)} mg/dL reading, especially "${spikeEntry.mealNote.trim()}".`;
    evidenceParts.push(
      "Foods that are sweeter or heavier in refined carbs may have contributed to a higher reading for some people.",
    );
  }

  if (spikeEntry.sleepHours !== null) {
    evidenceParts.push(
      `You also logged ${spikeEntry.sleepHours.toFixed(1)} hours of sleep around that time, which may have contributed as an additional factor.`,
    );
  }

  if (spikeEntry.exerciseNote.trim()) {
    evidenceParts.push(
      `You noted "${spikeEntry.exerciseNote.trim()}" for activity, which is helpful context when looking for patterns.`,
    );
  } else {
    evidenceParts.push(
      "There is not much movement context logged around that reading, so activity is harder to interpret right now.",
    );
  }

  let nextStep =
    "A helpful next step could be to watch whether similar meals lead to the same pattern, and try pairing them with more protein, fiber, or a short walk afterward.";

  if (spikeEntry.exerciseNote.trim()) {
    nextStep =
      "A helpful next step could be to watch whether similar meals lead to the same pattern, and see whether light movement after eating helps smooth out future readings.";
  } else if (!spikeEntry.mealNote.trim()) {
    nextStep =
      "A helpful next step could be to keep logging meals and activity around higher readings so the pattern becomes easier to spot without guessing.";
  }

  return composeAnswer({
    direct,
    evidence: evidenceParts.join(" "),
    nextStep,
  });
}

function buildAvoidSpikeAnswer(analytics: Analytics) {
  const suggestionParts: string[] = [];
  const evidenceParts: string[] = [];

  if (
    analytics.averageAfterMealGlucose !== null &&
    analytics.averageFastingGlucose !== null &&
    analytics.averageAfterMealGlucose > analytics.averageFastingGlucose
  ) {
    evidenceParts.push(
      `In your recorded data, after-meal readings are averaging ${analytics.averageAfterMealGlucose.toFixed(0)} mg/dL compared with ${analytics.averageFastingGlucose.toFixed(0)} mg/dL for fasting readings.`,
    );
    suggestionParts.push(
      "keep an eye on meals that are heavier in sweets or refined carbs and notice whether they lead to similar spikes",
    );
  }

  const mealLinkedEntry = analytics.sortedEntries.find(
    (entry) => entry.glucose !== null && entry.mealNote.trim() !== "",
  );
  if (mealLinkedEntry?.mealNote.trim()) {
    evidenceParts.push(
      `One recent meal note in your log is "${mealLinkedEntry.mealNote.trim()}," which may be worth watching if similar meals tend to be followed by higher readings.`,
    );
  }

  const exerciseEntry = analytics.sortedEntries.find(
    (entry) => entry.exerciseNote.trim() !== "",
  );
  if (exerciseEntry) {
    suggestionParts.push(
      "build in light movement or extra steps after meals when you can",
    );
    evidenceParts.push(
      `You already log activity notes like "${exerciseEntry.exerciseNote.trim()}," so movement is something you can keep using as a pattern to compare.`,
    );
  } else {
    suggestionParts.push(
      "try a short walk or some light movement after meals and see whether it changes the pattern",
    );
  }

  if (analytics.averageSleep !== null && analytics.averageSleep < 7) {
    suggestionParts.push("notice whether lower-sleep days also tend to run higher");
    evidenceParts.push(
      `Your recorded sleep average is ${analytics.averageSleep.toFixed(1)} hours, so sleep may be one possible factor to keep in mind too.`,
    );
  }

  if (suggestionParts.length === 0) {
    suggestionParts.push(
      "focus on meal balance and a little movement after eating",
    );
  }

  return composeAnswer({
    direct:
      "Looking ahead, two helpful things to focus on are movement and meal balance.",
    evidence: evidenceParts.slice(0, 3).join(" "),
    nextStep: `It may help to ${suggestionParts
      .slice(0, 3)
      .join(", and ")}. Small changes are enough to start learning what works best for you.`,
  });
}

function buildSpikeAnswer(analytics: Analytics) {
  const recentDayEntries = getRecentGlucoseEntries(analytics.sortedEntries, 1);
  const recentWeekEntries = getRecentGlucoseEntries(analytics.sortedEntries, 7);
  const spikeEntry =
    findHighestEntry(recentDayEntries) ??
    findHighestEntry(recentWeekEntries) ??
    getLatestEntryWithGlucose(analytics.sortedEntries);

  if (!spikeEntry) {
    return composeAnswer({
      direct:
        "I do not have a glucose reading yet, so I cannot explain a spike directly.",
      nextStep:
        "A few fasting and after-meal readings with meal and exercise notes will make this answer much more specific.",
    });
  }

  const clueText = summarizeEntryClues(spikeEntry);
  const recentAfterMealEntries = recentWeekEntries.filter(
    (entry) => entry.readingType === "After Meal",
  );
  const elevatedAfterMealCount = recentAfterMealEntries.filter(
    (entry) => entry.glucose > 180,
  ).length;

  let direct = `The strongest clue for a recent spike is your ${spikeEntry.glucose.toFixed(0)} mg/dL reading on ${formatTimestamp(spikeEntry)}.`;
  if (spikeEntry.readingType === "After Meal") {
    direct =
      `The strongest clue for a recent spike is an after-meal reading of ${spikeEntry.glucose.toFixed(0)} mg/dL on ${formatTimestamp(spikeEntry)}.`;
  }

  const evidenceParts: string[] = [];
  if (clueText) {
    evidenceParts.push(`Around that reading, I see ${clueText}.`);
  }
  if (elevatedAfterMealCount > 0) {
    evidenceParts.push(
      `You also logged ${elevatedAfterMealCount} elevated after-meal reading${elevatedAfterMealCount === 1 ? "" : "s"} in the last 7 days.`,
    );
  }
  if (
    analytics.averageAfterMealGlucose !== null &&
    analytics.averageFastingGlucose !== null &&
    analytics.averageAfterMealGlucose > analytics.averageFastingGlucose
  ) {
    evidenceParts.push(
      `Your after-meal average is running above your fasting average (${analytics.averageAfterMealGlucose.toFixed(0)} vs ${analytics.averageFastingGlucose.toFixed(0)} mg/dL).`,
    );
  }

  let nextStep =
    "The next thing I would watch is whether spikes keep clustering after similar meals or on lower-sleep days.";
  if (spikeEntry.mealNote.trim()) {
    nextStep = `The next thing I would watch is whether readings rise again after meals like "${spikeEntry.mealNote.trim()}".`;
  } else if (spikeEntry.sleepHours !== null && spikeEntry.sleepHours < 7) {
    nextStep = `The next thing I would watch is whether shorter sleep, like the ${spikeEntry.sleepHours.toFixed(1)} hours logged here, keeps lining up with higher readings.`;
  } else if (spikeEntry.exerciseNote.trim() === "") {
    nextStep =
      "The next thing I would watch is whether adding exercise notes helps show if activity is affecting higher readings.";
  }

  return composeAnswer({
    direct,
    evidence: evidenceParts.join(" "),
    nextStep,
  });
}

function buildPatternAnswer(analytics: Analytics) {
  const recentEntries = getRecentGlucoseEntries(analytics.sortedEntries, 7);
  const recentHigh = findHighestEntry(recentEntries);
  const recentLow = findLowestEntry(recentEntries);
  const evidenceParts: string[] = [];

  let direct =
    "Your clearest pattern right now is that glucose varies meaningfully across your recorded entries.";
  if (
    analytics.averageAfterMealGlucose !== null &&
    analytics.averageFastingGlucose !== null &&
    analytics.averageAfterMealGlucose >= analytics.averageFastingGlucose + 15
  ) {
    direct =
      "Your clearest pattern right now is that after-meal readings are running higher than fasting readings.";
  } else if (analytics.comparison === "improved") {
    direct =
      "Your clearest pattern right now is that the last 7 days look better than the previous 7 days.";
  } else if (analytics.comparison === "worsened") {
    direct =
      "Your clearest pattern right now is that the last 7 days are running higher than the previous 7 days.";
  }

  if (recentHigh && recentLow) {
    evidenceParts.push(
      `In the last 7 days, readings ranged from ${recentLow.glucose.toFixed(0)} to ${recentHigh.glucose.toFixed(0)} mg/dL.`,
    );
  } else if (
    analytics.highestGlucose !== null &&
    analytics.lowestGlucose !== null &&
    analytics.glucoseRange !== null
  ) {
    evidenceParts.push(
      `Across your recorded entries, glucose ranged from ${analytics.lowestGlucose.toFixed(0)} to ${analytics.highestGlucose.toFixed(0)} mg/dL.`,
    );
  }

  if (
    analytics.averageAfterMealGlucose !== null &&
    analytics.averageFastingGlucose !== null
  ) {
    evidenceParts.push(
      `Recorded after-meal readings average ${analytics.averageAfterMealGlucose.toFixed(0)} mg/dL compared with ${analytics.averageFastingGlucose.toFixed(0)} mg/dL for fasting readings.`,
    );
  }

  const sleepInsight = analytics.insights.find((insight) =>
    insight.toLowerCase().includes("sleep average was lower"),
  );
  if (sleepInsight) {
    evidenceParts.push("Sleep also appears to be one of the patterns worth watching.");
  }

  return composeAnswer({
    direct,
    evidence: evidenceParts.slice(0, 3).join(" "),
    nextStep:
      "The best next step is to keep pairing glucose readings with meal, sleep, and exercise notes so the strongest pattern becomes easier to confirm.",
  });
}

function buildComparisonAnswer(analytics: Analytics) {
  if (
    analytics.averageAfterMealGlucose !== null &&
    analytics.averageFastingGlucose !== null
  ) {
    const difference =
      analytics.averageAfterMealGlucose - analytics.averageFastingGlucose;
    const direct =
      difference >= 10
        ? "Yes, your after-meal readings are higher than your fasting readings overall."
        : "Your after-meal and fasting readings are fairly close overall.";

    const evidence = `Across your recorded entries, after-meal readings average ${analytics.averageAfterMealGlucose.toFixed(0)} mg/dL and fasting readings average ${analytics.averageFastingGlucose.toFixed(0)} mg/dL.`;
    const nextStep =
      difference >= 10
        ? "It would be helpful to keep logging meal notes with those after-meal checks so you can see which foods or portions tend to push readings higher."
        : "It would still help to keep logging both reading types so you can see whether that gap stays stable over time.";

    return composeAnswer({ direct, evidence, nextStep });
  }

  if (analytics.averageAfterMealGlucose !== null) {
    return composeAnswer({
      direct:
        "I cannot compare after-meal and fasting readings yet because fasting entries are still limited.",
      evidence: `Your recorded after-meal average is ${analytics.averageAfterMealGlucose.toFixed(0)} mg/dL.`,
      nextStep:
        "Adding a few fasting readings this week would make that comparison much more useful.",
    });
  }

  if (analytics.averageFastingGlucose !== null) {
    return composeAnswer({
      direct:
        "I cannot compare fasting and after-meal readings yet because after-meal entries are still limited.",
      evidence: `Your recorded fasting average is ${analytics.averageFastingGlucose.toFixed(0)} mg/dL.`,
      nextStep:
        "Adding a few after-meal readings this week would make that comparison much more useful.",
    });
  }

  return composeAnswer({
    direct:
      "I do not have enough fasting or after-meal data for a strong comparison yet.",
    nextStep:
      "If you log both types over the next few days, I can compare them in a much more specific way.",
  });
}

function buildWeeklyFocusAnswer(analytics: Analytics) {
  const recentElevatedEntries = getRecentGlucoseEntries(
    analytics.sortedEntries,
    7,
  ).filter((entry) => entry.glucose > 180);
  const latestAfterMeal = analytics.sortedEntries.find(
    (entry) => entry.readingType === "After Meal" && entry.glucose !== null,
  );

  const focusPoints: string[] = [];
  if (analytics.comparison === "worsened") {
    focusPoints.push("your last 7-day average is running above the previous 7 days");
  }
  if (recentElevatedEntries.length > 0) {
    focusPoints.push(
      `${recentElevatedEntries.length} elevated reading${recentElevatedEntries.length === 1 ? "" : "s"} appeared in the last 7 days`,
    );
  }
  if (analytics.averageSleep !== null && analytics.averageSleep < 7) {
    focusPoints.push(`your recorded sleep average is ${analytics.averageSleep.toFixed(1)} hours`);
  }
  if (latestAfterMeal?.mealNote.trim()) {
    focusPoints.push(`your recent after-meal note mentions "${latestAfterMeal.mealNote.trim()}"`);
  }

  const direct =
    focusPoints.length > 0
      ? `This week, I would focus most on ${focusPoints.slice(0, 2).join(" and ")}.`
      : "This week, I would focus on collecting consistent fasting and after-meal readings so the next set of patterns is easier to spot.";

  const evidenceParts: string[] = [];
  if (analytics.last7DaysAverage !== null) {
    evidenceParts.push(
      `Your last 7-day average is ${analytics.last7DaysAverage.toFixed(0)} mg/dL.`,
    );
  }
  if (analytics.previous7DaysAverage !== null) {
    evidenceParts.push(
      `The previous 7-day average was ${analytics.previous7DaysAverage.toFixed(0)} mg/dL.`,
    );
  }
  if (recentElevatedEntries.length > 0) {
    const topRecent = findHighestEntry(recentElevatedEntries);
    if (topRecent) {
      evidenceParts.push(
        `Your highest recent elevated reading was ${topRecent.glucose.toFixed(0)} mg/dL on ${formatTimestamp(topRecent)}.`,
      );
    }
  }

  return composeAnswer({
    direct,
    evidence: evidenceParts.join(" "),
    nextStep:
      "If you keep logging meal, sleep, and exercise notes with this week’s readings, it will be easier to see which factor deserves the most attention.",
  });
}

function buildImprovementAnswer(analytics: Analytics) {
  const suggestionParts: string[] = [];
  const evidenceParts: string[] = [];

  if (
    analytics.averageAfterMealGlucose !== null &&
    analytics.averageFastingGlucose !== null &&
    analytics.averageAfterMealGlucose >= analytics.averageFastingGlucose + 15
  ) {
    suggestionParts.push("watch the meals tied to higher after-meal readings");
    evidenceParts.push(
      `After-meal readings average ${analytics.averageAfterMealGlucose.toFixed(0)} mg/dL compared with ${analytics.averageFastingGlucose.toFixed(0)} mg/dL for fasting readings.`,
    );
  }

  const sweetMealEntry = analytics.sortedEntries.find(
    (entry) =>
      entry.glucose !== null &&
      entry.mealNote.trim() &&
      /sweet|dessert|cake|ice cream|soda|juice|candy|rice|bread|pasta/i.test(
        entry.mealNote,
      ),
  );
  if (sweetMealEntry) {
    suggestionParts.push("notice whether sweeter or heavier meals keep lining up with higher readings");
    evidenceParts.push(
      `One logged meal note tied to a glucose reading is "${sweetMealEntry.mealNote.trim()}".`,
    );
  }

  const lowSleepEntry = analytics.sortedEntries.find(
    (entry) => entry.glucose !== null && entry.sleepHours !== null && entry.sleepHours < 7,
  );
  if (lowSleepEntry) {
    suggestionParts.push("watch whether shorter sleep days tend to run higher");
    evidenceParts.push(
      `You have readings logged alongside shorter sleep, including ${lowSleepEntry.sleepHours.toFixed(1)} hours on ${formatTimestamp(lowSleepEntry)}.`,
    );
  }

  const noExerciseHighEntry = analytics.sortedEntries.find(
    (entry) =>
      entry.glucose !== null &&
      entry.glucose > 180 &&
      entry.exerciseNote.trim() === "",
  );
  if (noExerciseHighEntry) {
    suggestionParts.push("track whether activity or lack of activity is affecting your higher readings");
    evidenceParts.push(
      `At least one elevated reading was logged without an exercise note on ${formatTimestamp(noExerciseHighEntry)}.`,
    );
  }

  if (suggestionParts.length === 0) {
    suggestionParts.push(
      "keep logging consistent fasting and after-meal readings with notes so the next improvement target becomes clearer",
    );
  }

  return composeAnswer({
    direct: `The most useful thing to change first is to ${suggestionParts[0]}.`,
    evidence: evidenceParts.slice(0, 2).join(" "),
    nextStep:
      suggestionParts.length > 1
        ? `After that, also ${suggestionParts.slice(1, 3).join(" and ")}.`
        : "That should give you a clearer signal about what is influencing your numbers.",
    disclaimer:
      "This is pattern feedback from your logs, not a medical recommendation.",
  });
}

function buildGeneralAnswer(analytics: Analytics) {
  const latest = getLatestEntryWithGlucose(analytics.sortedEntries);

  if (!latest) {
    return composeAnswer({
      direct:
        "I can start answering more specific glucose questions once you log a few readings.",
      nextStep:
        "Try adding both fasting and after-meal entries with notes about meals, sleep, and exercise.",
    });
  }

  const evidenceParts: string[] = [
    `Your most recent recorded glucose reading was ${latest.glucose.toFixed(0)} mg/dL on ${formatTimestamp(latest)}.`,
  ];
  if (analytics.insights[0]) {
    evidenceParts.push(analytics.insights[0]);
  }

  return composeAnswer({
    direct:
      "The best summary right now is that your recent logs already show some useful glucose patterns.",
    evidence: evidenceParts.join(" "),
    nextStep:
      "You can ask about spikes, fasting versus after-meal readings, patterns, or what to focus on this week.",
  });
}

export function answerGlucoseQuestion(question: string, entries: Entry[]) {
  const analytics = computeGlucoseAnalytics(entries);
  const normalizedQuestion = question.trim().toLowerCase();

  if (normalizedQuestion.length === 0) {
    return "Ask about spikes, patterns, after-meal versus fasting readings, what to focus on this week, or what changes might help.";
  }

  if (analytics.totalEntries === 0) {
    return composeAnswer({
      direct:
        "I do not have any saved entries yet, so I cannot answer from your personal data yet.",
      nextStep:
        "Once you log a few fasting or after-meal readings, I can give much more specific feedback.",
    });
  }

  const intent = detectIntent(normalizedQuestion);

  // A few exact phrasings get custom responses because they were explicitly
  // tuned for this class project’s desired tone and behavior.
  if (intent === "avoid-spike") return buildAvoidSpikeAnswer(analytics);
  if (
    normalizedQuestion === "why did my glucose levels spike today?" ||
    normalizedQuestion === "why did my glucose spike today?" ||
    normalizedQuestion.includes("glucose levels spike today")
  ) {
    return buildGentleSpikeTodayAnswer(analytics);
  }
  if (intent === "spike") return buildSpikeAnswer(analytics);
  if (intent === "patterns") return buildPatternAnswer(analytics);
  if (intent === "comparison") return buildComparisonAnswer(analytics);
  if (intent === "weekly-focus") return buildWeeklyFocusAnswer(analytics);
  if (intent === "improvement") return buildImprovementAnswer(analytics);
  return buildGeneralAnswer(analytics);
}
