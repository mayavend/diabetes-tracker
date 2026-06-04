export const SUPPORT_EPISODES_STORAGE_KEY = "diabeates-support-episodes";

export const FEELING_OPTIONS = [
  "anxious",
  "overwhelmed",
  "frustrated",
  "sad",
  "scared",
  "calm",
] as const;

export type FeelingOption = (typeof FEELING_OPTIONS)[number];

export type SupportEpisode = {
  createdAt: string;
  currentGlucose: number | null;
  emotions: FeelingOption[];
  feelsLike: "low" | "high" | "not-sure";
  id: string;
  includeInDoctorReport: boolean;
  notes: string;
  recentFood: string;
  symptoms: string;
  thoughts: string;
};

function toText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toNumberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeFeelings(value: unknown): FeelingOption[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is FeelingOption =>
    FEELING_OPTIONS.includes(item as FeelingOption),
  );
}

function normalizeSupportEpisode(raw: unknown): SupportEpisode | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;

  return {
    createdAt: toText(record.createdAt) || new Date().toISOString(),
    currentGlucose: toNumberOrNull(record.currentGlucose),
    emotions: normalizeFeelings(record.emotions),
    feelsLike:
      record.feelsLike === "low" ||
      record.feelsLike === "high" ||
      record.feelsLike === "not-sure"
        ? record.feelsLike
        : "not-sure",
    id: toText(record.id) || crypto.randomUUID(),
    includeInDoctorReport: record.includeInDoctorReport === true,
    notes: toText(record.notes),
    recentFood: toText(record.recentFood),
    symptoms: toText(record.symptoms),
    thoughts: toText(record.thoughts),
  };
}

export function getSupportEpisodes(): SupportEpisode[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(SUPPORT_EPISODES_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => normalizeSupportEpisode(item))
      .filter((item): item is SupportEpisode => item !== null)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  } catch {
    return [];
  }
}

export function saveSupportEpisode(episode: SupportEpisode) {
  const updated = [episode, ...getSupportEpisodes()];
  window.localStorage.setItem(
    SUPPORT_EPISODES_STORAGE_KEY,
    JSON.stringify(updated),
  );
  return updated;
}
