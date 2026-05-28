import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(sourceDir, '../../..');
const outDir = resolve(rootDir, 'store-assets/chrome-store');
const screenshotDir = resolve(outDir, 'screenshots');
const promoDir = resolve(outDir, 'promo');
const svgDir = resolve(sourceDir, 'svg');

mkdirSync(screenshotDir, { recursive: true });
mkdirSync(promoDir, { recursive: true });
mkdirSync(svgDir, { recursive: true });

const iconHref = dataUri(resolve(rootDir, 'public/icon/icon-256.png'));
const webshots = {
  apple: dataUri(resolve(sourceDir, 'webshots/apple.png')),
  airbnb: dataUri(resolve(sourceDir, 'webshots/airbnb.png')),
  nvidia: dataUri(resolve(sourceDir, 'webshots/nvidia.png')),
  stripe: dataUri(resolve(sourceDir, 'webshots/stripe.png')),
};

const slides = [
  {
    file: '01-overview',
    website: 'apple',
    eyebrow: 'DESIGN.MD TOKEN EXPORTER',
    titleLines: ['Extract design tokens', 'from any page'],
    subtitle: 'Turn the current website into clean DESIGN.md artifacts for implementation handoff.',
    badge: 'Apple page example',
    panel: overviewPanel(),
  },
  {
    file: '02-analyze-popup',
    website: 'stripe',
    eyebrow: 'STEP 1',
    titleLines: ['Click Analyze', 'on the current page'],
    subtitle: 'The extension reads the active tab only after explicit user action.',
    badge: 'Stripe page example',
    panel: popupPanel(),
  },
  {
    file: '03-side-panel',
    website: 'airbnb',
    eyebrow: 'WORKSPACE',
    titleLines: ['Review tokens', 'in the side panel'],
    subtitle: 'Inspect colors, typography, spacing, radius, shadows, and component signals before export.',
    badge: 'Airbnb page example',
    panel: sidePanel(),
  },
  {
    file: '04-export-formats',
    website: 'nvidia',
    eyebrow: 'EXPORTS',
    titleLines: ['Export DESIGN.md', 'CSS, Tailwind, JSON'],
    subtitle: 'Generate practical artifacts for coding agents, design audits, and frontend implementation.',
    badge: 'NVIDIA page example',
    panel: exportPanel(),
  },
  {
    file: '05-local-first',
    website: 'stripe',
    eyebrow: 'PRIVACY BY DEFAULT',
    titleLines: ['Local-first.', 'No AI calls.'],
    subtitle: 'No default network requests, no remote code, and no page screenshots or browsing history uploads.',
    badge: 'MVP privacy posture',
    panel: privacyPanel(),
  },
];

for (const slide of slides) {
  renderSvg(
    resolve(svgDir, `${slide.file}.svg`),
    resolve(screenshotDir, `${slide.file}.png`),
    screenshotSvg(slide),
    1280,
    800,
  );
}

renderSvg(
  resolve(svgDir, 'small-promo-440x280.svg'),
  resolve(promoDir, 'small-promo-440x280.png'),
  smallPromoSvg(),
  440,
  280,
);

renderSvg(
  resolve(svgDir, 'marquee-1400x560.svg'),
  resolve(promoDir, 'marquee-1400x560.png'),
  marqueeSvg(),
  1400,
  560,
);

writeFileSync(
  resolve(outDir, 'README.md'),
  `# Chrome Web Store Assets

Generated assets for Design.md Token Exporter.

## Upload Files

- Screenshots: \`screenshots/*.png\` at 1280x800
- Small promotional image: \`promo/small-promo-440x280.png\`
- Marquee promotional image: \`promo/marquee-1400x560.png\`
- Extension icon: \`../../public/icon/icon-128.png\`

## Notes

- Apple, Airbnb, NVIDIA, and Stripe pages are used only as example website contexts.
- This extension is not affiliated with or endorsed by those companies.
- Do not add AI, cloud sync, automatic scanning, or Figma sync claims unless those features exist.

## Regenerate

\`\`\`bash
node store-assets/chrome-store/source/generate-store-assets.mjs
\`\`\`
`,
);

function renderSvg(svgPath, pngPath, svg, width, height) {
  writeFileSync(svgPath, svg);
  execFileSync('rsvg-convert', ['-w', String(width), '-h', String(height), svgPath, '-o', pngPath]);
}

