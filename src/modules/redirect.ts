/**
 * Redirects www/new/old.reddit.com -> sh.reddit.com, preserving path + query.
 *
 * Loop guard (logged-out Reddit 301s sh->www server-side, which would ping-pong
 * with our rule): DNR rules are only armed after the content script reports a
 * successful sh.reddit.com load this session (storage.session `shVisitSeen`),
 * and are disarmed for the rest of the session if Chrome reports
 * ERR_TOO_MANY_REDIRECTS on a Reddit main-frame navigation.
 */

const OTHER_HOSTS = ['www.reddit.com', 'new.reddit.com', 'old.reddit.com'];

export function toShReddit(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (!OTHER_HOSTS.includes(u.hostname)) return null;
    u.hostname = 'sh.reddit.com';
    u.protocol = 'https:';
    return u.toString();
  } catch {
    return null;
  }
}

/** Minimal shapes of the declarativeNetRequest API we use. */
interface DnrAction {
  type: 'redirect';
  redirect: { transform: { host: string; scheme: string } };
}
export interface DnrRule {
  id: number;
  priority: number;
  action: DnrAction;
  condition: { requestDomains: string[]; resourceTypes: string[] };
}

export const DNR_RULE_IDS = [1001, 1002, 1003];

/** DNR rule specs for redirecting all non-sh Reddit hosts to sh.reddit.com. */
export function dnrRules(ruleIds: number[]): DnrRule[] {
  return OTHER_HOSTS.map((host, i) => ({
    id: ruleIds[i],
    priority: 1,
    action: {
      type: 'redirect',
      redirect: { transform: { host: 'sh.reddit.com', scheme: 'https' } },
    },
    condition: { requestDomains: [host], resourceTypes: ['main_frame'] },
  }));
}

export const LOOP_ERROR = 'net::ERR_TOO_MANY_REDIRECTS';
