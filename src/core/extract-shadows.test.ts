import { describe, expect, it } from 'vitest';
import { extractShadowTokens } from './extract-shadows';
import type { LayoutElementSample } from './types';

const baseSample: LayoutElementSample = {
  tagName: 'div',
  rect: { width: 240, height: 160, top: 100, left: 20 },
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
    width: '240px',
    height: '160px',
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
  },
};

describe('extractShadowTokens', () => {
  it('extracts box and text shadows and infers sm, md, lg, card, and floating roles', () => {
    const tokens = extractShadowTokens([
      { ...baseSample, styles: { ...baseSample.styles, boxShadow: '0 1px 2px rgba(15, 23, 42, 0.12)' } },
      { ...baseSample, className: 'card', styles: { ...baseSample.styles, boxShadow: '0 4px 12px rgba(15, 23, 42, 0.14)' } },
      { ...baseSample, className: 'floating-popover', styles: { ...baseSample.styles, boxShadow: '0 16px 40px rgba(15, 23, 42, 0.22)' } },
      { ...baseSample, tagName: 'h1', styles: { ...baseSample.styles, textShadow: '0 2px 4px rgba(15, 23, 42, 0.18)' } },
    ]);

    expect(tokens.values.map((token) => token.value)).toEqual(
      expect.arrayContaining([
        '0 1px 2px rgba(15, 23, 42, 0.12)',
        '0 4px 12px rgba(15, 23, 42, 0.14)',
        '0 16px 40px rgba(15, 23, 42, 0.22)',
        '0 2px 4px rgba(15, 23, 42, 0.18)',
      ]),
    );
    expect(tokens.scale.sm).toEqual(expect.objectContaining({ value: '0 1px 2px rgba(15, 23, 42, 0.12)' }));
    expect(tokens.scale.md).toEqual(expect.objectContaining({ value: '0 4px 12px rgba(15, 23, 42, 0.14)' }));
    expect(tokens.scale.lg).toEqual(expect.objectContaining({ value: '0 16px 40px rgba(15, 23, 42, 0.22)' }));
    expect(tokens.scale.card).toEqual(expect.objectContaining({ value: '0 4px 12px rgba(15, 23, 42, 0.14)' }));
    expect(tokens.scale.floating).toEqual(expect.objectContaining({ value: '0 16px 40px rgba(15, 23, 42, 0.22)' }));
    expect(tokens.values.find((token) => token.type === 'textShadow')).toEqual(expect.objectContaining({ blur: 4 }));
  });
});