function dataUri(path) {
  const bytes = readFileSync(path);
  return `data:image/png;base64,${bytes.toString('base64')}`;
}

function screenshotSvg({ website, eyebrow, titleLines, subtitle, badge, panel }) {
  const shot = webshots[website];
  return svgShell(1280, 800, `
    <rect width="1280" height="800" fill="#F8FAFC"/>
    ${noiseGrid()}
    <circle cx="1110" cy="110" r="220" fill="#DBEAFE" opacity="0.8"/>
    <circle cx="90" cy="720" r="260" fill="#CCFBF1" opacity="0.7"/>
    <g filter="url(#softShadow)">
      <rect x="54" y="78" width="1172" height="644" rx="34" fill="#0F172A"/>
    </g>
    <rect x="54" y="78" width="1172" height="644" rx="34" fill="url(#darkBg)"/>
    <g transform="translate(96 116)">
      ${brandMark(0, 0, 50)}
      <text x="66" y="22" class="overline">${escapeXml(eyebrow)}</text>
      <text x="66" y="57" class="smallMuted">${escapeXml(badge)}</text>
      ${heroLines(titleLines, 0, 138)}
      <foreignObject x="0" y="${titleLines.length > 1 ? 236 : 166}" width="388" height="118">
        <div xmlns="http://www.w3.org/1999/xhtml" class="subtitle">${escapeXml(subtitle)}</div>
      </foreignObject>
      ${featurePills(0, 406, 'dark')}
    </g>
    <g transform="translate(520 138)">
      ${browserFrame(shot, 0, 0, 606, 398)}
      <g transform="translate(286 62)">
        ${panel}
      </g>
    </g>
    <text x="96" y="682" class="disclaimer">Example sites shown for context only. Not affiliated with or endorsed by Apple, Airbnb, NVIDIA, or Stripe.</text>
  `);
}

function smallPromoSvg() {
  return svgShell(440, 280, `
    <rect width="440" height="280" rx="0" fill="#F8FAFC"/>
    ${noiseGrid(0.28)}
    <circle cx="390" cy="48" r="116" fill="#DBEAFE"/>
    <circle cx="54" cy="246" r="120" fill="#CCFBF1"/>
    <g transform="translate(36 42)">
      <image href="${iconHref}" x="0" y="0" width="92" height="92"/>
      <text x="116" y="38" class="promoTitle">Design.md</text>
      <text x="116" y="74" class="promoTitle">Token Exporter</text>
      <text x="116" y="108" class="promoBody">Extract tokens locally.</text>
      <g transform="translate(0 150)">
        ${miniToken(0, '#14B8A6', 'colors')}
        ${miniToken(116, '#2563EB', 'typography')}
        ${miniToken(250, '#8B5CF6', 'exports')}
      </g>
    </g>
  `);
}

function marqueeSvg() {
  return svgShell(1400, 560, `
    <rect width="1400" height="560" fill="#F8FAFC"/>
    ${noiseGrid(0.3)}
    <circle cx="1260" cy="72" r="240" fill="#DBEAFE"/>
    <circle cx="114" cy="500" r="260" fill="#CCFBF1"/>
    <g transform="translate(86 86)">
      <image href="${iconHref}" x="0" y="0" width="112" height="112"/>
      <text x="0" y="178" class="marqueeTitle">Design.md</text>
      <text x="0" y="236" class="marqueeTitle">Token Exporter</text>
      <foreignObject x="0" y="266" width="510" height="92">
        <div xmlns="http://www.w3.org/1999/xhtml" class="marqueeSubtitle">Extract design tokens from the current page and export clean DESIGN.md artifacts.</div>
      </foreignObject>
      <g transform="translate(0 390)">
        ${featurePills(0, 0, 'light')}
      </g>
    </g>
    <g transform="translate(690 72)">
      ${browserFrame(webshots.stripe, 0, 0, 600, 394)}
      <g transform="translate(306 58)">
        ${sidePanel(0.86)}
      </g>
    </g>
  `);
}

