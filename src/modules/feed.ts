/**
 * Shared feed layer: finds post articles and watches for new ones.
 * shreddit infinite-scrolls by appending <article> elements to <shreddit-feed>,
 * so every feed-aware module subscribes to this one observer.
 */

export interface PostMeta {
  id: string;
  element: HTMLElement;
  subreddit: string; // lowercase, no /r/ prefix; '' if unknown
  author: string; // lowercase; '' if unknown
  title: string;
  domain: string; // lowercase hostname of the outbound link; '' for selfposts
  score: number; // NaN if unknown
  permalink: string; // in-site comments URL if found
  linkUrl: string; // outbound or permalink URL for Enter key
  nsfw: boolean;
}

const ARTICLE_SELECTOR = 'shreddit-feed article[data-post-id], article[data-post-id]';

export function getArticles(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(ARTICLE_SELECTOR)];
}

export function extractMeta(article: HTMLElement): PostMeta {
  // shreddit renders the <shreddit-post> custom element around/inside the
  // article; attribute metadata lives on whichever carries it.
  const holder =
    (article.closest('shreddit-post') as HTMLElement | null) ??
    (article.querySelector('shreddit-post') as HTMLElement | null) ??
    article;

  const id = article.getAttribute('data-post-id') ?? '';
  const scoreAttr = holder.getAttribute('score') ?? article.getAttribute('score') ?? '';

  const subEl = article.querySelector<HTMLAnchorElement>(
    'a[data-testid="subreddit-name"], a[href^="/r/"]',
  );
  let subPath = subEl?.getAttribute('href') ?? '';
  if (/^https?:/i.test(subPath)) {
    try {
      subPath = new URL(subPath).pathname;
    } catch {
      subPath = '';
    }
  }
  const subreddit = (subPath.match(/^\/r\/([^/]+)/)?.[1] ?? '').toLowerCase();

  const titleEl = article.querySelector<HTMLAnchorElement>(
    'a[slot="title"], a[data-testid="post-title"], h1 a',
  );
  const title = titleEl?.textContent?.trim() ?? '';

  let linkUrl = titleEl?.href ?? '';
  let domain = '';
  try {
    if (linkUrl) domain = new URL(linkUrl).hostname.replace(/^www\./, '').toLowerCase();
    if (domain.endsWith('reddit.com')) domain = ''; // selfposts point at reddit
  } catch {
    domain = '';
  }

  const commentsEl = article.querySelector<HTMLAnchorElement>(
    'a[data-testid="post-comments-link"], a[href*="comments"]',
  );
  const permalink =
    holder.getAttribute('permalink') ?? commentsEl?.getAttribute('href') ?? '';

  return {
    id,
    element: article,
    subreddit,
    author: (holder.getAttribute('author') ?? '').toLowerCase(),
    title,
    domain,
    score: scoreAttr === '' ? Number.NaN : Number(scoreAttr),
    permalink,
    linkUrl: linkUrl || permalink,
    nsfw: holder.hasAttribute('nsfw') || article.textContent?.includes('NSFW') === true,
  };
}

type Listener = (articles: HTMLElement[]) => void;
const listeners = new Set<Listener>();
let observer: MutationObserver | null = null;

function notifyNew() {
  const arts = getArticles();
  for (const l of listeners) l(arts);
}

/** Subscribe to (re)scans of the feed: initial call + every mutation batch. */
export function onFeedScan(listener: Listener): () => void {
  listeners.add(listener);
  listener(getArticles());
  if (!observer) {
    observer = new MutationObserver(() => notifyNew());
    const start = () => {
      const target = document.querySelector('shreddit-feed') ?? document.body;
      observer!.observe(target, { childList: true, subtree: true });
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  }
  return () => listeners.delete(listener);
}

/** True when a keyboard target (input, editor) has focus. */
export function isTyping(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLElement && el.isContentEditable)
  );
}
