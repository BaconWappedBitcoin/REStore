/**
 * classicRows: renders faithful old-Reddit link-list rows from shreddit post
 * metadata. The native article stays in the DOM (hidden) as the data/vote
 * source — our row's arrows click the native vote buttons inside
 * shreddit-post's shadow root, so voting really works.
 */

import { onFeedScan, extractMeta } from './feed';

const ROW_CLASS = 'restore-row';
const NATIVE_HIDDEN = 'restore-classic-on';

function timeagoOf(article: HTMLElement): string {
  return (
    article.querySelector('faceplate-timeago time')?.textContent?.trim() ??
    article.querySelector('time')?.textContent?.trim() ??
    ''
  );
}

function thumbOf(article: HTMLElement): string | null {
  const img = article.querySelector<HTMLImageElement>('img');
  const src = img?.getAttribute('src');
  if (!src || src.startsWith('data:')) return null;
  return src;
}

function nativeVoteButtons(article: HTMLElement): HTMLButtonElement[] {
  const p = article.querySelector('shreddit-post');
  const sr = (p as HTMLElement & { shadowRoot?: ShadowRoot } | null)?.shadowRoot;
  if (!sr) return [];
  return [...sr.querySelectorAll('button')].slice(0, 2) as HTMLButtonElement[];
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function renderRow(article: HTMLElement): void {
  if (article.querySelector(':scope > .' + ROW_CLASS)) return;
  const m = extractMeta(article);
  const post = article.querySelector('shreddit-post');
  const comments =
    post?.getAttribute('comment-count') ?? article.getAttribute('comment-count') ?? '';

  const row = el('div', ROW_CLASS);
  row.setAttribute('data-post-id', m.id);

  // rank
  row.appendChild(el('span', 'restore-rank'));

  // votes column (delegates to native buttons in shadow DOM)
  const votes = el('div', 'restore-votes');
  const up = el('button', 'restore-arrow restore-up', '▲');
  up.type = 'button';
  up.title = 'upvote';
  const score = el('span', 'restore-score', Number.isFinite(m.score) ? String(m.score) : '•');
  const down = el('button', 'restore-arrow restore-down', '▼');
  down.type = 'button';
  down.title = 'downvote';
  up.addEventListener('click', () => nativeVoteButtons(article)[0]?.click());
  down.addEventListener('click', () => nativeVoteButtons(article)[1]?.click());
  votes.append(up, score, down);

  // thumbnail
  const thumbHref = m.linkUrl || m.permalink;
  const thumb = el('a', 'restore-thumb');
  thumb.href = thumbHref;
  const src = thumbOf(article);
  if (src) {
    const im = document.createElement('img');
    im.src = src;
    im.loading = 'lazy';
    im.alt = '';
    thumb.appendChild(im);
  }

  // middle column
  const mid = el('div', 'restore-mid');
  if (m.linkUrl) {
    const title = el('a', 'restore-title', m.title || '(no title)');
    title.href = m.linkUrl;
    mid.appendChild(title);
    if (m.domain) mid.appendChild(el('span', 'restore-domain', `(${m.domain})`));
  } else {
    mid.appendChild(el('a', 'restore-title', m.title || '(no title)'));
  }
  const tag = el('div', 'restore-tagline');
  tag.append(
    'submitted ',
    el('span', '', timeagoOf(article) || '?'),
    ' by ',
    (() => {
      const a = el('a', '', m.author || '[deleted]');
      a.href = '/user/' + m.author;
      return a;
    })(),
    ' to ',
    (() => {
      const a = el('a', '', 'r/' + (m.subreddit || '?'));
      a.href = '/r/' + m.subreddit;
      return a;
    })(),
  );
  const btns = el('div', 'restore-buttons');
  const clink = el('a', '', `${comments} comments`);
  clink.href = new URL(m.permalink, location.origin).toString();
  const save = el('a', '', 'save');
  save.href = '#';
  save.addEventListener('click', (e) => {
    e.preventDefault();
    const native = article.querySelector('button[aria-label*="Save"], button[aria-label*="save"]');
    (native as HTMLElement | null)?.click();
  });
  const hide = el('a', '', 'hide');
  hide.href = '#';
  hide.addEventListener('click', (e) => {
    e.preventDefault();
    article.classList.add('restore-read-hidden');
  });
  btns.append(clink, save, hide);
  mid.append(tag, btns);

  row.append(votes, thumb, mid);
  article.insertBefore(row, article.firstChild);
}

export function initClassicRows(enabled: boolean): void {
  document.documentElement.classList.toggle(NATIVE_HIDDEN, enabled);
  if (!enabled) {
    for (const r of document.querySelectorAll('.' + ROW_CLASS)) r.remove();
    return;
  }
  onFeedScan((articles) => {
    for (const a of articles) renderRow(a);
  });
}
