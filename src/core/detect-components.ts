import type { ComponentKind, ComponentStyleCandidate, ComponentStyles, LayoutElementSample } from './types';

interface ScoredComponent {
  kind: ComponentKind;
  sample: LayoutElementSample;
  score: number;
  evidence: string[];
}

export function detectComponents(samples: LayoutElementSample[]): ComponentStyles {
  return {
    button: topCandidates(samples.map(scoreButton).filter(isScored), 4),
    card: topCandidates(samples.map(scoreCard).filter(isScored), 4),
    input: topCandidates(samples.map(scoreInput).filter(isScored), 4),
  };
}

function scoreButton(sample: LayoutElementSample): ScoredComponent | undefined {
  if (!isButtonCandidate(sample)) return undefined;

  const evidence: string[] = [];
  let score = 0;

  if (sample.tagName.toLowerCase() === 'button') {
    score += 5;
    evidence.push('button tag +5');
  }

  if (sample.role === 'button') {
    score += 5;
    evidence.push('role=button +5');
  }

  if (styleValue(sample, 'cursor') === 'pointer') {
    score += 2;
    evidence.push('cursor:pointer +2');
  }

  if (sample.rect.height >= 28 && sample.rect.height <= 56) {
    score += 2;
    evidence.push('height 28-56 +2');
  }

  if (Math.max(parsePx(styleValue(sample, 'paddingLeft')), parsePx(styleValue(sample, 'paddingRight'))) >= 8) {
    score += 2;
    evidence.push('padding-x >= 8 +2');
  }

  if (maxRadius(sample) > 0) {
    score += 1;
    evidence.push('border-radius > 0 +1');
  }

  if (isVisibleColor(styleValue(sample, 'backgroundColor'))) {
    score += 2;
    evidence.push('non-transparent background +2');
  }

  if (isShortText(sample.text)) {
    score += 1;
    evidence.push('short text +1');
  }

  if (score < 7) return undefined;
  return { kind: 'button', sample, score, evidence };
}

function scoreCard(sample: LayoutElementSample): ScoredComponent | undefined {
  if (!['div', 'section', 'article', 'li', 'aside'].includes(sample.tagName.toLowerCase())) return undefined;

  const evidence: string[] = [];
  let score = 0;

  if (sample.rect.width > 160) {
    score += 1;
    evidence.push('width > 160 +1');
  }

  if (sample.rect.height > 80) {
    score += 1;
    evidence.push('height > 80 +1');
  }

  if (minPadding(sample) >= 12) {
    score += 2;
    evidence.push('padding >= 12 +2');
  }

  if (isVisibleColor(styleValue(sample, 'backgroundColor'))) {
    score += 2;
    evidence.push('background non-transparent +2');
  }

  if (maxRadius(sample) >= 8) {
    score += 2;
    evidence.push('border-radius >= 8 +2');
  }

  if (hasBorder(sample)) {
    score += 1;
    evidence.push('has border +1');
  }

  if (hasShadow(sample)) {
    score += 2;
    evidence.push('has box-shadow +2');
  }

  if (sample.hasHeading || sample.hasImage || sample.hasButton) {
    score += 2;
    evidence.push('contains heading/image/button +2');
  }

  if (score < 7) return undefined;
  return { kind: 'card', sample, score, evidence };
}

function scoreInput(sample: LayoutElementSample): ScoredComponent | undefined {
  if (!isInputCandidate(sample)) return undefined;

  return {
    kind: 'input',
    sample,
    score: 10,
    evidence: [`input candidate: ${inputEvidenceName(sample)}`],
  };
}

function topCandidates(scored: ScoredComponent[], limit: number): ComponentStyleCandidate[] | undefined {
  const candidates = scored
    .sort((left, right) => right.score - left.score || area(right.sample) - area(left.sample))
    .slice(0, limit)
    .map(toCandidate);

  return candidates.length ? candidates : undefined;
}

