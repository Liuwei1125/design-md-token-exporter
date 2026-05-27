# Privacy Statement Draft

## Product

Design.md Token Exporter is a local-first Chrome extension that extracts design tokens from the current webpage after the user explicitly starts analysis.

## Data Collection

The MVP does not collect, sell, or share personal data.

The extension does not collect browsing history. It does not scan pages automatically, does not track websites in the background, and does not run continuous page monitoring.

## Page Analysis

Page analysis runs only after the user clicks an analysis control in the extension UI. The analyzer reads the currently active page through Chrome's `activeTab` and `scripting` capabilities for that user-triggered action.

The MVP does not upload page HTML, CSS, DOM contents, screenshots, browsing history, or extracted design data to any server.

## Local Storage

The extension uses Chrome local storage to save the last extraction result, user token corrections, and local workspace preferences. This data stays in the user's browser profile unless the user exports or copies it.

## Network And AI

The MVP does not make default network requests and does not call AI or model APIs.

Generated exports, including DESIGN.md, CSS variables, Tailwind config snippets, and tokens.json, are produced locally in the browser.

## Downloads And Exports

Downloads are created with browser Blob URLs and temporary `<a download>` links. The extension does not request the Chrome `downloads` permission.

## Permissions

Design.md Token Exporter uses only these Chrome extension permissions:

- `activeTab`: access the current tab only after the user starts analysis.
- `scripting`: inject the bundled local analyzer after user action.
- `storage`: save local extraction results, corrections, and preferences.
- `sidePanel`: open the main workspace in Chrome's Side Panel.

The extension does not request `<all_urls>` host access and does not request `webRequest`, `cookies`, `history`, `downloads`, or broad `tabs` permissions.

## Future Features

Any future AI enhancement must be opt-in, disclose what data would be sent, and must not send full page HTML, CSS, DOM, screenshots, or browsing history by default.
