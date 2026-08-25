/**
 * Phase 2 comment features (RES ports):
 *  - userHighlight:         color the OP's comments (RES blue); own comments orange.
 *  - commentQuickCollapse:  click a comment's left gutter/indent to collapse the thread.
 *  - commentHidePersistor:  remember collapsed threads across visits.
 *
 * shreddit internals used:
 *  - <shreddit-comment author thingid depth> wraps each comment
 *  - collapse is the native <details role="article" open> inside it
 *  - <shreddit-comment-tree post-id> is the SPA container; comments lazy-load
 */

const COLLAPSED_KEY = 'restore-collapsed-comments';
const CAP = 5000;

const OP_CLASS = 'restore-op-comment';
const SELF_CLASS = 'restore-self-comment';

function getComments(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('shreddit-comment')];
}

function detailsOf(comment: HTMLElement): HTMLDetailsElement | null {
  return comment.querySelector(':scope > details[role="article"]');
}

function commentAuthor(comment: HTMLElement): string {
  return (comment.getAttribute('author') ?? '').toLowerCase();
}

function postAuthor(): string {
  return (document.querySelector('shreddit-post')?.getAttribute('author') ?? '').toLowerCase();
}

function myUsername(): string {
  // Best-effort: shreddit exposes the logged-in user on the user-drawer trigger
  const el = document.querySelector('[data-redditstyle-user-drawer-trigger] a[href^="/user/"]');
  const name = el?.getAttribute('href')?.match(/^\/user\/([^/]+)/)?.[1];
  return (name ?? '').toLowerCase();
}

/* ---------------- userHighlight ---------------- */

export function applyUserHighlight(root: HTMLElement): void {
  const op = postAuthor();
  const me = myUsername();
  for (const c of root.matches?.('shreddit-comment') ? [root] : getComments()) {
    const author = commentAuthor(c as HTMLElement);
    (c as HTMLElement).classList.toggle(OP_CLASS, author !== '' && author === op);
    (c as HTMLElement).classList.toggle(SELF_CLASS, author !== '' && author === me);
  }
}

/* ---------------- commentQuickCollapse + persistor ---------------- */

let collapsed = new Set<string>();
let persist = false;

async function loadCollapsed(): Promise<void> {
  const o = (await browser.storage.local.get(COLLAPSED_KEY)) as Record<string, unknown>;
  collapsed = new Set(Array.isArray(o[COLLAPSED_KEY]) ? (o[COLLAPSED_KEY] as string[]) : []);
}

async function saveCollapsed(): Promise<void> {
  if (!persist) return;
  const ids = [...collapsed].slice(-CAP);
  await browser.storage.local.set({ [COLLAPSED_KEY]: ids });
}

function setCollapsed(comment: HTMLElement, collapsedNow: boolean): void {
  const d = detailsOf(comment);
  if (!d) return;
  d.open = !collapsedNow;
  const id = comment.getAttribute('thingid') ?? '';
  if (id) {
    if (collapsedNow) collapsed.add(id);
    else collapsed.delete(id);
    void saveCollapsed();
  }
}

function onGutterClick(e: MouseEvent): void {
  const comment = (e.target as HTMLElement | null)?.closest?.('shreddit-comment');
  if (!comment || !(comment instanceof HTMLElement)) return;
  // Only direct hits on the comment's own padding/indent gutter —
  // clicks on content, links, or child comments are left alone.
  if (e.target !== comment) return;
  const d = detailsOf(comment);
  if (!d) return;
  setCollapsed(comment, d.open); // open now -> collapse
  e.preventDefault();
  e.stopPropagation();
}

function restoreCollapsed(): void {
  for (const c of getComments()) {
    const id = c.getAttribute('thingid') ?? '';
    if (id && collapsed.has(id)) setCollapsed(c, true);
  }
}

/* ---------------- newCommentCount: "N new comments since last visit" ------- */

const COUNTS_KEY = 'restore-thread-counts';
const COUNTS_CAP = 1000;

interface ThreadCount {
  count: number;
  ts: number;
}

export function trackNewComments(): void {
  const tree = document.querySelector('shreddit-comment-tree');
  if (!tree) return;
  const postId = tree.getAttribute('post-id') ?? '';
  const total = Number(tree.getAttribute('totalcomments') ?? '');
  if (!postId || !Number.isFinite(total)) return;

  void browser.storage.local.get(COUNTS_KEY).then(async (o) => {
    const map = (o[COUNTS_KEY] as Record<string, ThreadCount>) ?? {};
    const prev = map[postId];
    if (prev && total > prev.count) {
      const banner = document.createElement('div');
      banner.id = 'restore-new-comments';
      banner.textContent = `${total - prev.count} new comment${total - prev.count === 1 ? '' : 's'} since your last visit`;
      tree.parentElement?.insertBefore(banner, tree);
    }
    map[postId] = { count: total, ts: Date.now() };
    const keys = Object.keys(map);
    if (keys.length > COUNTS_CAP) {
      keys.sort((a, b) => map[a].ts - map[b].ts);
      for (const k of keys.slice(0, keys.length - COUNTS_CAP)) delete map[k];
    }
    await browser.storage.local.set({ [COUNTS_KEY]: map });
  });
}

/* ---------------- wiring ---------------- */

let observer: MutationObserver | null = null;
let clickListener = false;

export function initCommentFeatures(opts: {
  userHighlight: boolean;
  quickCollapse: boolean;
  collapsePersist: boolean;
}): void {
  persist = opts.collapsePersist;

  if (!opts.userHighlight) {
    for (const c of getComments()) c.classList.remove(OP_CLASS, SELF_CLASS);
  }

  if (opts.quickCollapse && !clickListener) {
    clickListener = true;
    document.addEventListener('click', onGutterClick, true);
  }

  const start = () => {
    if (opts.userHighlight) applyUserHighlight(document.body);
    if (persist) void loadCollapsed().then(restoreCollapsed);
    if (!observer) {
      observer = new MutationObserver(() => {
        if (opts.userHighlight) applyUserHighlight(document.body);
        if (persist) restoreCollapsed();
      });
      const tree = document.querySelector('shreddit-comment-tree') ?? document.body;
      observer.observe(tree, { childList: true, subtree: true });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}
