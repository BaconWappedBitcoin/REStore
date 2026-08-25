/**
 * chrome overlay: replaces shreddit's modern header with the classic
 * old-Reddit chrome — thin bar (logo, search, username), subreddit/sort tab
 * row — and moves the sidebar to the left like old Reddit.
 * The native header stays in the DOM (hidden) so Reddit's own JS keeps working.
 */

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
  logo.href = '/';
  logo.textContent = 'reddit';

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

  bar.append(logo, search, user);
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

export function initChrome(enabled: boolean): void {
  document.documentElement.classList.toggle('restore-chrome-on', enabled);
  document.getElementById(BAR_ID)?.remove();
  document.getElementById(TABS_ID)?.remove();
  if (!enabled) return;

  const mount = () => {
    if (!document.getElementById(BAR_ID)) {
      document.body.prepend(buildHeader());
    }
    const feed = document.querySelector('shreddit-feed');
    if (feed && !document.getElementById(TABS_ID)) {
      feed.parentElement?.insertBefore(buildTabs(), feed);
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
    setTimeout(mount, 1200); // SPA renders late
  }
}
