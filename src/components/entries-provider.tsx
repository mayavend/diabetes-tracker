"use client";

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
  deleteEntry: (entryId: string) => void;
  entries: Entry[];
  isClientReady: boolean;
  updateEntry: (entry: Entry) => void;
};

const EntriesContext = createContext<EntriesContextValue | null>(null);

export function EntriesProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setEntries(getEntries());
      setIsClientReady(true);
    });

    function handleStorageChange(event: StorageEvent) {
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
      deleteEntry(entryId) {
        setEntries(deleteSavedEntry(entryId));
      },
      entries,
      isClientReady,
      updateEntry(entry) {
        setEntries(updateSavedEntry(entry));
      },
    }),
    [entries, isClientReady],
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