function browserFrame(href, x, y, width, height) {
  const chromeH = 34;
  const contentH = height - chromeH;
  return `
    <g filter="url(#panelShadow)">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="18" fill="#FFFFFF"/>
      <rect x="${x}" y="${y}" width="${width}" height="${chromeH}" rx="18" fill="#EEF2F7"/>
      <circle cx="${x + 22}" cy="${y + 17}" r="5" fill="#EF4444"/>
      <circle cx="${x + 40}" cy="${y + 17}" r="5" fill="#F59E0B"/>
      <circle cx="${x + 58}" cy="${y + 17}" r="5" fill="#22C55E"/>
      <rect x="${x + 84}" y="${y + 8}" width="${width - 142}" height="18" rx="9" fill="#FFFFFF"/>
      <text x="${x + 102}" y="${y + 21}" class="urlText">https://example.com</text>
      <clipPath id="clip${Math.round(x + width + height)}">
        <rect x="${x}" y="${y + chromeH}" width="${width}" height="${contentH}" rx="0"/>
      </clipPath>
      <image href="${href}" x="${x}" y="${y + chromeH}" width="${width}" height="${contentH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip${Math.round(x + width + height)})"/>
    </g>
  `;
}

function overviewPanel() {
  return panelChrome(328, 398, `
    <text x="28" y="76" class="panelTitle">Extracted tokens</text>
    ${colorRow(28, 110)}
    ${metricCard(28, 174, 'Typography', '12 font signals')}
    ${metricCard(176, 174, 'Spacing', '8 scale values')}
    ${metricCard(28, 254, 'Radius', '6 candidates')}
    ${metricCard(176, 254, 'Shadows', '4 elevations')}
  `);
}

function popupPanel() {
  return panelChrome(336, 326, `
    <g transform="translate(28 48)">
      <image href="${iconHref}" x="0" y="0" width="56" height="56"/>
      <text x="72" y="24" class="panelTitle">Design.md Token Exporter</text>
      <circle cx="78" cy="48" r="8" fill="#10B981"/>
      <text x="94" y="54" class="muted">Ready for local extraction</text>
      <rect x="0" y="104" width="128" height="54" rx="16" fill="#2563EB"/>
      <text x="34" y="139" class="buttonText">Analyze</text>
      <rect x="144" y="104" width="90" height="54" rx="16" fill="#FFFFFF" stroke="#CBD5E1"/>
      <text x="168" y="139" class="darkButtonText">Panel</text>
      <rect x="0" y="202" width="280" height="72" rx="18" fill="#F8FAFC" stroke="#E2E8F0"/>
      <text x="20" y="234" class="metricText">User-triggered analysis</text>
      <text x="20" y="258" class="muted">activeTab + scripting only</text>
    </g>
  `);
}

function sidePanel(scale = 1) {
  return `<g transform="scale(${scale})">${panelChrome(352, 418, `
    <text x="28" y="62" class="panelTitle">Side panel workspace</text>
    <rect x="28" y="92" width="296" height="40" rx="14" fill="#EEF2FF"/>
    <text x="48" y="117" class="tabText">Overview</text>
    <text x="142" y="117" class="tabTextMuted">Tokens</text>
    <text x="226" y="117" class="tabTextMuted">Export</text>
    <text x="28" y="168" class="sectionTitle">Colors</text>
    ${colorRow(28, 188)}
    <text x="28" y="260" class="sectionTitle">Typography</text>
    ${metricCard(28, 282, 'Heading', '32 / 40 / 700')}
    ${metricCard(176, 282, 'Body', '16 / 24 / 400')}
    <text x="28" y="366" class="sectionTitle">Spacing scale</text>
    <rect x="28" y="382" width="48" height="12" rx="6" fill="#BFDBFE"/>
    <rect x="90" y="382" width="82" height="12" rx="6" fill="#60A5FA"/>
    <rect x="186" y="382" width="126" height="12" rx="6" fill="#2563EB"/>
  `)}</g>`;
}

function exportPanel() {
  return panelChrome(372, 414, `
    <text x="28" y="62" class="panelTitle">Export artifacts</text>
    ${exportItem(28, 94, 'DESIGN.md', 'Markdown for coding agents')}
    ${exportItem(28, 158, 'CSS Variables', ':root token variables')}
    ${exportItem(28, 222, 'Tailwind Config', 'theme extension snippet')}
    ${exportItem(28, 286, 'tokens.json', 'portable token data')}
    <rect x="28" y="354" width="316" height="34" rx="12" fill="#DCFCE7"/>
    <text x="48" y="376" class="successText">Copy or download locally</text>
  `);
}

