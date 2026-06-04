"use client";

import { useEffect, useState } from "react";
import { Entry, getEntries } from "@/lib/entries";

export function useClientEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setEntries(getEntries());
      setIsClientReady(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  return { entries, isClientReady };
}
