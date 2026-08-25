/**
 * userTagger port: colored tags next to usernames anywhere they appear
 * (feeds, comments, hover cards). Tags live in storage.local.
 *
 * Interaction: Alt+click any username link to set/edit/remove its tag.
 * Format in the prompt: "tag text" or "tag text|blue" with color one of
 * blue, red, green, orange, purple, none.
 */

const TAGS_KEY = 'restore-user-tags';

export interface UserTag {
  tag: string;
  color: string; // '' = default
}

type TagMap = Record<string, UserTag>;

const COLORS: Record<string, string> = {
  blue: '#0055df',
  red: '#c00',
  green: '#080',
  orange: '#c26a09',
  purple: '#60c',
  none: '',
};

let tags: TagMap = {};
let enabled = false;
let observer: MutationObserver | null = null;

async function loadTags(): Promise<void> {
  const o = (await browser.storage.local.get(TAGS_KEY)) as Record<string, unknown>;
  tags = (o[TAGS_KEY] as TagMap) ?? {};
}

async function saveTags(): Promise<void> {
  await browser.storage.local.set({ [TAGS_KEY]: tags });
}

function usernameOf(href: string): string {
  const m = href.match(/(?:^|https?:\/\/[^/]+)\/user\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]).toLowerCase() : '';
}

const CHIP_CLASS = 'restore-usertag';

function authorLinks(root: ParentNode): HTMLAnchorElement[] {
  return [...root.querySelectorAll<HTMLAnchorElement>(
    'a[href*="/user/"]:not([data-restore-tagged])',
  )].filter((a) => usernameOf(a.getAttribute('href') ?? '') !== '');
}

function renderTags(root: ParentNode = document): void {
  if (!enabled) return;
  for (const a of authorLinks(root)) {
    a.dataset.restoreTagged = '1';
    const name = usernameOf(a.getAttribute('href') ?? '');
    const t = tags[name];
    if (!t?.tag) continue;
    const chip = document.createElement('span');
    chip.className = CHIP_CLASS;
    chip.textContent = t.tag;
    const color = COLORS[t.color] ?? '';
    if (color) {
      chip.style.color = color;
      chip.style.borderColor = color;
    }
    a.insertAdjacentElement('afterend', chip);
  }
}

function onAuthorClick(e: MouseEvent): void {
  if (!enabled || !e.altKey) return;
  const a = (e.target as HTMLElement | null)?.closest?.('a[href*="/user/"]');
  if (!(a instanceof HTMLAnchorElement)) return;
  const name = usernameOf(a.getAttribute('href') ?? '');
  if (!name) return;
  e.preventDefault();
  e.stopPropagation();
  const current = tags[name];
  const input = window.prompt(
    `Tag for u/${name}\n(text, or "text|color" with blue/red/green/orange/purple — empty to remove)`,
    current ? (current.color ? `${current.tag}|${current.color}` : current.tag) : '',
  );
  if (input === null) return; // cancelled
  const [text, color = ''] = input.split('|').map((s) => s.trim());
  if (text === '') delete tags[name];
  else tags[name] = { tag: text, color: color.toLowerCase() };
  void saveTags();
  // refresh all chips for this user
  for (const el of document.querySelectorAll(`a[data-restore-tagged]`)) {
    const link = el as HTMLAnchorElement;
    if (usernameOf(link.getAttribute('href') ?? '') !== name) continue;
    link.removeAttribute('data-restore-tagged');
    link.nextElementSibling?.classList.contains(CHIP_CLASS) &&
      link.nextElementSibling.remove();
  }
  renderTags(document);
}

export function initUserTagger(on: boolean): void {
  enabled = on;
  observer?.disconnect();
  observer = null;
  document.removeEventListener('click', onAuthorClick, true);

  if (!on) {
    for (const chip of document.querySelectorAll('.' + CHIP_CLASS)) chip.remove();
    for (const a of document.querySelectorAll('a[data-restore-tagged]'))
      delete (a as HTMLElement).dataset.restoreTagged;
    return;
  }

  document.addEventListener('click', onAuthorClick, true);
  void loadTags().then(() => {
    renderTags(document);
    observer = new MutationObserver((muts) => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (n instanceof HTMLElement) renderTags(n);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

/** Options-page support: read/delete stored tags. */
export async function getAllTags(): Promise<TagMap> {
  await loadTags();
  return { ...tags };
}

export async function deleteTag(name: string): Promise<void> {
  await loadTags();
  delete tags[name];
  await saveTags();
}
