# REStore Feature Map (from Reddit Enhancement Suite)

Source: complete module inventory of [honestbleeps/Reddit-Enhancement-Suite](https://github.com/honestbleeps/Reddit-Enhancement-Suite) (`lib/modules/`, 88 modules).
RES is in maintenance-only mode and targets old Reddit only; this map ports the *concepts* to sh.reddit.com's custom-element DOM.

Legend: ✅ built · 🎯 planned · 🤷 shreddit already does this natively · ❌ not applicable

## Phase 1 — Browsing core (next up)

| RES module | What it does | REStore plan |
|---|---|---|
| `neverEndingReddit` | Infinite scroll on listings | 🎯 shreddit auto-loads; verify + style the loader |
| `keyboardNav` + `selectedEntry` | j/k post nav, vote/comment/open hotkeys, selection highlight | 🎯 high value; custom elements make targeting easy |
| `wheelBrowse` | Scroll wheel moves selection | 🎯 small add-on to keyboardNav |
| `pageNavigator` | Floating jump-to-top/bottom | 🎯 trivial CSS + JS |
| `subredditManager` | Customizable subreddit shortcut bar | 🎯 replaces shreddit's bar in classic style |
| `filteReddit` | Hide posts by subreddit/domain/keyword/flair/score/NSFW | 🎯 **flagship**; reads `shreddit-post` attributes (`author`, `score`, etc.) + `data-post-id`; runs in a MutationObserver against infinite scroll |
| `autoHide` | Auto-hide visited/voted posts | 🎯 pairs with filteReddit |
| `readComments` | Fade already-read comments | 🎯 storage-backed seen-thread set |
| `xPostLinks` | Linkify "x-posted from /r/x" | 🎯 tiny text transformer |
| `disableChat` | Remove chat | ✅ done (clutter module) |

## Phase 2 — Comments

| RES module | What it does | REStore plan |
|---|---|---|
| `commentHidePersistor` | Remember collapsed threads | 🎯 storage + observer |
| `commentQuickCollapse` | Collapse via thread line click | 🎯 style `shreddit-comment` left border as click target |
| `hideChildComments` | "Hide all child comments" | 🎯 |
| `newCommentCount` | Show new-comment counts on revisits | 🎯 nice-to-have |
| `showParent` | Hover popup of parent chain | 🎯 |
| `userHighlight` | Color OP/mods/friends/self | 🎯 attribute-driven (`author`, OP = post author) |
| `commentNavigator` | Jump between OP/mod/gilded comments | 🎯 after Phase 1 |
| `commentPreview` / `commentTools` | Live markdown preview, editor toolbar, macros | 🤷 shreddit has a native editor; add macros later (🎯) |
| `spoilerTags` | Blur-hover spoilers | 🤷 native markdown spoilers exist |
| `tableTools` | Sort/filter markdown tables | 🎯 low priority |
| `sourceSnudown` | View raw markdown | ❌ needs API calls; later |

## Phase 3 — Media & user info

| RES module | What it does | REStore plan |
|---|---|---|
| `showImages` | Inline expand images/gifs/videos/albums | 🤷 shreddit expands media natively; 🎯 add "expand all" toggle + classic sizing |
| `subredditInfo` | Hover card w/ subscribe button | 🎯 |
| `userInfo` / `redditUserInfo` | Hover card w/ karma, tag controls | 🎯 pairs with userTagger; needs JSON API fetch |
| `userTagger` | Colored tags + vote history per user | 🎯 storage-backed; the killer RES social feature |
| `localDate` | Local time format on timestamps | 🎯 |
| `subRedditTagger` | Colored [subreddit] tags in titles | 🎯 pairs with userHighlight palette |

## Phase 4 — Appearance & account

| RES module | What it does | REStore plan |
|---|---|---|
| `nightMode` | Dark theme | ✅ partially (palette is classic light); 🎯 add a dark classic palette toggle |
| `styleTweaks` | Granular UI toggles | ✅ our options page is this; keep growing it |
| `voteEnhancements` | Score display tweaks | 🎯 score is an attribute on posts — easy |
| `customToggles` | User-defined toggles | ❌ overkill for v1 scope |
| `accountSwitcher` | Quick account switching | 🤷 Chrome profiles; ❌ skip (storing credentials is a liability) |
| `usernameHider` | Hide own name (screenshots) | 🎯 trivial, popular |
| `orangered` / `messageMenu` | Mail notifications + menu | 🎯 after keyboardNav |
| `commandLine` | Ctrl+Shift+X command bar | 🎯 fun, late phase |
| `dashboard` | RES home widgets page | ❌ out of scope for now |
| `searchHelper` / `search` | Search enhancements | 🤷 shreddit search OK; ❌ low value |
| `presets` / `backupAndRestore` | Share/backup settings | 🎯 export/import JSON of our toggles |
| `noParticipation` | Read-only mode for linked threads | 🎯 nice privacy add |
| `quickMessage` | Hotkey to PM | ❌ low value |
| `singleClick` | Open many links in tabs | ❌ low value |
| `submitHelper`, `logoLink`, `betteReddit`, `quarantineHide`, `profileRedirect`, `multiredditNavbar`, `profileNavigator`, `context`, `commentDepth`, `commentSortBy`, `stylesheet`, `subredditStyleToggle`, `showKarma`, `userbarHider`, `temporaryDropdownLinks` | Old-Reddit-DOM-specific fixes | ❌ mostly obsolete — shreddit solves these natively or they have no shreddit equivalent need |

## Architecture notes

- Every feature above is a new file in `src/modules/` + a toggle in `Toggles`, mirroring RES's module registry. CSS-only features stay in `src/reskin/`.
- `filteReddit`, `userTagger`, `readComments`, `autoHide` need a shared `MutationObserver` watching `shreddit-feed` for new articles (shreddit infinite-scrolls).
- Post metadata comes free from attributes: `author`, `score`, `comment-count`, `data-post-id` on/inside `shreddit-post` — no API needed for filtering and tagging.
- Hover cards (userInfo/subredditInfo) are the only features requiring `fetch` against reddit's `.json` endpoints.
