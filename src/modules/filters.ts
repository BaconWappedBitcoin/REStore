/**
 * filteReddit port: hides posts matching subreddit/domain/keyword/user/score
 * filters. Runs on every feed scan so infinite-scroll arrivals are covered.
 */

import { onFeedScan, extractMeta, type PostMeta } from './feed';
import { getFilterSettings, parseFilters, type ParsedFilters } from './settings';

const HIDDEN_CLASS = 'restore-filtered';

export function matchesFilters(m: PostMeta, f: ParsedFilters): string | null {
  if (f.subreddits.length && m.subreddit && f.subreddits.includes(m.subreddit)) {
    return `subreddit:${m.subreddit}`;
  }
  if (f.users.length && m.author && f.users.includes(m.author)) {
    return `user:${m.author}`;
  }
  if (f.domains.length && m.domain && f.domains.includes(m.domain)) {
    return `domain:${m.domain}`;
  }
  if (f.keywords.length) {
    const t = m.title.toLowerCase();
    const kw = f.keywords.find((k) => t.includes(k));
    if (kw) return `keyword:${kw}`;
  }
  if (Number.isFinite(m.score) && m.score < f.minScore) return `score:${m.score}`;
  return null;
}

let lastCounts = { hidden: 0, total: 0 };
let unsubscribe: (() => void) | null = null;

export function initFilters(enabled: boolean): void {
  unsubscribe?.();
  unsubscribe = null;
  for (const el of document.querySelectorAll('.' + HIDDEN_CLASS)) {
    el.classList.remove(HIDDEN_CLASS);
  }
  if (!enabled) {
    lastCounts = { hidden: 0, total: 0 };
    return;
  }

  void getFilterSettings().then((raw) => {
    const f = parseFilters(raw);
    unsubscribe = onFeedScan((articles) => {
      let hidden = 0;
      for (const a of articles) {
        const reason = matchesFilters(extractMeta(a), f);
        a.classList.toggle(HIDDEN_CLASS, reason !== null);
        if (reason) {
          hidden++;
          if (import.meta.env.DEV) a.setAttribute('data-restore-filter-reason', reason);
        }
      }
      lastCounts = { hidden, total: articles.length };
      if (import.meta.env.DEV && hidden) {
        console.info(`[REStore] filters hid ${hidden}/${articles.length} posts`);
      }
    });
  });
}
