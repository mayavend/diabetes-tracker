"use client";

// Thin hook so page components can depend on a stable entry-store API without
// importing provider internals directly.
import { useEntriesContext } from "@/components/entries-provider";

export function useClientEntries() {
  return useEntriesContext();
}
