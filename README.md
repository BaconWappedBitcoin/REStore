# REStore

**RE**Store brings the old Reddit look to **sh.reddit.com** — and keeps you there. It never runs on (or sends you to) `www.reddit.com`.

## Features

- **Old-Reddit reskin**: classic palette (#cee3f8 header bar, blue/visited-purple links), centered fixed-width layout, compact post rows, threaded comments with indent lines.
- **sh.reddit.com only**: any `www.reddit.com`, `new.reddit.com`, or `old.reddit.com` URL is redirected to `sh.reddit.com` (toggleable).
- **Clutter hiding**: promoted posts, upsell banners, and the chat widget are removed.
- **Live toggles**: every feature can be switched on/off in the options page and applies to open tabs instantly.

## Install (development)

```bash
npm install
npm run build          # Chrome build -> .output/chrome-mv3
npm run build:firefox  # Firefox build -> .output/firefox-mv2
```

- **Chrome**: visit `chrome://extensions`, enable Developer mode, "Load unpacked", pick `REStore/.output/chrome-mv3`.
- **Firefox**: visit `about:debugging#/runtime/this-firefox`, "Load Temporary Add-on", pick the manifest in `REStore/.output/firefox-mv2`.

## Roadmap

- Infinite scroll (RES "never ending reddit")
- Keyboard navigation (j/k next/prev post, etc.)
- User hover info panels

## Security

- Code scanned with Mimosa (deep, static): **0 findings** in extension source.
- `npm audit` reports advisories in WXT's **dev-only** dependency chain (`web-ext-run`, `node-notifier`, `uuid`, `tmp`, `firefox-profile`). None of these packages are bundled into the extension — the shipped build (`dist` output) contains only REStore's own code and CSS. Do not run `npm audit fix --force`; it breaks WXT.

## License

[MIT](./LICENSE)
