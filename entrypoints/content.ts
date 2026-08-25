import { defineContentScript } from 'wxt/utils/define-content-script';
import { getToggles, type Toggles } from '../src/modules/toggles';
import { assertSelectors } from '../src/selectors';
import { applyDomTweaks } from '../src/modules/domtweaks';
import { initFilters } from '../src/modules/filters';
import { initKeyboardNav } from '../src/modules/keyboardNav';
import { initPageNavigator } from '../src/modules/pageNavigator';
import { initAutoHide, watchReads } from '../src/modules/autoHide';
import { initCommentFeatures } from '../src/modules/comments';
import { initClassicRows, applySubTags } from '../src/modules/classicRows';
import { initChrome } from '../src/modules/chrome';
import { initUserTagger } from '../src/modules/userTagger';

import '../src/reskin/base.css';
import '../src/reskin/layout.css';
import '../src/reskin/sidebar.css';
import '../src/reskin/posts.css';
import '../src/reskin/comments.css';
import '../src/reskin/header.css';
import '../src/reskin/clutter.css';
import '../src/reskin/classic-rows.css';
import '../src/reskin/chrome.css';
import '../src/reskin/modules.css';

function apply(t: Toggles) {
  const root = document.documentElement;
  root.dataset.restoreBase = t.reskinBase ? 'on' : 'off';
  root.dataset.restoreLayout = t.reskinLayout ? 'on' : 'off';
  root.dataset.restorePosts = t.reskinPosts ? 'on' : 'off';
  root.dataset.restoreComments = t.reskinComments ? 'on' : 'off';
  root.dataset.restoreHeader = t.reskinHeader ? 'on' : 'off';
  root.dataset.restoreTheme = t.nightMode ? 'dark' : 'light';
  applyDomTweaks(t.hideClutter);
  initFilters(t.filterReddit);
  initKeyboardNav(t.keyboardNav);
  initPageNavigator(t.pageNavigator);
  initAutoHide(t.autoHide);
  initClassicRows(t.classicRows);
  initChrome(t.classicChrome);
  initUserTagger(t.userTagger);
  applySubTags(t.subTags);
  initCommentFeatures({
    userHighlight: t.userHighlight,
    quickCollapse: t.quickCollapse,
    collapsePersist: t.collapsePersist,
  });
}

export default defineContentScript({
  matches: ['*://sh.reddit.com/*', '*://www.reddit.com/*'],
  runAt: 'document_start',
  main() {
    watchReads();
    void getToggles().then(apply);

    // Live re-apply when toggles change in the options page
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      void getToggles().then(apply);
    });

    // sh.reddit.com is a client-side-navigating SPA; re-assert after nav and
    // warn (dev mode) if Reddit renamed the elements we hook into.
    const nav = () => {
      void getToggles().then(apply);
      assertSelectors();
    };
    document.addEventListener('DOMContentLoaded', nav);
    window.addEventListener('spaNavigated' as never, nav, false);

    // Custom elements upgrade asynchronously — re-check once late
    if (document.readyState === 'loading') {
      document.addEventListener('readystatechange', () => nav(), { once: true });
    } else {
      setTimeout(nav, 1500);
    }
  },
});
