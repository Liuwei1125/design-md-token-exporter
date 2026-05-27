import { describe, expect, it } from 'vitest';
import { extractRadiusTokens } from './extract-radius';
import type { LayoutElementSample } from './types';

const baseStyles: LayoutElementSample['styles'] = {
  color: 'rgb(17, 24, 39)',
  backgroundColor: 'rgba(0, 0, 0, 0)',
  borderTopColor: 'rgba(0, 0, 0, 0)',
  borderRightColor: 'rgba(0, 0, 0, 0)',
  borderBottomColor: 'rgba(0, 0, 0, 0)',
  borderLeftColor: 'rgba(0, 0, 0, 0)',
  borderTopWidth: '0px',
  borderRightWidth: '0px',
  borderBottomWidth: '0px',
  borderLeftWidth: '0px',
  cursor: 'auto',
  width: '120px',
  height: '40px',
  fontFamily: 'Inter',
  fontSize: '16px',
  fontWeight: '400',
  lineHeight: '24px',
  letterSpacing: 'normal',
  paddingTop: '0px',
  paddingRight: '0px',
  paddingBottom: '0px',
  paddingLeft: '0px',
  marginTop: '0px',
  marginRight: '0px',
  marginBottom: '0px',
  marginLeft: '0px',
  gap: 'normal',
  rowGap: 'normal',
  columnGap: 'normal',
  borderTopLeftRadius: '0px',
  borderTopRightRadius: '0px',
  borderBottomRightRadius: '0px',
  borderBottomLeftRadius: '0px',
  boxShadow: 'none',
  textShadow: 'none',
};

function sample(radius: string, rect: LayoutElementSample['rect'] = { width: 120, height: 40, top: 80, left: 40 }): LayoutElementSample {
  return {
    tagName: 'button',
    rect,
    styles: {
      ...baseStyles,
      borderTopLeftRadius: radius,
      borderTopRightRadius: radius,
      borderBottomRightRadius: radius,
      borderBottomLeftRadius: radius,
    },
  };
}

describe('extractRadiusTokens', () => {
  it('extracts border radius values and infers sm, md, lg, xl, and full roles', () => {
    const tokens = extractRadiusTokens([
      sample('4px'),
      sample('8px'),
      sample('16px'),
      sample('24px'),
      sample('9999px', { width: 120, height: 40, top: 80, left: 40 }),
    ]);

    expect(tokens.values.map((token) => token.value)).toEqual(expect.arrayContaining([4, 8, 16, 24, 9999]));
    expect(tokens.scale.sm).toEqual(expect.objectContaining({ value: 4 }));
    expect(tokens.scale.md).toEqual(expect.objectContaining({ value: 8 }));
    expect(tokens.scale.lg).toEqual(expect.objectContaining({ value: 16 }));
    expect(tokens.scale.xl).toEqual(expect.objectContaining({ value: 24 }));
    expect(tokens.scale.full).toEqual(expect.objectContaining({ value: 9999 }));
  });

  it('keeps oversized pill radii out of regular radius scale roles', () => {
    const tokens = extractRadiusTokens([
      ...Array.from({ length: 12 }, () => sample('980px', { width: 220, height: 44, top: 80, left: 40 })),
      sample('4px', { width: 140, height: 40, top: 140, left: 40 }),
      sample('8px', { width: 180, height: 96, top: 200, left: 40 }),
      sample('16px', { width: 260, height: 160, top: 320, left: 40 }),
    ]);

    expect(tokens.values.map((token) => token.value)).toEqual(expect.arrayContaining([4, 8, 16, 980]));
    expect(tokens.scale.sm).toEqual(expect.objectContaining({ value: 4 }));
    expect(tokens.scale.md).toEqual(expect.objectContaining({ value: 8 }));
    expect(tokens.scale.lg).toEqual(expect.objectContaining({ value: 16 }));
    expect(tokens.scale.xl?.value).not.toBe(980);
    expect(tokens.scale.full).toEqual(expect.objectContaining({ value: 980 }));
  });

  it('does not treat the same numeric radius as full when regular element evidence is stronger', () => {
    const tokens = extractRadiusTokens([
      sample('80px', { width: 120, height: 40, top: 80, left: 40 }),
      ...Array.from({ length: 3 }, () => sample('80px', { width: 420, height: 240, top: 160, left: 40 })),
      sample('8px', { width: 180, height: 96, top: 440, left: 40 }),
      sample('16px', { width: 260, height: 160, top: 560, left: 40 }),
    ]);

    expect(tokens.scale.xl).toEqual(expect.objectContaining({ value: 80 }));
    expect(tokens.scale.full?.value).not.toBe(80);
  });
});
