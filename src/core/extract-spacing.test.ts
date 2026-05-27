import { describe, expect, it } from 'vitest';
import { extractSpacingTokens } from './extract-spacing';
import type { LayoutElementSample } from './types';

function sample(styles: Partial<LayoutElementSample['styles']>): LayoutElementSample {
  return {
    tagName: 'div',
    rect: { width: 320, height: 120, top: 100, left: 20 },
    styles: {
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
      width: '320px',
      height: '120px',
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
      ...styles,
    },
  };
}

describe('extractSpacingTokens', () => {
  it('extracts padding, margin, and gap values, filters noise, and infers an 8px scale', () => {
    const tokens = extractSpacingTokens([
      sample({ paddingTop: '4px', paddingRight: '8px', paddingBottom: '16px', paddingLeft: '24px', gap: '32px' }),
      sample({ marginTop: '8px', marginRight: 'auto', marginBottom: '-12px', marginLeft: '320px', rowGap: '16px', columnGap: '24px' }),
      sample({ paddingTop: '16px', paddingRight: '24px', paddingBottom: '32px', paddingLeft: '40px' }),
    ]);

    expect(tokens.baseUnit).toBe(8);
    expect(tokens.values.map((token) => token.value)).toEqual(expect.arrayContaining([4, 8, 16, 24, 32, 40]));
    expect(tokens.values.map((token) => token.value)).not.toEqual(expect.arrayContaining([0, -12, 320]));
    expect(tokens.values.find((token) => token.value === 16)?.usage).toEqual(expect.arrayContaining(['paddingBottom', 'rowGap']));
    expect(tokens.scale.xs).toEqual(expect.objectContaining({ value: 4 }));
    expect(tokens.scale.sm).toEqual(expect.objectContaining({ value: 8 }));
    expect(tokens.scale.md).toEqual(expect.objectContaining({ value: 16 }));
    expect(tokens.scale.lg).toEqual(expect.objectContaining({ value: 24 }));
    expect(tokens.scale.xl).toEqual(expect.objectContaining({ value: 32 }));
  });
});
