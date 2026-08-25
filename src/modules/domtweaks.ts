/**
 * Light DOM tweaks applied on sh.reddit.com when the corresponding toggle is on.
 * The heavy lifting is CSS (src/reskin/*); this file handles things CSS can't.
 */

import { sel } from '../selectors';

/** Marks sh.reddit.com as "seen working" this session for the redirect loop guard. */
export function markShVisit(): void {
  void browser.storage.session?.set({ shVisitSeen: true }).catch(() => {
    // storage.session unavailable in older Firefox — fall back to sessionStorage
    try {
      sessionStorage.setItem('restore-sh-visit-seen', '1');
    } catch {
      /* ignore */
    }
  });
}

/** Hides promoted posts, upsell banners, chat widget. CSS handles visibility via <html> classes. */
export function applyDomTweaks(hideClutter: boolean): void {
  document.documentElement.classList.toggle('restore-clutter-hidden', hideClutter);

  if (hideClutter) {
    for (const el of document.querySelectorAll(sel.promoted)) {
      (el as HTMLElement).style.display = 'none';
    }
  }
}
