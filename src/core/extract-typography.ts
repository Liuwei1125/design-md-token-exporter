import type {
  ClusterToken,
  LayoutElementSample,
  TypographyRoleName,
  TypographyRoleToken,
  TypographyStyleToken,
  TypographyTokens,
} from './types';

interface TypographyClusterKey {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
}

interface TypographyEvidence {
  sample: LayoutElementSample;
  style: TypographyClusterKey;
}

export function extractTypographyTokens(samples: LayoutElementSample[]): TypographyTokens {
  const evidence = samples.map(toTypographyEvidence).filter((item): item is TypographyEvidence => Boolean(item));
  const styles = clusterStyles(evidence);

  return {
    fontFamilies: clusterProperty(evidence, (item) => item.style.fontFamily, 'fontFamily'),
    fontSizes: clusterProperty(evidence, (item) => item.style.fontSize, 'fontSize'),
    fontWeights: clusterProperty(evidence, (item) => item.style.fontWeight, 'fontWeight'),
    lineHeights: clusterProperty(evidence, (item) => item.style.lineHeight, 'lineHeight'),
    letterSpacings: clusterProperty(evidence, (item) => item.style.letterSpacing, 'letterSpacing'),
    styles,
    roles: inferTypographyRoles(evidence, styles),
  };
}

function toTypographyEvidence(sample: LayoutElementSample): TypographyEvidence | undefined {
  const fontSize = parsePx(sample.styles.fontSize);
  const fontWeight = parseFontWeight(sample.styles.fontWeight);

  if (fontSize === undefined || fontWeight === undefined || fontSize <= 0) return undefined;

  return {
    sample,
    style: {
      fontFamily: normalizeFontFamily(sample.styles.fontFamily),
      fontSize,
      fontWeight,
      lineHeight: parseLineHeight(sample.styles.lineHeight, fontSize),
      letterSpacing: parseLetterSpacing(sample.styles.letterSpacing),
    },
  };
}

function clusterStyles(evidence: TypographyEvidence[]): TypographyStyleToken[] {
  const grouped = new Map<string, TypographyEvidence[]>();

  for (const item of evidence) {
    const key = [
      item.style.fontFamily,
      item.style.fontSize,
      item.style.fontWeight,
      item.style.lineHeight,
      item.style.letterSpacing,
    ].join('|');
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }

  return Array.from(grouped.values())
    .map((items) => ({
      ...items[0].style,
      frequency: items.length,
      evidence: items.slice(0, 5).map((item) => describeSample(item.sample)),
    }))
    .sort((left, right) => right.frequency - left.frequency || right.fontSize - left.fontSize);
}

function inferTypographyRoles(
  evidence: TypographyEvidence[],
  styles: TypographyStyleToken[],
): Partial<Record<TypographyRoleName, TypographyRoleToken>> {
  const roles: Partial<Record<TypographyRoleName, TypographyRoleToken>> = {};
  roles.heading = toRoleToken(bestByScore(evidence, scoreHeading));
  roles.body = toRoleToken(bestByScore(evidence, scoreBody)) ?? toRoleToken(styles[0]);
  roles.caption = toRoleToken(bestByScore(evidence, scoreCaption));
  roles.button = toRoleToken(bestByScore(evidence, scoreButton));
  roles.input = toRoleToken(bestByScore(evidence, scoreInput));
  return roles;
}

