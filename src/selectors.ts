/**
 * Single source of truth for sh.reddit.com DOM hooks.
 *
 * sh.reddit.com renders custom elements (<shreddit-*>), which are far more
 * stable than generated class names. If Reddit renames something, update it
 * here only. In dev mode (`import.meta.env.DEV`), missing selectors log a
 * console warning so breakage is visible immediately.
 *
 * Ad/sponsored selectors were verified against the live DOM on 2026-08-24.
 */

export const sel = {
  feed: 'shreddit-feed',
  post: 'shreddit-post',
  postArticle: 'shreddit-feed > article, article[data-post-id]',
  comment: 'shreddit-comment',
  commentTree: 'shreddit-comment-tree',
  voteButtons: 'shreddit-post [data-testid="post-vote-button"]',
  header: 'header',
  sidebar: '.right-sidebar, aside.contents',

  /** All known ad / sponsored-content elements (priority removal targets). */
  ads: [
    'shreddit-ad-post',
    'shreddit-ad',
    'shreddit-sidebar-ad',
    'shreddit-comment-tree-ad',
    'shreddit-async-loader[bundlename="sidebar_ad"]',
    'shreddit-async-loader[bundlename*="ad"]',
    'ad-scheduler',
    'image-observer[is-promoted]',
    'shreddit-post[promoted="true"]',
    '.promotedlink',
    '.promoted-label',
    '.promoted-name-container',
    '.ad-link-bar',
    '[data-ad-click-location]',
    'shreddit-post-overflow-menu[is-ad]',
    '[data-testid="promoted-post"]',
  ].join(', '),

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
