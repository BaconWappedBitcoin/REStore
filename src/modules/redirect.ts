/**
 * Redirects www/new/old.reddit.com -> sh.reddit.com, preserving path + query.
 *
 * - Chrome: declarativeNetRequest dynamic rules (registered in background.ts).
 * - Firefox: webRequestBlocking listener (registered in background.ts),
 *   used when DNR is unavailable.
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
interface DnrTransform {
  host: string;
  scheme: string;
}
interface DnrAction {
  type: 'redirect';
  transform: DnrTransform;
}
interface DnrCondition {
  requestDomains: string[];
  resourceTypes: string[];
}
export interface DnrRule {
  id: number;
  priority: number;
  action: DnrAction;
  condition: DnrCondition;
}

/** DNR rule specs for redirecting all non-sh Reddit hosts to sh.reddit.com. */
export function dnrRules(ruleIds: number[]): DnrRule[] {
  return OTHER_HOSTS.map((host, i) => ({
    id: ruleIds[i],
    priority: 1,
    action: { type: 'redirect', transform: { host: 'sh.reddit.com', scheme: 'https' } },
    condition: { requestDomains: [host], resourceTypes: ['main_frame'] },
  }));
}
