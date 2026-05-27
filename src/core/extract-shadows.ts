import type { LayoutElementSample, ShadowScaleName, ShadowToken, ShadowTokens, ShadowType } from './types';

const SHADOW_PROPERTIES = ['boxShadow', 'textShadow'] as const;

export function extractShadowTokens(samples: LayoutElementSample[]): ShadowTokens {
  const values = clusterShadowValues(samples);
  return {
    values,
    scale: inferShadowScale(values, samples),
  };
}

function clusterShadowValues(samples: LayoutElementSample[]): ShadowToken[] {
  const grouped = new Map<string, { type: ShadowType; samples: LayoutElementSample[]; usage: Set<string> }>();

  for (const sample of samples) {
    for (const property of SHADOW_PROPERTIES) {
      const value = normalizeShadow(sample.styles[property]);
      if (!value) continue;

      const key = `${property}:${value}`;
      const existing = grouped.get(key) ?? { type: property, samples: [], usage: new Set<string>() };
      existing.samples.push(sample);
      existing.usage.add(property);
      grouped.set(key, existing);
    }
  }

  return Array.from(grouped.entries())
    .map(([key, item]) => {
      const value = key.slice(key.indexOf(':') + 1);
      const metrics = parseShadowMetrics(value);
      return {
        value,
        type: item.type,
        frequency: item.samples.length,
        usage: Array.from(item.usage),
        evidence: item.samples.slice(0, 5).map(describeSample),
        ...metrics,
        score: shadowScore(metrics, item.samples.length),
      };
    })
    .sort((left, right) => left.score - right.score || left.value.localeCompare(right.value));
}

function inferShadowScale(
  values: ShadowToken[],
  samples: LayoutElementSample[],
): Partial<Record<ShadowScaleName, ShadowToken>> {
  const boxShadows = values.filter((token) => token.type === 'boxShadow').sort((left, right) => left.score - right.score);
  const scale: Partial<Record<ShadowScaleName, ShadowToken>> = {};

  scale.sm = boxShadows[0];
  scale.md = boxShadows[Math.min(1, boxShadows.length - 1)];
  scale.lg = boxShadows.at(-1);
  scale.card = findByContext(boxShadows, samples, /\b(card|panel|tile|surface)\b/i) ?? scale.md ?? scale.sm;
  scale.floating = findByContext(boxShadows, samples, /\b(float|floating|popover|modal|dropdown|menu|tooltip|elevated)\b/i) ?? scale.lg;

  return scale;
}

function findByContext(tokens: ShadowToken[], samples: LayoutElementSample[], pattern: RegExp): ShadowToken | undefined {
  return tokens.find((token) =>
    samples.some((sample) => normalizeShadow(sample.styles.boxShadow) === token.value && pattern.test(sampleContext(sample))),
  );
}

function normalizeShadow(value: string): string | undefined {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized || normalized === 'none') return undefined;
  return normalized;
}

function parseShadowMetrics(value: string): { offsetX: number; offsetY: number; blur: number; spread: number } {
  const withoutColors = value
    .replace(/rgba?\([^)]+\)/gi, '')
    .replace(/hsla?\([^)]+\)/gi, '')
    .replace(/#[0-9a-f]{3,8}\b/gi, '')
    .replace(/\binset\b/gi, '')
    .trim();
  const numbers = withoutColors.match(/-?\d*\.?\d+px|-?\d*\.?\d+/gi)?.map((item) => Number(item.replace(/px$/i, ''))) ?? [];

  return {
    offsetX: numbers[0] ?? 0,
    offsetY: numbers[1] ?? 0,
    blur: numbers[2] ?? 0,
    spread: numbers[3] ?? 0,
  };
}

function shadowScore(metrics: { offsetY: number; blur: number; spread: number }, frequency: number): number {
  return metrics.blur + Math.abs(metrics.offsetY) * 0.8 + Math.max(0, metrics.spread) * 0.3 + frequency * 0.1;
}

function sampleContext(sample: LayoutElementSample): string {
  return [sample.tagName, sample.id, sample.className, sample.role, sample.text].filter(Boolean).join(' ');
}

function describeSample(sample: LayoutElementSample): string {
  return [sample.tagName.toLowerCase(), sample.id ? `#${sample.id}` : '', sample.className ? `.${sample.className}` : '']
    .filter(Boolean)
    .join('');
}
