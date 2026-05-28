import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(sourceDir, '../../..');
const outDir = resolve(rootDir, 'store-assets/chrome-store');
const screenshotDir = resolve(outDir, 'screenshots');
const svgDir = resolve(sourceDir, 'svg-real');

mkdirSync(screenshotDir, { recursive: true });
mkdirSync(svgDir, { recursive: true });

const real = {
  apple: dataUri(resolve(sourceDir, 'real/apple-popup.png')),
  airbnb: dataUri(resolve(sourceDir, 'real/airbnb-overview.png')),
  nvidia: dataUri(resolve(sourceDir, 'real/nvidia-tokens.png')),
  stripe: dataUri(resolve(sourceDir, 'real/stripe-export.png')),
  stitch: dataUri(resolve(sourceDir, 'real/stitch-design-md.png')),
};

const slides = [
  {
    file: '01-analyze-current-page',
    image: real.apple,
    title: 'Analyze the current page',
    subtitle: 'Open the popup, click Analyze, and get a fast token summary from the active tab.',
  },
  {
    file: '02-overview-workbench',
    image: real.airbnb,
    title: 'Review the extracted design system',
    subtitle: 'The side panel highlights detected system signals, evidence, typography, and key tokens.',
  },
  {
    file: '03-token-palette',
    image: real.nvidia,
    title: 'Inspect colors, typography, and spacing',
    subtitle: 'Use the Tokens view to inspect local, evidence-backed values before exporting.',
  },
  {
    file: '04-export-design-md',
    image: real.stripe,
    title: 'Export DESIGN.md and developer artifacts',
    subtitle: 'Copy or download DESIGN.md, CSS variables, Tailwind config, and tokens.json locally.',
  },
  {
    file: '05-design-md-context',
    image: real.stitch,
    title: 'Built for DESIGN.md workflows',
    subtitle: 'Create a readable design-system handoff for humans, coding agents, and frontend implementation.',
  },
];

for (const slide of slides) {
  renderSvg(
    resolve(svgDir, `${slide.file}.svg`),
    resolve(screenshotDir, `${slide.file}.png`),
    slideSvg(slide),
  );
}

writeFileSync(
  resolve(outDir, 'screenshots/README.md'),
  `# Chrome Web Store Screenshots

These screenshots are 1280x800 PNG files prepared for Chrome Web Store upload.

Recommended upload order:

1. 01-analyze-current-page.png
2. 02-overview-workbench.png
3. 03-token-palette.png
4. 04-export-design-md.png
5. 05-design-md-context.png

The example websites shown are used only as analysis contexts. Design.md Token Exporter is not affiliated with or endorsed by Apple, Airbnb, NVIDIA, Stripe, Google, or Stitch.
`,
);

function renderSvg(svgPath, pngPath, svg) {
  writeFileSync(svgPath, svg);
  execFileSync('rsvg-convert', ['-w', '1280', '-h', '800', svgPath, '-o', pngPath]);
}

function dataUri(path) {
  return `data:image/png;base64,${readFileSync(path).toString('base64')}`;
}

function slideSvg({ image, title, subtitle }) {
  return `<svg width="1280" height="800" viewBox="0 0 1280 800" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title{font:800 34px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;fill:#0F172A;letter-spacing:0}
    .subtitle{font:600 18px/1.35 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;color:#475569;letter-spacing:0}
    .brand{font:900 15px Inter, ui-sans-serif, system-ui;fill:#2563EB;letter-spacing:1.8px}
    .note{font:500 11px Inter, ui-sans-serif, system-ui;fill:#94A3B8;letter-spacing:0}
  </style>
  <defs>
    <filter id="shadow" x="20" y="78" width="1240" height="694" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0F172A" flood-opacity="0.16"/>
    </filter>
    <clipPath id="shotClip">
      <rect x="54" y="118" width="1172" height="660" rx="22"/>
    </clipPath>
  </defs>
  <rect width="1280" height="800" fill="#F8FAFC"/>
  <path d="M0 112H1280M0 724H1280M160 0V800M320 0V800M480 0V800M640 0V800M800 0V800M960 0V800M1120 0V800" stroke="#E2E8F0" stroke-width="1"/>
  <circle cx="1132" cy="62" r="190" fill="#DBEAFE" opacity="0.72"/>
  <circle cx="112" cy="744" r="190" fill="#CCFBF1" opacity="0.72"/>
  <text x="54" y="50" class="brand">DESIGN.MD TOKEN EXPORTER</text>
  <text x="54" y="76" class="title">${escapeXml(title)}</text>
  <foreignObject x="56" y="88" width="780" height="48">
    <div xmlns="http://www.w3.org/1999/xhtml" class="subtitle">${escapeXml(subtitle)}</div>
  </foreignObject>
  <g filter="url(#shadow)">
    <rect x="54" y="118" width="1172" height="660" rx="22" fill="#FFFFFF"/>
    <image href="${image}" x="54" y="118" width="1172" height="660" preserveAspectRatio="xMidYMid meet" clip-path="url(#shotClip)"/>
  </g>
  <text x="54" y="792" class="note">Example websites shown for context only. Not affiliated with or endorsed by the companies shown.</text>
</svg>`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
