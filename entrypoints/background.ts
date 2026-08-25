import { defineBackground } from 'wxt/utils/define-background';
import { getToggles } from '../src/modules/toggles';
import { toShReddit, dnrRules, type DnrRule } from '../src/modules/redirect';

const DNR_RULE_IDS = [1001, 1002, 1003];

interface DnrNamespace {
  updateDynamicRules(opts: { removeRuleIds: number[]; addRules: DnrRule[] }): Promise<unknown>;
}

export default defineBackground(() => {
  const dnr = (browser as unknown as { declarativeNetRequest?: DnrNamespace }).declarativeNetRequest;

  async function syncRedirectRules(enabled: boolean) {
    if (!dnr?.updateDynamicRules) return;
    await dnr.updateDynamicRules({
      removeRuleIds: DNR_RULE_IDS,
      addRules: enabled ? dnrRules(DNR_RULE_IDS) : [],
    });
  }

  void getToggles().then((t) => syncRedirectRules(t.redirect));

  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && 'redirect' in changes) {
      void syncRedirectRules(changes.redirect.newValue as boolean);
    }
  });

  // Firefox fallback: redirect via webRequestBlocking when DNR is absent
  const webRequest = (browser as unknown as {
    webRequest?: {
      onBeforeRequest: {
        addListener(
          cb: (details: { url: string }) => { redirectUrl?: string } | Record<string, never>,
          filter: { urls: string[] },
          extra: string[],
        ): void;
      };
    };
  }).webRequest;

  if (webRequest && !dnr) {
    webRequest.onBeforeRequest.addListener(
      (details) => {
        const target = toShReddit(details.url);
        return target ? { redirectUrl: target } : {};
      },
      { urls: ['*://www.reddit.com/*', '*://new.reddit.com/*', '*://old.reddit.com/*'] },
      ['blocking'],
    );
  }
});
