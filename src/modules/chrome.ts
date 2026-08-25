/**
 * chrome overlay: replaces shreddit's modern header with the classic
 * old-Reddit chrome — thin bar (logo, search, username), subreddit/sort tab
 * row — and moves the sidebar to the left like old Reddit.
 * The native header stays in the DOM (hidden) so Reddit's own JS keeps working.
 */

import { onFeedScan } from './feed';

const BAR_ID = 'restore-header';
const TABS_ID = 'restore-tabs';

function myUsername(): string {
  const app = document.querySelector('shreddit-app');
  const fromApp = app?.getAttribute?.('user') ?? app?.getAttribute?.('username') ?? '';
  if (fromApp) return fromApp;
  const link = document.querySelector(
    '[data-redditstyle-user-drawer-trigger] a[href^="/user/"]',
  );
  return link?.getAttribute('href')?.match(/^\/user\/([^/]+)/)?.[1] ?? '';
}

function currentSubPath(): string {
  const m = location.pathname.match(/^(\/r\/[^/]+)/);
  return m ? m[1] : '';
}

function currentSort(): string {
  const q = new URLSearchParams(location.search).get('sort');
  if (q) return q;
  const m = location.pathname.match(/\/(hot|new|top|rising|controversial)\/?$/);
  return m ? m[1] : 'hot';
}

function buildHeader(): HTMLElement {
  const bar = document.createElement('div');
  bar.id = BAR_ID;

  const logo = document.createElement('a');
  logo.id = 'restore-logo';
  logo.href = 'https://sh.reddit.com/';
  logo.textContent = 'reddit';

  const home = document.createElement('a');
  home.className = 'restore-navlink';
  home.href = 'https://sh.reddit.com/';
  home.textContent = 'HOME';

  const popular = document.createElement('a');
  popular.className = 'restore-navlink';
  popular.href = 'https://sh.reddit.com/r/popular/';
  popular.textContent = 'POPULAR';

  const all = document.createElement('a');
  all.className = 'restore-navlink';
  all.href = 'https://sh.reddit.com/r/all/';
  all.textContent = 'ALL';

  const search = document.createElement('form');
  search.id = 'restore-search';
  search.action = '/search/';
  search.method = 'get';
  const input = document.createElement('input');
  input.type = 'text';
  input.name = 'q';
  input.placeholder = 'search';
  search.appendChild(input);

  const user = document.createElement('span');
  user.id = 'restore-user';
  const name = myUsername();
  if (name) {
    const a = document.createElement('a');
    a.href = '/user/' + name;
    a.textContent = name;
    user.appendChild(a);
  }

  bar.append(logo, home, popular, all, search, user);
  return bar;
}

function buildTabs(): HTMLElement {
  const tabs = document.createElement('div');
  tabs.id = TABS_ID;
  const base = currentSubPath() || '';
  const sort = currentSort();
  for (const s of ['hot', 'new', 'top', 'rising']) {
    const a = document.createElement('a');
    a.href = (base || '/') + (base ? '/' : '') + (s === 'hot' ? '' : s + '/');
    if (s === 'hot' && sort === 'hot') a.href = base ? base + '/' : '/';
    a.textContent = s;
    if (s === sort) a.classList.add('active');
    tabs.appendChild(a);
  }
  return tabs;
}

let chromeObserver: (() => void) | null = null;

export function initChrome(enabled: boolean): void {
  document.documentElement.classList.toggle('restore-chrome-on', enabled);
  document.getElementById(BAR_ID)?.remove();
  document.getElementById(TABS_ID)?.remove();
  chromeObserver?.();
  chromeObserver = null;
  if (!enabled) return;

  // Mount + re-mount: shreddit replaces the feed on SPA navigation, so we
  // re-check on every feed scan (cheap, idempotent).
  chromeObserver = onFeedScan(() => {
    if (document.body && !document.getElementById(BAR_ID)) {
      document.body.prepend(buildHeader());
    }
    const feed = document.querySelector('shreddit-feed');
    if (feed && !document.getElementById(TABS_ID)) {
      feed.parentElement?.insertBefore(buildTabs(), feed);
    }
  });
}
