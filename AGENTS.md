# AGENTS.md

This repository is a rewrite of a previous Chrome extension prototype.

## Source of Truth

- Product and architecture source of truth: `docs/handoff.md`
- Previous prototype is reference-only: `references/old-prototype`
- Do not modify files under `references/old-prototype`

## Core MVP Rules

- Build with WXT + React + TypeScript + Tailwind CSS.
- Use Manifest V3 only.
- Allowed permissions only: `activeTab`, `scripting`, `storage`, `sidePanel`.
- Do not request `<all_urls>`.
- Do not use `webRequest`, `cookies`, `history`, `downloads`, or broad `tabs` permissions.
- Do not implement AI calls in MVP.
- Do not upload page HTML, CSS, DOM, screenshots, or browsing history.
- Do not use remote hosted code, remote dynamic imports, `eval`, `new Function`, or Tailwind CDN.
- Analyze the current page only after explicit user action.
- Do not automatically scan pages.
- Do not use MutationObserver-based continuous analysis in MVP.

## Chrome Extension Review Constraints

- Keep permissions minimal.
- Keep all executable code bundled with the extension.
- No remote scripts.
- No AI or model API calls in MVP.
- No default network requests.
- No hidden data collection.
- Use `chrome.scripting.executeScript` only after user action.
- If downloading files, use Blob + temporary `<a download>`; do not request the `downloads` permission.

## Old Prototype Reuse

The old prototype may be studied only for algorithm ideas and tests.

Useful reference modules:

- `references/old-prototype/src/shared/colorUtils.ts`
- `references/old-prototype/src/shared/cssVariableExtractor.ts`
- `references/old-prototype/src/shared/observedTokenExtractor.ts`
- `references/old-prototype/src/shared/semanticRoleInferencer.ts`
- `references/old-prototype/src/shared/colorSanity.ts`
- `references/old-prototype/src/shared/designQualityReport.ts`
- `references/old-prototype/src/shared/contentCollector.ts`

Reuse the ideas, not the old architecture.

Especially useful prototype ideas:

- Evidence-based token inference.
- Semantic color role inference.
- Chinese and English action intent detection.
- Gradient CTA color extraction.
- Brand/logo evidence detection.
- Color sanity checks.
- Design quality report concepts.
- Existing rule tests.

## Development Rules

- One Codex task should implement only one milestone.
- Do not implement future roadmap items unless explicitly requested.
- Keep DOM/chrome APIs isolated from pure inference modules.
- Add or update tests for extraction logic.
- Run build/typecheck/test before finishing when available.
- At the end of every task, create a progress summary under `docs/progress/`.
- Do not proceed to the next milestone unless the current task is complete and summarized.

## Required End-of-Task Summary

Each task must create:

`docs/progress/Txx-summary.md`

Use this structure:

```md
# Txx Summary

## Goal

## Completed

## Files Changed

## Commands Run

## Verification Result

## Known Issues

## Next Recommended Task

## Do Not Forget
```

## Do Not Forget

- Popup is only a lightweight entry.
- Side Panel is the main workspace.
- Content analyzer must be user-triggered only.
- MVP has no AI.
- MVP has no overlay element picker.
- MVP has no multi-page merge.
- MVP has no Figma sync.
- MVP has no cloud sync.