function toCandidate(scored: ScoredComponent): ComponentStyleCandidate {
  return {
    kind: scored.kind,
    selectorHint: selectorHint(scored.sample),
    count: 1,
    confidence: confidence(scored.kind, scored.score),
    style: extractComponentStyle(scored.sample),
    evidence: scored.evidence,
  };
}

function extractComponentStyle(sample: LayoutElementSample): ComponentStyleCandidate['style'] {
  return stripEmpty({
    color: valueOrUndefined(styleValue(sample, 'color')),
    backgroundColor: valueOrUndefined(styleValue(sample, 'backgroundColor')),
    borderColor: commonBorderColor(sample),
    borderRadius: radiusValue(sample),
    padding: paddingValue(sample),
    height: sample.rect.height > 0 ? `${sample.rect.height}px` : valueOrUndefined(styleValue(sample, 'height')),
    fontSize: valueOrUndefined(styleValue(sample, 'fontSize')),
    fontWeight: valueOrUndefined(styleValue(sample, 'fontWeight')),
    boxShadow: hasShadow(sample) ? styleValue(sample, 'boxShadow') : undefined,
  });
}

function isButtonCandidate(sample: LayoutElementSample): boolean {
  const tag = sample.tagName.toLowerCase();
  const inputType = sample.inputType?.toLowerCase();

  return (
    tag === 'button' ||
    sample.role === 'button' ||
    (tag === 'input' && ['button', 'submit'].includes(inputType ?? '')) ||
    (tag === 'a' && Boolean(sample.href) && (hasButtonShape(sample) || styleValue(sample, 'cursor') === 'pointer')) ||
    styleValue(sample, 'cursor') === 'pointer'
  );
}

function isInputCandidate(sample: LayoutElementSample): boolean {
  const tag = sample.tagName.toLowerCase();
  return ['input', 'textarea', 'select'].includes(tag) || sample.role === 'textbox' || sample.isContentEditable === true;
}

function inputEvidenceName(sample: LayoutElementSample): string {
  if (sample.role === 'textbox') return 'role=textbox';
  if (sample.isContentEditable) return 'contenteditable=true';
  return sample.tagName.toLowerCase();
}

function hasButtonShape(sample: LayoutElementSample): boolean {
  return (
    Math.max(parsePx(styleValue(sample, 'paddingLeft')), parsePx(styleValue(sample, 'paddingRight'))) >= 8 ||
    maxRadius(sample) > 0 ||
    isVisibleColor(styleValue(sample, 'backgroundColor'))
  );
}

function isShortText(text: string | undefined): boolean {
  if (!text) return false;
  return text.length > 0 && text.length <= 32;
}

function minPadding(sample: LayoutElementSample): number {
  return Math.min(
    parsePx(styleValue(sample, 'paddingTop')),
    parsePx(styleValue(sample, 'paddingRight')),
    parsePx(styleValue(sample, 'paddingBottom')),
    parsePx(styleValue(sample, 'paddingLeft')),
  );
}

function maxRadius(sample: LayoutElementSample): number {
  return Math.max(
    parsePx(styleValue(sample, 'borderTopLeftRadius')),
    parsePx(styleValue(sample, 'borderTopRightRadius')),
    parsePx(styleValue(sample, 'borderBottomRightRadius')),
    parsePx(styleValue(sample, 'borderBottomLeftRadius')),
  );
}

function radiusValue(sample: LayoutElementSample): string | undefined {
  const values = [
    styleValue(sample, 'borderTopLeftRadius'),
    styleValue(sample, 'borderTopRightRadius'),
    styleValue(sample, 'borderBottomRightRadius'),
    styleValue(sample, 'borderBottomLeftRadius'),
  ].map((value) => value.trim());

  if (values.every((value) => value === values[0]) && parsePx(values[0]) > 0) return values[0];
  return compactBoxValue(values.filter((value) => parsePx(value) > 0));
}

function paddingValue(sample: LayoutElementSample): string | undefined {
  return compactBoxValue([
    styleValue(sample, 'paddingTop'),
    styleValue(sample, 'paddingRight'),
    styleValue(sample, 'paddingBottom'),
    styleValue(sample, 'paddingLeft'),
  ]);
}

