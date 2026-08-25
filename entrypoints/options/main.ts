import {
  DEFAULT_TOGGLES,
  getToggles,
  setToggle,
  type Toggles,
} from '../../src/modules/toggles';
import {
  getFilterSettings,
  setFilterSettings,
  type FilterSettings,
} from '../../src/modules/settings';

const TOGGLE_LABELS: Record<keyof Toggles, string> = {
  redirect: 'Always redirect www/new/old.reddit.com to sh.reddit.com',
  reskinBase: 'Old-Reddit colors and typography',
  reskinLayout: 'Centered fixed-width layout with compact list',
  reskinPosts: 'Classic post rows (title, meta, vote score)',
  reskinComments: 'Classic threaded comments with indent lines',
  reskinHeader: 'Old-style blue header bar',
  hideClutter: 'Remove all ads and sponsored content (in-feed, sidebar, promoted)',
  filterReddit: 'Hide posts matching filters (below)',
  keyboardNav: 'Keyboard navigation (j/k select, Enter open, c comments, h hide)',
  pageNavigator: 'Floating back-to-top / jump-to-bottom buttons',
  autoHide: 'Hide posts I have already opened',
};

const FILTER_FIELDS: { key: keyof FilterSettings; label: string; placeholder: string }[] = [
  {
    key: 'blockedSubreddits',
    label: 'Blocked subreddits',
    placeholder: 'e.g. politics, funny, all',
  },
  { key: 'blockedUsers', label: 'Blocked users', placeholder: 'e.g. someuser, otheruser' },
  { key: 'blockedDomains', label: 'Blocked domains', placeholder: 'e.g. twitter.com, dailywire.com' },
  {
    key: 'blockedKeywords',
    label: 'Blocked title keywords',
    placeholder: 'e.g. crypto, election',
  },
  { key: 'minScore', label: 'Minimum score (blank = off)', placeholder: 'e.g. 100' },
];

async function render() {
  const toggles = await getToggles();
  const filters = await getFilterSettings();
  const root = document.getElementById('app')!;

  const box = document.createElement('div');
  box.id = 'toggles';
  for (const key of Object.keys(DEFAULT_TOGGLES) as (keyof Toggles)[]) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = toggles[key];
    input.addEventListener('change', () => void setToggle(key, input.checked));
    label.append(input, ' ', TOGGLE_LABELS[key]);
    box.append(label);
  }

  const fbox = document.createElement('div');
  fbox.id = 'filters';
  const h = document.createElement('h2');
  h.textContent = 'Filters';
  fbox.append(h);
  for (const f of FILTER_FIELDS) {
    const label = document.createElement('label');
    const span = document.createElement('span');
    span.textContent = f.label;
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = f.placeholder;
    input.value = filters[f.key];
    input.size = 40;
    input.addEventListener('change', () =>
      void setFilterSettings({ [f.key]: input.value } as Partial<FilterSettings>),
    );
    label.append(span, input);
    fbox.append(label);
  }

  root.append(box, fbox);
}

void render();
