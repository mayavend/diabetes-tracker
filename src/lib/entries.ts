export const READING_TYPES = [
  "Fasting",
  "Before Meal",
  "After Meal",
  "Bedtime",
] as const;

export type ReadingType = (typeof READING_TYPES)[number];

export type Entry = {
  id: string;
  createdAt: string;
  timestamp: string;
  readingType: ReadingType | "";
  glucose: number | null;
  mealNote: string;
  exerciseNote: string;
  sleepHours: number | null;
  medication: string;
  notes: string;
};

export const ENTRIES_STORAGE_KEY = "diabetes-tracker-entries";

function isReadingType(value: unknown): value is ReadingType {
  return typeof value === "string" && READING_TYPES.includes(value as ReadingType);
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeEntry(raw: unknown): Entry | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;

  const createdAt = toText(record.createdAt) || new Date().toISOString();
  const timestamp = toText(record.timestamp) || createdAt;
  const id = toText(record.id) || crypto.randomUUID();

  return {
    id,
    createdAt,
    timestamp,
    readingType: isReadingType(record.readingType) ? record.readingType : "",
    glucose: toNumberOrNull(record.glucose),
    mealNote: toText(record.mealNote),
    exerciseNote: toText(record.exerciseNote),
    sleepHours: toNumberOrNull(record.sleepHours),
    medication: toText(record.medication),
    notes: toText(record.notes),
  };
}

export function getEntries(): Entry[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(ENTRIES_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeEntry(item))
      .filter((item): item is Entry => item !== null);
  } catch {
    return [];
  }
}

export function writeEntries(entries: Entry[]) {
  window.localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries));
  return entries;
}

export function saveEntry(entry: Entry): Entry[] {
  const existing = getEntries();
  const updated = [entry, ...existing];
  return writeEntries(updated);
}

export function updateSavedEntry(updatedEntry: Entry): Entry[] {
  const updated = getEntries().map((entry) =>
    entry.id === updatedEntry.id ? updatedEntry : entry,
  );
  return writeEntries(updated);
}

export function deleteSavedEntry(entryId: string): Entry[] {
  const updated = getEntries().filter((entry) => entry.id !== entryId);
  return writeEntries(updated);
}

export function replaceEntries(entries: Entry[]): Entry[] {
  const normalized = entries
    .map((entry) => normalizeEntry(entry))
    .filter((entry): entry is Entry => entry !== null);
  return writeEntries(normalized);
}
