# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0 - 2026-05-27

### Added

- Manifest V3 Chrome extension built with WXT, React, TypeScript, and Tailwind CSS.
- Popup entry point for user-triggered current-page analysis.
- Side Panel workspace with Overview, Tokens, and Export tabs.
- Local rule-based extraction for design colors, typography, spacing, radius, shadows, and basic component styles.
- Editable local token corrections.
- Exports for `DESIGN.md`, CSS variables, Tailwind config snippets, and `tokens.json`.
- Local Blob-based downloads without the Chrome `downloads` permission.
- Publish readiness docs for privacy, store listing, and release checks.

### Security

- No AI calls in the MVP.
- No default network requests.
- No remote hosted executable code.
- No `<all_urls>` permission.
- No `webRequest`, `cookies`, `history`, `downloads`, or broad `tabs` permissions.
