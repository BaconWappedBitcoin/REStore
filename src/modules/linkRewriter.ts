/**
 * linkRewriter: rewrites every www/new/old.reddit.com link on sh.reddit.com
 * to sh.reddit.com, so clicks (including Home buttons and SPA prefetches)
 * never leave sh. Covers links added later by infinite scroll.
 */

const BAD_HREF = /^https?:\/\/(www|new|old)\.reddit\.com\//i;

function rewrite(el: HTMLAnchorElement): void {
  const href = el.getAttribute('href');
  if (!href || !BAD_HREF.test(href)) return;
  el.setAttribute('href', href.replace(BAD_HREF, 'https://sh.reddit.com/'));
}

function scan(root: ParentNode): void {
  for (const a of root.querySelectorAll<HTMLAnchorElement>('a[href]')) rewrite(a);
}

export function initLinkRewriter(): void {
  const start = () => scan(document.body);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  // Links appear continuously (feed, hover cards, dropdowns)
  new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (!(n instanceof HTMLElement)) continue;
        if (n instanceof HTMLAnchorElement) rewrite(n);
        scan(n);
      }
      if (m.type === 'attributes' && m.target instanceof HTMLAnchorElement) {
        rewrite(m.target);
      }
    }
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributeFilter: ['href'],
  });

  // Belt-and-braces: catch any click on a www/new/old link before navigation
  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href]');
      if (a instanceof HTMLAnchorElement) {
        const href = a.getAttribute('href') ?? '';
        if (BAD_HREF.test(href)) {
          e.preventDefault();
          location.assign(href.replace(BAD_HREF, 'https://sh.reddit.com/'));
        }
      }
    },
    true,
  );
}
