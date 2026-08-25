/**
 * keyboardNav + selectedEntry port (RES hotkeys, classic subset):
 *   j / k      select next / previous post
 *   Enter      open selected post's link (new tab)
 *   c          open comments (new tab)
 *   h          hide selected post for this session
 *   Escape     clear selection
 *   a / z      upvote / downvote is intentionally NOT implemented — shreddit
 *              vote buttons are custom elements we'd have to synthesize real
 *              clicks on; skipped until validated.
 */

import { getArticles, extractMeta, isTyping } from './feed';

const SELECTED_CLASS = 'restore-selected';

let selectedIndex = -1;
let enabled = false;

function visibleArticles(): HTMLElement[] {
  return getArticles().filter((a) => {
    if (a.classList.contains('restore-filtered') || a.classList.contains('restore-read-hidden'))
      return false;
    const r = a.getBoundingClientRect();
    return getComputedStyle(a).display !== 'none' && r.height > 1;
  });
}

function select(index: number): void {
  const arts = visibleArticles();
  if (!arts.length) return;
  selectedIndex = Math.max(0, Math.min(index, arts.length - 1));
  for (const a of arts) a.classList.remove(SELECTED_CLASS);
  const el = arts[selectedIndex];
  el.classList.add(SELECTED_CLASS);
  el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function open(url: string | undefined): void {
  if (!url) return;
  try {
    window.open(url, '_blank', 'noopener');
  } catch {
    location.assign(url);
  }
}

function hideSelected(): void {
  const arts = visibleArticles();
  const el = arts[selectedIndex];
  if (!el) return;
  el.classList.add('restore-read-hidden');
  select(selectedIndex);
}

function onKeyDown(e: KeyboardEvent): void {
  if (!enabled || isTyping() || e.ctrlKey || e.metaKey || e.altKey) return;
  switch (e.key) {
    case 'j':
      select(selectedIndex + 1);
      break;
    case 'k':
      select(selectedIndex - 1);
      break;
    case 'c': {
      const arts = visibleArticles();
      const meta = arts[selectedIndex] ? extractMeta(arts[selectedIndex]) : null;
      if (meta?.permalink) {
        open(new URL(meta.permalink, location.origin).toString());
        e.preventDefault();
      }
      break;
    }
    case 'Enter': {
      const arts = visibleArticles();
      const meta = arts[selectedIndex] ? extractMeta(arts[selectedIndex]) : null;
      if (meta?.linkUrl) {
        open(meta.linkUrl);
        e.preventDefault();
      }
      break;
    }
    case 'h':
      hideSelected();
      break;
    case 'Escape':
      for (const a of getArticles()) a.classList.remove(SELECTED_CLASS);
      selectedIndex = -1;
      break;
  }
}

export function initKeyboardNav(on: boolean): void {
  enabled = on;
  if (!on) {
    for (const a of getArticles()) a.classList.remove(SELECTED_CLASS);
    selectedIndex = -1;
  }
}

document.addEventListener('keydown', onKeyDown, true);
