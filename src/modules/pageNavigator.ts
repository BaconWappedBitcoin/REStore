/**
 * pageNavigator port: floating up/down buttons bottom-right.
 */

let nav: HTMLElement | null = null;

export function initPageNavigator(on: boolean): void {
  nav?.remove();
  nav = null;
  if (!on) return;

  nav = document.createElement('div');
  nav.id = 'restore-pagenav';
  const up = document.createElement('button');
  up.textContent = '↑';
  up.title = 'Back to top (REStore)';
  const down = document.createElement('button');
  down.textContent = '↓';
  down.title = 'Jump to bottom (REStore)';
  up.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  down.addEventListener('click', () =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }),
  );
  nav.append(up, down);
  (document.body ?? document.documentElement).appendChild(nav);
}