function privacyPanel() {
  return panelChrome(390, 406, `
    <text x="28" y="64" class="panelTitle">Built for store review</text>
    ${checkItem(28, 100, 'No remote hosted code')}
    ${checkItem(28, 146, 'No AI or model API calls')}
    ${checkItem(28, 192, 'No default network requests')}
    ${checkItem(28, 238, 'No page screenshots uploaded')}
    ${checkItem(28, 284, 'Minimal MV3 permissions')}
    <rect x="28" y="332" width="334" height="46" rx="14" fill="#EFF6FF"/>
    <text x="48" y="362" class="privacyText">Analyze only after user action</text>
  `);
}

function panelChrome(width, height, content) {
  return `
    <g filter="url(#panelShadow)">
      <rect width="${width}" height="${height}" rx="24" fill="#FFFFFF"/>
      <rect width="${width}" height="34" rx="24" fill="#0F172A"/>
      <circle cx="24" cy="17" r="5" fill="#14B8A6"/>
      <text x="42" y="22" class="miniLogo">Design.md</text>
      ${content}
    </g>
  `;
}

function brandMark(x, y, size) {
  return `<image href="${iconHref}" x="${x}" y="${y}" width="${size}" height="${size}"/>`;
}

function heroLines(lines, x, y) {
  return lines
    .map((line, i) => `<text x="${x}" y="${y + i * 62}" class="hero">${escapeXml(line)}</text>`)
    .join('');
}

function featurePills(x, y, tone = 'dark') {
  const pills = ['colors', 'typography', 'spacing', 'components'];
  return pills
    .map((label, i) => {
      const px = x + i * 118;
      if (tone === 'light') {
        return `<g transform="translate(${px} ${y})"><rect width="104" height="36" rx="18" fill="#FFFFFF" stroke="#D8E2EF"/><text x="18" y="23" class="pillTextLight"># ${label}</text></g>`;
      }
      return `<g transform="translate(${px} ${y})"><rect width="104" height="36" rx="18" fill="#FFFFFF" opacity="0.13"/><text x="18" y="23" class="pillText"># ${label}</text></g>`;
    })
    .join('');
}

function colorRow(x, y) {
  const colors = ['#14B8A6', '#2563EB', '#8B5CF6', '#F97316', '#111827'];
  return colors
    .map((color, i) => `<rect x="${x + i * 46}" y="${y}" width="34" height="34" rx="10" fill="${color}"/>`)
    .join('');
}

function metricCard(x, y, label, value) {
  return `
    <rect x="${x}" y="${y}" width="128" height="58" rx="16" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="${x + 16}" y="${y + 24}" class="metricLabel">${escapeXml(label)}</text>
    <text x="${x + 16}" y="${y + 44}" class="metricText">${escapeXml(value)}</text>
  `;
}

function exportItem(x, y, title, subtitle) {
  return `
    <rect x="${x}" y="${y}" width="316" height="48" rx="14" fill="#F8FAFC" stroke="#E2E8F0"/>
    <rect x="${x + 16}" y="${y + 14}" width="20" height="20" rx="6" fill="#2563EB"/>
    <text x="${x + 50}" y="${y + 22}" class="metricLabel">${escapeXml(title)}</text>
    <text x="${x + 50}" y="${y + 39}" class="muted">${escapeXml(subtitle)}</text>
  `;
}

function checkItem(x, y, label) {
  return `
    <circle cx="${x + 14}" cy="${y}" r="14" fill="#DCFCE7"/>
    <path d="M${x + 7} ${y} L${x + 12} ${y + 5} L${x + 22} ${y - 7}" stroke="#059669" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="${x + 42}" y="${y + 6}" class="checkText">${escapeXml(label)}</text>
  `;
}

function miniToken(x, color, label) {
  return `
    <g transform="translate(${x} 0)">
      <rect width="96" height="54" rx="18" fill="#FFFFFF" stroke="#E2E8F0"/>
      <rect x="14" y="14" width="26" height="26" rx="9" fill="${color}"/>
      <text x="48" y="32" class="miniTokenText">${escapeXml(label)}</text>
    </g>
  `;
}