function bestByScore(
  evidence: TypographyEvidence[],
  score: (item: TypographyEvidence) => number,
): TypographyStyleToken | undefined {
  const scored = evidence
    .map((item) => ({ item, score: score(item) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || right.item.style.fontSize - left.item.style.fontSize);

  if (!scored[0]) return undefined;

  const sameStyle = evidence.filter((item) => styleKey(item.style) === styleKey(scored[0].item.style));
  return {
    ...scored[0].item.style,
    frequency: sameStyle.length,
    evidence: sameStyle.slice(0, 5).map((item) => describeSample(item.sample)),
  };
}

function scoreHeading({ sample, style }: TypographyEvidence): number {
  const tag = sample.tagName.toLowerCase();
  let score = 0;
  if (/^h[1-6]$/.test(tag)) score += 120 - Number(tag.slice(1)) * 8;
  if (/\b(title|heading|headline|hero|display)\b/i.test(sampleContext(sample))) score += 32;
  if (style.fontSize >= 24) score += style.fontSize;
  if (style.fontWeight >= 600) score += 14;
  return score;
}

function scoreBody({ sample, style }: TypographyEvidence): number {
  const tag = sample.tagName.toLowerCase();
  let score = 0;
  if (['p', 'li', 'article', 'section', 'main', 'body'].includes(tag)) score += 42;
  if (style.fontSize >= 14 && style.fontSize <= 18) score += 34 - Math.abs(style.fontSize - 16) * 4;
  if (style.fontWeight >= 350 && style.fontWeight <= 500) score += 12;
  if (style.lineHeight >= style.fontSize * 1.25) score += 8;
  return score;
}

function scoreCaption({ sample, style }: TypographyEvidence): number {
  let score = 0;
  if (/\b(caption|small|meta|eyebrow|hint|helper|note|label)\b/i.test(sampleContext(sample))) score += 36;
  if (style.fontSize <= 13) score += 34 - style.fontSize;
  if (sample.rect.height <= 22) score += 6;
  return score;
}

function scoreButton({ sample, style }: TypographyEvidence): number {
  const tag = sample.tagName.toLowerCase();
  let score = 0;
  if (tag === 'button' || sample.role === 'button') score += 80;
  if (/\b(button|btn|cta|submit|action)\b/i.test(sampleContext(sample))) score += 24;
  if (style.fontWeight >= 500) score += 10;
  return score;
}

function scoreInput({ sample }: TypographyEvidence): number {
  const tag = sample.tagName.toLowerCase();
  if (['input', 'textarea', 'select'].includes(tag)) return 80;
  if (/\b(input|field|control|form)\b/i.test(sampleContext(sample))) return 36;
  return 0;
}

function toRoleToken(style: TypographyStyleToken | undefined): TypographyRoleToken | undefined {
  if (!style) return undefined;
  return {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    confidence: Math.min(1, round(0.45 + style.frequency * 0.12, 2)),
    evidence: style.evidence,
  };
}

function clusterProperty<TValue extends number | string>(
  evidence: TypographyEvidence[],
  valueFor: (item: TypographyEvidence) => TValue,
  usage: string,
): ClusterToken<TValue>[] {
  const grouped = new Map<TValue, TypographyEvidence[]>();
  for (const item of evidence) {
    const value = valueFor(item);
    grouped.set(value, [...(grouped.get(value) ?? []), item]);
  }

  return Array.from(grouped.entries())
    .map(([value, items]) => ({
      value,
      frequency: items.length,
      usage: [usage],
      evidence: items.slice(0, 5).map((item) => describeSample(item.sample)),
    }))
    .sort((left, right) => right.frequency - left.frequency || compareClusterValue(left.value, right.value));
}

function compareClusterValue(left: number | string, right: number | string): number {
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right));
}

function parsePx(value: string): number | undefined {
  const match = value.trim().match(/^(-?\d*\.?\d+)px$/i);
  return match ? round(Number(match[1]), 2) : undefined;
}

function parseFontWeight(value: string): number | undefined {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'normal') return 400;
  if (normalized === 'bold') return 700;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseLineHeight(value: string, fontSize: number): number {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'normal') return round(fontSize * 1.2, 2);
  if (normalized.endsWith('px')) return parsePx(normalized) ?? round(fontSize * 1.2, 2);
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? round(numeric * fontSize, 2) : round(fontSize * 1.2, 2);
}

function parseLetterSpacing(value: string): number {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'normal') return 0;
  return parsePx(normalized) ?? 0;
}

function normalizeFontFamily(value: string): string {
  return value
    .split(',')
    .map((part) => part.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean)
    .join(', ');
}

function styleKey(style: TypographyClusterKey): string {
  return [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight, style.letterSpacing].join('|');
}

function sampleContext(sample: LayoutElementSample): string {
  return [sample.tagName, sample.id, sample.className, sample.role, sample.text].filter(Boolean).join(' ');
}

function describeSample(sample: LayoutElementSample): string {
  return [sample.tagName.toLowerCase(), sample.id ? `#${sample.id}` : '', sample.className ? `.${sample.className}` : '']
    .filter(Boolean)
    .join('');
}

function round(value: number, precision: number): number {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}
