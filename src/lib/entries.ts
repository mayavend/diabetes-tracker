export type Entry = {
  id: string;
  createdAt: string;
  glucose: number | null;
  mealNote: string;
  exerciseNote: string;
  sleepHours: number | null;
  medication: string;
  notes: string;
};

export const ENTRIES_STORAGE_KEY = "diabetes-tracker-entries";

export function getEntries(): Entry[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(ENTRIES_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Entry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry: Entry): Entry[] {
  const existing = getEntries();
  const updated = [entry, ...existing];
  window.localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
