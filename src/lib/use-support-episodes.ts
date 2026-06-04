"use client";

import { useSupportEpisodesContext } from "@/components/support-episodes-provider";

export function useSupportEpisodes() {
  return useSupportEpisodesContext();
}
