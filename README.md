# Design.md Token Exporter

<p align="center">
  <a href="README.md"><strong>English</strong></a>
  ·
  <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <img alt="Version 0.1.0" src="https://img.shields.io/badge/version-0.1.0-dc2626?style=for-the-badge">
  <img alt="Tests passing" src="https://img.shields.io/badge/tests-passing-22c55e?style=for-the-badge">
  <img alt="License MIT" src="https://img.shields.io/badge/license-MIT-0ea5e9?style=for-the-badge">
  <img alt="Manifest V3" src="https://img.shields.io/badge/manifest-MV3-475569?style=for-the-badge">
</p>

Local-first Chrome extension for extracting design tokens from the current webpage and exporting AI-friendly design artifacts.

Design.md Token Exporter analyzes the active tab only after an explicit user action, keeps extraction data in the browser, and generates `DESIGN.md`, CSS variables, Tailwind config snippets, and `tokens.json` for frontend implementation workflows.

## Features

- User-triggered current-page analysis.
- Side Panel workspace for reviewing extracted design tokens.
- Local extraction for colors, typography, spacing, radius, shadows, and basic component styles.
- Optional token correction controls stored locally.
- Export actions for:
  - `DESIGN.md`
  - CSS Variables
  - Tailwind Config
  - `tokens.json`
- Manifest V3 with minimal permissions.
- No AI calls in the MVP.
- No default network requests.

## Privacy And Permissions

The MVP is local-first:

- It does not collect browsing history.
- It does not upload page HTML, CSS, DOM, screenshots, browsing history, or extracted design data.
- It does not call AI or model APIs.
- It does not request `<all_urls>`.
- It does not request `webRequest`, `cookies`, `history`, `downloads`, or broad `tabs` permissions.

Requested Chrome permissions:

- `activeTab`: temporarily access the current tab after the user starts analysis.
- `scripting`: inject the bundled local analyzer after user action.
- `storage`: store the last local extraction result, user corrections, and workspace preferences.
- `sidePanel`: provide the main review and export workspace.

See [privacy statement](docs/publish/privacy-statement.md) for the submission draft.

## Development

Requirements:

- Node.js compatible with the current WXT/Vite toolchain.
- pnpm.

Install dependencies:

```bash
pnpm install
```

Start the WXT development server:

```bash
pnpm dev
```

Run checks:

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Release Package

Run the full release check:

```bash
pnpm release:check
```

Create the Chrome MV3 upload zip:

```bash
pnpm release:zip
```

The zip is written to:

```txt
.output/design-md-token-exporter-0.1.0-chrome-mv3.zip
```

Before uploading to the Chrome Web Store, verify the zip contains `manifest.json` at the root:

```bash
unzip -l .output/design-md-token-exporter-0.1.0-chrome-mv3.zip | head
```

## Chrome Web Store Status

Chrome Web Store listing materials are being prepared under [docs/publish](docs/publish).

## Repository Notes

The old prototype under `references/old-prototype` is reference-only. Its source is ignored for public repository publishing unless explicitly reviewed for licensing and privacy.

## License

MIT
