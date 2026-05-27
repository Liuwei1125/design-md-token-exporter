import { describe, expect, it } from 'vitest';
import { normalizeColor } from './color-normalization';

describe('normalizeColor', () => {
  it('normalizes common CSS color formats and preserves alpha where possible', () => {
    expect(normalizeColor('#2563eb')).toBe('#2563EB');
    expect(normalizeColor('#abc')).toBe('#AABBCC');
    expect(normalizeColor('#abcd')).toBe('#AABBCCDD');
    expect(normalizeColor('rgb(37, 99, 235)')).toBe('#2563EB');
    expect(normalizeColor('rgba(37, 99, 235, 0.5)')).toBe('#2563EB80');
    expect(normalizeColor('rgb(37 99 235 / 50%)')).toBe('#2563EB80');
    expect(normalizeColor('hsl(221 83% 53%)')).toBe('#2463EB');
  });

  it('drops fully transparent colors and preserves unknown modern formats safely', () => {
    expect(normalizeColor('transparent')).toBeUndefined();
    expect(normalizeColor('rgba(0, 0, 0, 0)')).toBeUndefined();
    expect(normalizeColor('oklch(62% 0.18 255)')).toBe('oklch(62% 0.18 255)');
    expect(normalizeColor('color-mix(in oklab, blue 70%, white)')).toBe('color-mix(in oklab, blue 70%, white)');
  });

  it('parses color(srgb) and color(display-p3) formats into standardized hex format', () => {
    expect(normalizeColor('color(srgb 0.0431373 0.0431373 0.0431373)')).toBe('#0B0B0B');
    expect(normalizeColor('color(srgb 0.0431373 0.0431373 0.0431373 / 0.8)')).toBe('#0B0B0BCC');
    expect(normalizeColor('color(display-p3 1 0.5 0 / 50%)')).toBe('#FF800080');
  });
});
