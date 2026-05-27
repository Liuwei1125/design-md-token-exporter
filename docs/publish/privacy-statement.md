# Privacy Policy for Design.md Token Exporter

Effective Date: May 27, 2026

## Product

Design.md Token Exporter is a local-first Chrome extension that extracts design tokens from the current webpage after the user explicitly starts analysis.

## Data Collection

Design.md Token Exporter does not collect, sell, share, or transmit personal data to the developer or any third party.

The extension does not collect browsing history, does not track websites in the background, does not scan pages automatically, and does not run continuous page monitoring.

## Page Analysis

Page analysis runs only after the user clicks an analysis control in the extension UI.

For that user-triggered action, the extension uses Chrome's `activeTab` and `scripting` permissions to run a bundled local analyzer on the currently active page.

The extension does not upload page HTML, CSS, DOM contents, screenshots, browsing history, or extracted design data to any server.

## Local Storage

The extension uses Chrome local storage to save the last extraction result, user token corrections, and local workspace preferences.

This data stays in the user's browser profile unless the user exports, copies, or otherwise shares it.

Users can remove locally stored extension data by clearing the extension's browser storage or uninstalling the extension.

## Network And AI

The current version does not make default network requests and does not call AI, model, analytics, tracking, or telemetry APIs.

Generated exports, including DESIGN.md, CSS variables, Tailwind config snippets, and tokens.json, are produced locally in the browser.

## Downloads And Exports

Downloads are created with browser Blob URLs and temporary `<a download>` links.

The extension does not request the Chrome `downloads` permission.

## Permissions

Design.md Token Exporter uses only these Chrome extension permissions:

- `activeTab`: access the current tab only after the user starts analysis.
- `scripting`: inject the bundled local analyzer after user action.
- `storage`: save local extraction results, corrections, and preferences.
- `sidePanel`: open the main workspace in Chrome's Side Panel.

The extension does not request `<all_urls>` host access and does not request `webRequest`, `cookies`, `history`, `downloads`, or broad `tabs` permissions.

## Contact

For privacy questions or support, please use the GitHub repository:

https://github.com/Liuwei1125/design-md-token-exporter