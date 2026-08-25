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
  userHighlight: 'Highlight the OP in blue (and yourself in orange) in comments',
  quickCollapse: 'Click a comment\'s left gutter to collapse the thread',
  collapsePersist: 'Remember collapsed comment threads across visits',
  nightMode: 'Night mode (dark classic theme — off = classic light)',
  classicRows: 'Classic rows: render true old-Reddit post rows (rank, votes, thumbnail, buttons)',
  classicChrome: 'Classic chrome: old-Reddit header bar, sort tabs, and left sidebar',
  userTagger: 'User tags: Alt+click a username to tag them (colored chip)',
  subTags: 'Color-code the r/subreddit tag in each row',
};

async function renderTags() {
  const box = document.getElementById('tags');
  if (!box) return;
  box.innerHTML = '';
  const { getAllTags } = await import('../../src/modules/userTagger');
  const tags = await getAllTags();
  const entries = Object.entries(tags);
  if (!entries.length) {
    box.textContent = 'No tags yet — Alt+click a username on Reddit to add one.';
    return;
  }
  for (const [name, t] of entries) {
    const row = document.createElement('div');
    const chip = document.createElement('span');
    chip.textContent = t.tag;
    chip.style.color = t.color || '#369';
    chip.style.fontWeight = 'bold';
    const user = document.createElement('span');
    user.textContent = ' u/' + name;
    const del = document.createElement('button');
    del.textContent = 'delete';
    del.addEventListener('click', async () => {
      const { deleteTag } = await import('../../src/modules/userTagger');
      await deleteTag(name);
      void renderTags();
    });
    row.append(chip, user, ' ', del);
    box.append(row);
  }
}

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

  const tagHead = document.createElement('h2');
  tagHead.textContent = 'User tags';
  const tagBox = document.createElement('div');
  tagBox.id = 'tags';
  root.append(tagHead, tagBox);
  void renderTags();
}

void render();
