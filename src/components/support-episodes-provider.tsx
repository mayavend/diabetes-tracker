"use client";

// Shared client-side store for emotional/support notes. This intentionally stays
// separate from the main entry provider so the support feature can control
// privacy and report inclusion independently.
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  SupportEpisode,
  getSupportEpisodes,
  saveSupportEpisode,
} from "@/lib/support-episodes";

type SupportEpisodesContextValue = {
  addSupportEpisode: (episode: SupportEpisode) => void;
  isClientReady: boolean;
  supportEpisodes: SupportEpisode[];
};

const SupportEpisodesContext =
  createContext<SupportEpisodesContextValue | null>(null);

export function SupportEpisodesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isClientReady, setIsClientReady] = useState(false);
  const [supportEpisodes, setSupportEpisodes] = useState<SupportEpisode[]>([]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setSupportEpisodes(getSupportEpisodes());
      setIsClientReady(true);
    });

    function handleStorageChange(event: StorageEvent) {
      if (event.key) {
        setSupportEpisodes(getSupportEpisodes());
      }
    }

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const value = useMemo<SupportEpisodesContextValue>(
    () => ({
      addSupportEpisode(episode) {
        setSupportEpisodes(saveSupportEpisode(episode));
      },
      isClientReady,
      supportEpisodes,
    }),
    [isClientReady, supportEpisodes],
  );

  return (
    <SupportEpisodesContext.Provider value={value}>
      {children}
    </SupportEpisodesContext.Provider>
  );
}

export function useSupportEpisodesContext() {
  const context = useContext(SupportEpisodesContext);

  if (!context) {
    throw new Error(
      "useSupportEpisodesContext must be used within a SupportEpisodesProvider.",
    );
  }

  return context;
}
