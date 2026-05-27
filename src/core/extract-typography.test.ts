import { describe, expect, it } from 'vitest';
import { extractTypographyTokens } from './extract-typography';
import type { LayoutElementSample } from './types';

const baseSample: LayoutElementSample = {
  tagName: 'p',
  rect: { width: 320, height: 24, top: 200, left: 40 },
  text: 'Body copy',
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
    height: '24px',
    fontFamily: 'Inter, system-ui, sans-serif',
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

describe('extractTypographyTokens', () => {
  it('clusters typography styles and infers heading, body, caption, button, and input roles', () => {
    const tokens = extractTypographyTokens([
      {
        ...baseSample,
        tagName: 'h1',
        text: 'Hero headline',
        rect: { width: 640, height: 56, top: 40, left: 40 },
        styles: { ...baseSample.styles, fontSize: '40px', fontWeight: '700', lineHeight: '48px', letterSpacing: '-0.2px' },
      },
      baseSample,
      {
        ...baseSample,
        tagName: 'span',
        className: 'caption',
        text: 'Updated today',
        styles: { ...baseSample.styles, fontSize: '12px', lineHeight: '16px', fontWeight: '400' },
      },
      {
        ...baseSample,
        tagName: 'button',
        text: 'Buy now',
        styles: { ...baseSample.styles, fontSize: '14px', lineHeight: '20px', fontWeight: '600' },
      },
      {
        ...baseSample,
        tagName: 'input',
        styles: { ...baseSample.styles, fontSize: '15px', lineHeight: '22px', fontWeight: '400' },
      },
    ]);

    expect(tokens.fontFamilies[0]).toEqual(expect.objectContaining({ value: 'Inter, system-ui, sans-serif', frequency: 5 }));
    expect(tokens.fontSizes.map((token) => token.value)).toEqual(expect.arrayContaining([12, 14, 15, 16, 40]));
    expect(tokens.fontWeights.map((token) => token.value)).toEqual(expect.arrayContaining([400, 600, 700]));
    expect(tokens.lineHeights.map((token) => token.value)).toEqual(expect.arrayContaining([16, 20, 22, 24, 48]));
    expect(tokens.letterSpacings.map((token) => token.value)).toEqual(expect.arrayContaining([0, -0.2]));
    expect(tokens.roles.heading).toEqual(expect.objectContaining({ fontSize: 40, fontWeight: 700, lineHeight: 48 }));
    expect(tokens.roles.body).toEqual(expect.objectContaining({ fontSize: 16, fontWeight: 400, lineHeight: 24 }));
    expect(tokens.roles.caption).toEqual(expect.objectContaining({ fontSize: 12, lineHeight: 16 }));
    expect(tokens.roles.button).toEqual(expect.objectContaining({ fontSize: 14, fontWeight: 600 }));
    expect(tokens.roles.input).toEqual(expect.objectContaining({ fontSize: 15, lineHeight: 22 }));
  });
});