function noiseGrid(opacity = 0.42) {
  return `
    <path d="M0 120H1280M0 240H1280M0 360H1280M0 480H1280M0 600H1280M0 720H1280M160 0V800M320 0V800M480 0V800M640 0V800M800 0V800M960 0V800M1120 0V800" stroke="#CBD5E1" stroke-width="1" opacity="${opacity}"/>
  `;
}

function svgShell(width, height, body) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .hero{font:800 48px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;fill:#F8FAFC;letter-spacing:0}
    .subtitle{font:500 22px/1.42 Inter, ui-sans-serif, system-ui;color:#CBD5E1;letter-spacing:0}
    .overline{font:800 15px Inter, ui-sans-serif, system-ui;fill:#93C5FD;letter-spacing:2.4px}
    .smallMuted{font:600 14px Inter, ui-sans-serif, system-ui;fill:#94A3B8;letter-spacing:0}
    .disclaimer{font:500 12px Inter, ui-sans-serif, system-ui;fill:#94A3B8;letter-spacing:0}
    .pillText{font:700 13px Inter, ui-sans-serif, system-ui;fill:#E0F2FE;letter-spacing:0}
    .pillTextLight{font:800 13px Inter, ui-sans-serif, system-ui;fill:#334155;letter-spacing:0}
    .urlText{font:500 10px Inter, ui-sans-serif, system-ui;fill:#94A3B8;letter-spacing:0}
    .miniLogo{font:800 12px Inter, ui-sans-serif, system-ui;fill:#E2E8F0;letter-spacing:0}
    .panelTitle{font:800 20px Inter, ui-sans-serif, system-ui;fill:#0F172A;letter-spacing:0}
    .sectionTitle{font:800 13px Inter, ui-sans-serif, system-ui;fill:#334155;letter-spacing:0}
    .muted{font:600 12px Inter, ui-sans-serif, system-ui;fill:#64748B;letter-spacing:0}
    .metricLabel{font:800 13px Inter, ui-sans-serif, system-ui;fill:#334155;letter-spacing:0}
    .metricText{font:700 12px Inter, ui-sans-serif, system-ui;fill:#64748B;letter-spacing:0}
    .tabText{font:800 13px Inter, ui-sans-serif, system-ui;fill:#2563EB;letter-spacing:0}
    .tabTextMuted{font:700 13px Inter, ui-sans-serif, system-ui;fill:#64748B;letter-spacing:0}
    .buttonText{font:800 16px Inter, ui-sans-serif, system-ui;fill:#FFFFFF;letter-spacing:0}
    .darkButtonText{font:800 16px Inter, ui-sans-serif, system-ui;fill:#334155;letter-spacing:0}
    .successText{font:800 14px Inter, ui-sans-serif, system-ui;fill:#047857;letter-spacing:0}
    .privacyText{font:800 14px Inter, ui-sans-serif, system-ui;fill:#2563EB;letter-spacing:0}
    .checkText{font:800 15px Inter, ui-sans-serif, system-ui;fill:#334155;letter-spacing:0}
    .promoTitle{font:900 31px Inter, ui-sans-serif, system-ui;fill:#0F172A;letter-spacing:0}
    .promoBody{font:700 17px Inter, ui-sans-serif, system-ui;fill:#475569;letter-spacing:0}
    .miniTokenText{font:800 11px Inter, ui-sans-serif, system-ui;fill:#334155;letter-spacing:0}
    .marqueeTitle{font:900 54px Inter, ui-sans-serif, system-ui;fill:#0F172A;letter-spacing:0}
    .marqueeSubtitle{font:600 24px/1.35 Inter, ui-sans-serif, system-ui;color:#475569;letter-spacing:0}
  </style>
  <defs>
    <linearGradient id="darkBg" x1="54" y1="78" x2="1226" y2="722" gradientUnits="userSpaceOnUse">
      <stop stop-color="#101827"/>
      <stop offset="0.45" stop-color="#111827"/>
      <stop offset="1" stop-color="#0F766E"/>
    </linearGradient>
    <filter id="softShadow" x="20" y="44" width="1240" height="712" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0F172A" flood-opacity="0.22"/>
    </filter>
    <filter id="panelShadow" x="-30" y="-30" width="700" height="700" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#020617" flood-opacity="0.24"/>
    </filter>
  </defs>
  ${body}
</svg>`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
