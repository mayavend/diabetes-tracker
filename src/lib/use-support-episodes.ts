"use client";

// Thin hook for support-note state, parallel to the main entry history hook.
import { useSupportEpisodesContext } from "@/components/support-episodes-provider";

export function useSupportEpisodes() {
  return useSupportEpisodesContext();
}
