/**
 * Single source of truth for sh.reddit.com DOM hooks.
 *
 * sh.reddit.com renders custom elements (<shreddit-*>), which are far more
 * stable than generated class names. If Reddit renames something, update it
 * here only. In dev mode (`import.meta.env.DEV`), missing selectors log a
 * console warning so breakage is visible immediately.
 */

export const sel = {
  feed: 'shreddit-feed',
  post: 'shreddit-post',
  postArticle: 'shreddit-post article',
  comment: 'shreddit-comment',
  commentTree: 'shreddit-comment-tree',
  voteButtons: 'shreddit-post [data-testid="post-vote-button"]',
  header: 'reddit-header, faceplate-header, header',
  sidebar: 'shreddit-sidebar, aside[data-testid="sidebar"]',
  promoted: '[data-testid="promoted-post"], shreddit-post[promoted="true"]',
  chatWidget: '#chat, [data-testid="chat-widget"]',
  upsell: '[data-testid="upsell"], faceplate-banner',
} as const;

export function assertSelectors(root: Document | HTMLElement = document): void {
  if (!import.meta.env.DEV) return;
  const mustExist: (keyof typeof sel)[] = ['feed', 'post'];
  for (const key of mustExist) {
    if (!root.querySelector(sel[key])) {
      console.warn(
        `[REStore] selector "${key}" (${sel[key]}) matched nothing — Reddit may have changed its DOM.`,
      );
    }
  }
}
