import { describe, expect, it } from 'vitest';
import { detectComponents } from './detect-components';
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

function sample(overrides: Partial<Omit<LayoutElementSample, 'styles'>> & { styles?: Partial<LayoutElementSample['styles']> }): LayoutElementSample {
  return {
    tagName: 'div',
    rect: { width: 120, height: 40, top: 40, left: 40 },
    ...overrides,
    styles: {
      ...baseStyles,
      ...overrides.styles,
    },
  };
}

describe('detectComponents', () => {
  it('detects button candidates with confidence, evidence, and style values', () => {
    const components = detectComponents([
      sample({
        tagName: 'button',
        className: 'primary cta',
        text: 'Buy now',
        rect: { width: 128, height: 40, top: 80, left: 40 },
        styles: {
          color: '#ffffff',
          backgroundColor: '#2563eb',
          borderTopColor: '#1d4ed8',
          borderRightColor: '#1d4ed8',
          borderBottomColor: '#1d4ed8',
          borderLeftColor: '#1d4ed8',
          borderTopWidth: '1px',
          borderRightWidth: '1px',
          borderBottomWidth: '1px',
          borderLeftWidth: '1px',
          cursor: 'pointer',
          paddingTop: '10px',
          paddingRight: '16px',
          paddingBottom: '10px',
          paddingLeft: '16px',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          borderBottomRightRadius: '8px',
          borderBottomLeftRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
        },
      }),
    ]);

    expect(components.button).toHaveLength(1);
    expect(components.button?.[0]).toEqual(
      expect.objectContaining({
        kind: 'button',
        count: 1,
        confidence: expect.any(Number),
        style: expect.objectContaining({
          color: '#ffffff',
          backgroundColor: '#2563eb',
          borderColor: '#1d4ed8',
          borderRadius: '8px',
          padding: '10px 16px',
          height: '40px',
          fontSize: '14px',
          fontWeight: '600',
        }),
        evidence: expect.arrayContaining(['button tag +5', 'cursor:pointer +2', 'non-transparent background +2']),
      }),
    );
    expect(components.button?.[0].confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('detects card candidates from layout, surface, border, shadow, and child evidence', () => {
    const components = detectComponents([
      sample({
        tagName: 'section',
        className: 'feature card',
        rect: { width: 320, height: 180, top: 120, left: 40 },
        hasHeading: true,
        hasImage: true,
        hasButton: true,
        styles: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          borderRightColor: '#e5e7eb',
          borderBottomColor: '#e5e7eb',
          borderLeftColor: '#e5e7eb',
          borderTopWidth: '1px',
          borderRightWidth: '1px',
          borderBottomWidth: '1px',
          borderLeftWidth: '1px',
          paddingTop: '20px',
          paddingRight: '24px',
          paddingBottom: '20px',
          paddingLeft: '24px',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          borderBottomRightRadius: '16px',
          borderBottomLeftRadius: '16px',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.14)',
          fontSize: '16px',
          fontWeight: '400',
        },
      }),
    ]);

    expect(components.card).toHaveLength(1);
    expect(components.card?.[0]).toEqual(
      expect.objectContaining({
        kind: 'card',
        confidence: expect.any(Number),
        style: expect.objectContaining({
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb',
          borderRadius: '16px',
          padding: '20px 24px',
          height: '180px',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.14)',
        }),
        evidence: expect.arrayContaining(['padding >= 12 +2', 'border-radius >= 8 +2', 'contains heading/image/button +2']),
      }),
    );
    expect(components.card?.[0].confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('extracts input styles directly for form controls', () => {
    const components = detectComponents([
      sample({
        tagName: 'input',
        rect: { width: 240, height: 38, top: 220, left: 40 },
        styles: {
          color: '#111827',
          backgroundColor: '#ffffff',
          borderTopColor: '#d1d5db',
          borderRightColor: '#d1d5db',
          borderBottomColor: '#d1d5db',
          borderLeftColor: '#d1d5db',
          borderTopWidth: '1px',
          borderRightWidth: '1px',
          borderBottomWidth: '1px',
          borderLeftWidth: '1px',
          paddingTop: '8px',
          paddingRight: '12px',
          paddingBottom: '8px',
          paddingLeft: '12px',
          borderTopLeftRadius: '6px',
          borderTopRightRadius: '6px',
          borderBottomRightRadius: '6px',
          borderBottomLeftRadius: '6px',
          fontSize: '15px',
          fontWeight: '400',
        },
      }),
    ]);

    expect(components.input).toHaveLength(1);
    expect(components.input?.[0]).toEqual(
      expect.objectContaining({
        kind: 'input',
        confidence: 0.95,
        style: expect.objectContaining({
          color: '#111827',
          backgroundColor: '#ffffff',
          borderColor: '#d1d5db',
          borderRadius: '6px',
          padding: '8px 12px',
          height: '38px',
          fontSize: '15px',
          fontWeight: '400',
        }),
        evidence: expect.arrayContaining(['input candidate: input']),
      }),
    );
  });
});
