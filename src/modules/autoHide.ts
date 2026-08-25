/**
 * autoHide port: remembers posts you've opened and hides them from feeds
 * on later visits. IDs live in storage.local (capped).
 */

import { onFeedScan, extractMeta } from './feed';

const SEEN_KEY = 'restore-seen-posts';
const CAP = 5000;
const HIDDEN_CLASS = 'restore-read-hidden';

async function getSeen(): Promise<string[]> {
  const o = (await browser.storage.local.get(SEEN_KEY)) as Record<string, unknown>;
  return Array.isArray(o[SEEN_KEY]) ? (o[SEEN_KEY] as string[]) : [];
}

async function addSeen(id: string): Promise<void> {
  if (!id) return;
  const seen = await getSeen();
  if (seen.includes(id)) return;
  seen.push(id);
  if (seen.length > CAP) seen.splice(0, seen.length - CAP);
  await browser.storage.local.set({ [SEEN_KEY]: seen });
}

/** Records outbound clicks on post titles as "read". */
export function watchReads(): void {
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as HTMLElement | null;
      const link = target?.closest?.('a[slot="title"], a[data-testid="post-title"]');
      if (!link) return;
      const article = link.closest('article[data-post-id]');
      if (article) void addSeen(article.getAttribute('data-post-id') ?? '');
    },
    true,
  );
}

let unsubscribe: (() => void) | null = null;

export function initAutoHide(enabled: boolean): void {
  unsubscribe?.();
  unsubscribe = null;
  for (const el of document.querySelectorAll('.' + HIDDEN_CLASS)) {
    el.classList.remove(HIDDEN_CLASS);
  }
  if (!enabled) return;

  void getSeen().then((seen) => {
    const set = new Set(seen);
    unsubscribe = onFeedScan((articles) => {
      for (const a of articles) {
        const m = extractMeta(a);
        a.classList.toggle(HIDDEN_CLASS, m.id !== '' && set.has(m.id));
      }
    });
  });
}
