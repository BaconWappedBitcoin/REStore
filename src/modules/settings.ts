/**
 * Filter settings (filteReddit port) persisted in storage.sync.
 * Lists are stored as comma/newline-separated strings for easy editing.
 */

export interface FilterSettings {
  blockedSubreddits: string;
  blockedDomains: string;
  blockedKeywords: string;
  blockedUsers: string;
  minScore: string; // '' = off; numeric string
}

export const DEFAULT_FILTERS: FilterSettings = {
  blockedSubreddits: '',
  blockedDomains: '',
  blockedKeywords: '',
  blockedUsers: '',
  minScore: '',
};

function parseList(s: string): string[] {
  return s
    .split(/[,\n]/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

export interface ParsedFilters {
  subreddits: string[];
  domains: string[];
  keywords: string[];
  users: string[];
  minScore: number; // -Infinity = off
}

export function parseFilters(s: FilterSettings): ParsedFilters {
  const n = Number(s.minScore);
  return {
    subreddits: parseList(s.blockedSubreddits),
    domains: parseList(s.blockedDomains),
    keywords: parseList(s.blockedKeywords),
    users: parseList(s.blockedUsers),
    minScore: s.minScore.trim() !== '' && Number.isFinite(n) ? n : -Infinity,
  };
}

export async function getFilterSettings(): Promise<FilterSettings> {
  const stored = (await browser.storage.sync.get(
    DEFAULT_FILTERS as unknown as Record<string, unknown>,
  )) as Partial<FilterSettings>;
  return { ...DEFAULT_FILTERS, ...stored };
}

export async function setFilterSettings(patch: Partial<FilterSettings>): Promise<void> {
  await browser.storage.sync.set(patch);
}