function compactBoxValue(values: string[]): string | undefined {
  const normalized = values.map((value) => value.trim());
  if (normalized.length !== 4 && normalized.length !== 1) return undefined;
  if (normalized.some((value) => !value || value === '0px')) return undefined;

  const [top, right, bottom, left] = normalized;
  if (normalized.length === 1) return normalized[0];
  if (top === right && right === bottom && bottom === left) return top;
  if (top === bottom && right === left) return `${top} ${right}`;
  if (right === left) return `${top} ${right} ${bottom}`;
  return normalized.join(' ');
}

function hasBorder(sample: LayoutElementSample): boolean {
  return (
    Math.max(
      parsePx(styleValue(sample, 'borderTopWidth')),
      parsePx(styleValue(sample, 'borderRightWidth')),
      parsePx(styleValue(sample, 'borderBottomWidth')),
      parsePx(styleValue(sample, 'borderLeftWidth')),
    ) > 0 && Boolean(commonBorderColor(sample))
  );
}

function commonBorderColor(sample: LayoutElementSample): string | undefined {
  if (
    Math.max(
      parsePx(styleValue(sample, 'borderTopWidth')),
      parsePx(styleValue(sample, 'borderRightWidth')),
      parsePx(styleValue(sample, 'borderBottomWidth')),
      parsePx(styleValue(sample, 'borderLeftWidth')),
    ) <= 0
  ) {
    return undefined;
  }

  const colors = [
    styleValue(sample, 'borderTopColor'),
    styleValue(sample, 'borderRightColor'),
    styleValue(sample, 'borderBottomColor'),
    styleValue(sample, 'borderLeftColor'),
  ].filter(isVisibleColor);

  if (!colors.length) return undefined;
  const counts = new Map<string, number>();
  for (const color of colors) counts.set(color, (counts.get(color) ?? 0) + 1);
  return Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0];
}

function hasShadow(sample: LayoutElementSample): boolean {
  const value = styleValue(sample, 'boxShadow').trim();
  return Boolean(value && value !== 'none');
}

function isVisibleColor(value: string | undefined): value is string {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return Boolean(
    normalized &&
      normalized !== 'transparent' &&
      normalized !== 'rgba(0, 0, 0, 0)' &&
      normalized !== 'rgb(0 0 0 / 0)' &&
      !/rgba?\([^)]*[,/]\s*0\)?$/.test(normalized),
  );
}

function valueOrUndefined(value: string): string | undefined {
  const normalized = value.trim();
  return normalized && normalized !== 'normal' ? normalized : undefined;
}

function styleValue(sample: LayoutElementSample, property: keyof LayoutElementSample['styles']): string {
  return sample.styles[property] ?? '';
}

function parsePx(value: string | undefined): number {
  const match = value?.trim().match(/^(-?\d*\.?\d+)px$/);
  if (!match) return 0;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function selectorHint(sample: LayoutElementSample): string {
  if (sample.id) return `${sample.tagName.toLowerCase()}#${sample.id}`;
  if (sample.className) return `${sample.tagName.toLowerCase()}.${sample.className.trim().split(/\s+/).join('.')}`;
  if (sample.role) return `${sample.tagName.toLowerCase()}[role="${sample.role}"]`;
  return sample.tagName.toLowerCase();
}

function confidence(kind: ComponentKind, score: number): number {
  if (kind === 'input') return 0.95;
  const threshold = kind === 'button' ? 7 : 7;
  return Math.max(0.5, Math.min(0.98, Math.round((score / (threshold + 5)) * 100) / 100));
}

function area(sample: LayoutElementSample): number {
  return sample.rect.width * sample.rect.height;
}

function stripEmpty<T extends Record<string, string | undefined>>(record: T): T {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)) as T;
}

function isScored(item: ScoredComponent | undefined): item is ScoredComponent {
  return Boolean(item);
}
