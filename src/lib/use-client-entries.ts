"use client";

import { useEntriesContext } from "@/components/entries-provider";

export function useClientEntries() {
  return useEntriesContext();
}
