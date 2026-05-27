import { describe, expect, it } from 'vitest';
import { extractColorTokens, extractSalientGradientColor } from './extract-colors';
import type { ColorElementSample } from './types';

const baseSample: ColorElementSample = {
  tagName: 'div',
  rect: { width: 120, height: 40, top: 0, left: 0 },
  text: '',
  id: '',
  className: '',
  role: '',
  ariaSelected: false,
  ariaCurrent: null,
  styles: {
    color: 'rgb(17, 24, 39)',
    backgroundColor: 'transparent',
    backgroundImage: 'none',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    outlineColor: 'transparent',
    textDecorationColor: 'transparent',
  },
};

describe('extractColorTokens', () => {
  it('extracts text, background, border, outline, decoration, and gradient CTA colors with weighted evidence', () => {
    const tokens = extractColorTokens([
      {
        ...baseSample,
        tagName: 'body',
        rect: { width: 1280, height: 900, top: 0, left: 0 },
        styles: { ...baseSample.styles, backgroundColor: '#f8fafc' },
      },
      {
        ...baseSample,
        tagName: 'button',
        text: '立即购买',
        className: 'hero cta',
        styles: {
          ...baseSample.styles,
          color: '#ffffff',
          backgroundColor: 'linear-gradient(90deg, #2563eb, #7c3aed)' as unknown as string,
          backgroundImage: 'linear-gradient(90deg, #2563eb, #7c3aed)',
          borderTopColor: '#1d4ed8',
          outlineColor: 'rgba(37, 99, 235, 0.45)',
        },
      },
      {
        ...baseSample,
        tagName: 'a',
        text: 'Start now',
        styles: { ...baseSample.styles, color: 'rgb(29, 78, 216)', textDecorationColor: '#1d4ed8' },
      },
    ]);

    const primary = tokens.find((token) => token.value === '#2563EB');
    const link = tokens.find((token) => token.value === '#1D4ED8');
    const background = tokens.find((token) => token.value === '#F8FAFC');

    expect(primary?.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'backgroundColor',
          weightReason: expect.arrayContaining(['button background', 'action intent', 'gradient color']),
        }),
      ]),
    );
    expect((primary?.score ?? 0)).toBeGreaterThan(link?.score ?? 0);
    expect(background?.evidence[0]).toEqual(expect.objectContaining({ tagName: 'body', property: 'backgroundColor' }));
    expect(link?.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tagName: 'a', property: 'color' }),
        expect.objectContaining({ property: 'textDecorationColor' }),
      ]),
    );
  });
});

describe('extractSalientGradientColor', () => {
  it('picks the first non-neutral color from a gradient', () => {
    expect(extractSalientGradientColor('linear-gradient(90deg, white, rgba(37, 99, 235, 0.9))')).toBe('#2563EBE6');
  });
});
