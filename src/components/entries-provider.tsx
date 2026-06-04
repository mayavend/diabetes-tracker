"use client";

// Shared client-side store for the main glucose entry history.
// Pages read through this provider so create/edit/delete operations stay in sync
// without each route needing to talk to localStorage directly.
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Entry,
  deleteSavedEntry,
  getEntries,
  saveEntry,
  updateSavedEntry,
} from "@/lib/entries";

type EntriesContextValue = {
  addEntry: (entry: Entry) => void;
  cancelEditingEntry: () => void;
  editingEntry: Entry | null;
  deleteEntry: (entryId: string) => void;
  startEditingEntry: (entry: Entry) => void;
  entries: Entry[];
  isClientReady: boolean;
  updateEntry: (entry: Entry) => void;
};

const EntriesContext = createContext<EntriesContextValue | null>(null);

export function EntriesProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setEntries(getEntries());
      setIsClientReady(true);
    });

    function handleStorageChange(event: StorageEvent) {
      // Keep multiple tabs or routes aligned if localStorage changes elsewhere.
      if (event.key) {
        setEntries(getEntries());
      }
    }

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const value = useMemo<EntriesContextValue>(
    () => ({
      addEntry(entry) {
        setEntries(saveEntry(entry));
      },
      cancelEditingEntry() {
        setEditingEntry(null);
      },
      editingEntry,
      deleteEntry(entryId) {
        setEntries(deleteSavedEntry(entryId));
        setEditingEntry((current) =>
          current?.id === entryId ? null : current,
        );
      },
      startEditingEntry(entry) {
        setEditingEntry(entry);
      },
      entries,
      isClientReady,
      updateEntry(entry) {
        setEntries(updateSavedEntry(entry));
        setEditingEntry(null);
      },
    }),
    [editingEntry, entries, isClientReady],
  );

  return (
    <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>
  );
}

export function useEntriesContext() {
  const context = useContext(EntriesContext);

  if (!context) {
    throw new Error("useEntriesContext must be used within an EntriesProvider.");
  }

  return context;
}
