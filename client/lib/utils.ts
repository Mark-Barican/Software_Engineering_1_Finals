import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const RECENT_SEARCHES_KEY = "recentSearches";

export function saveRecentSearch(query: string) {
  if (!query.trim()) return;
  let recent = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  recent = recent.filter((q: string) => q.toLowerCase() !== query.toLowerCase());
  recent.unshift(query);
  if (recent.length > 10) recent = recent.slice(0, 10);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
