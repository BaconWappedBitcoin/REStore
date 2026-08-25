/**
 * Feature toggles backed by browser.storage.sync (works in both Chrome and Firefox).
 * Each toggle maps to a CSS module and/or DOM tweak. Changes re-apply live
 * without a page reload via the storage change listener in content.ts.
 */

export interface Toggles {
  redirect: boolean;
  reskinBase: boolean;
  reskinLayout: boolean;
  reskinPosts: boolean;
  reskinComments: boolean;
  reskinHeader: boolean;
  hideClutter: boolean;
  filterReddit: boolean;
  keyboardNav: boolean;
  pageNavigator: boolean;
  autoHide: boolean;
  userHighlight: boolean;
  quickCollapse: boolean;
  collapsePersist: boolean;
  nightMode: boolean;
  classicRows: boolean;
  classicChrome: boolean;
}

export const DEFAULT_TOGGLES: Toggles = {
  redirect: true,
  reskinBase: true,
  reskinLayout: true,
  reskinPosts: true,
  reskinComments: true,
  reskinHeader: true,
  hideClutter: true,
  filterReddit: true,
  keyboardNav: true,
  pageNavigator: true,
  autoHide: true,
  userHighlight: true,
  quickCollapse: true,
  collapsePersist: true,
  nightMode: true,
  classicRows: true,
  classicChrome: true,
};

export async function getToggles(): Promise<Toggles> {
  const stored = (await browser.storage.sync.get(
    DEFAULT_TOGGLES as unknown as Record<string, unknown>,
  )) as Partial<Toggles>;
  return { ...DEFAULT_TOGGLES, ...stored };
}

export async function setToggle(key: keyof Toggles, value: boolean): Promise<void> {
  await browser.storage.sync.set({ [key]: value });
}
