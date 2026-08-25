import { defineBackground } from 'wxt/utils/define-background';
import { getToggles } from '../src/modules/toggles';
import { toShReddit, dnrRules, DNR_RULE_IDS, LOOP_ERROR, type DnrRule } from '../src/modules/redirect';

interface DnrNamespace {
  updateDynamicRules(opts: { removeRuleIds: number[]; addRules: DnrRule[] }): Promise<unknown>;
}

interface WebRequestNamespace {
  onErrorOccurred: {
    addListener(
      cb: (details: { url: string; error: string }) => void,
      filter: { urls: string[]; types: string[] },
    ): void;
  };
}

export default defineBackground(() => {
  const dnr = (browser as unknown as { declarativeNetRequest?: DnrNamespace }).declarativeNetRequest;
  const webRequest = (browser as unknown as { webRequest?: WebRequestNamespace }).webRequest;
  const session = browser.storage.session;

  async function readSession(): Promise<{ shVisitSeen?: boolean; redirectPaused?: boolean }> {
    const o = (await session.get(['shVisitSeen', 'redirectPaused'])) as Record<string, unknown>;
    return o as { shVisitSeen?: boolean; redirectPaused?: boolean };
  }

  async function applyRules(armed: boolean): Promise<void> {
    if (!dnr?.updateDynamicRules) return;
    await dnr.updateDynamicRules({
      removeRuleIds: DNR_RULE_IDS,
      addRules: armed ? dnrRules(DNR_RULE_IDS) : [],
    });
  }

  /** Rules on only when: toggle on AND sh seen this session AND not paused. */
  async function sync(): Promise<void> {
    const [{ redirect }, s] = await Promise.all([getToggles(), readSession()]);
    await applyRules(redirect === true && s.shVisitSeen === true && s.redirectPaused !== true);
  }

  void sync();

  browser.storage.onChanged.addListener((_changes, area) => {
    if (area === 'sync' || area === 'session') void sync();
  });

  // Loop detection: disarm for the rest of the browser session.
  webRequest?.onErrorOccurred.addListener(
    (details) => {
      if (details.error === LOOP_ERROR && details.url.includes('reddit.com')) {
        void session.set({ redirectPaused: true }).then(sync);
      }
    },
    { urls: ['*://*.reddit.com/*'], types: ['main_frame'] },
  );

  // Firefox fallback: redirect via webRequestBlocking when DNR is absent.
  const blocking = (browser as unknown as {
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

  if (blocking && !dnr) {
    blocking.onBeforeRequest.addListener(
      (details) => {
        const target = toShReddit(details.url);
        return target ? { redirectUrl: target } : {};
      },
      { urls: ['*://www.reddit.com/*', '*://new.reddit.com/*', '*://old.reddit.com/*'] },
      ['blocking'],
    );
  }
});
