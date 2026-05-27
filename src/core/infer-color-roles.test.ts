import { describe, expect, it } from 'vitest';
import { extractColorTokens } from './extract-colors';
import { inferColorRoles } from './infer-color-roles';
import type { ColorElementSample } from './types';

function sample(overrides: Partial<ColorElementSample>): ColorElementSample {
  return {
    tagName: 'div',
    rect: { width: 100, height: 32, top: 0, left: 0 },
    text: '',
    id: '',
    className: '',
    role: '',
    ariaSelected: false,
    ariaCurrent: null,
    styles: {
      color: 'transparent',
      backgroundColor: 'transparent',
      backgroundImage: 'none',
      borderTopColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: 'transparent',
      borderLeftColor: 'transparent',
      outlineColor: 'transparent',
      textDecorationColor: 'transparent',
    },
    ...overrides,
  };
}

describe('inferColorRoles', () => {
  it('prefers CTA backgrounds over generic text and infers core semantic roles', () => {
    const observed = extractColorTokens([
      sample({
        tagName: 'html',
        rect: { width: 1280, height: 900, top: 0, left: 0 },
        styles: { ...sample({}).styles, backgroundColor: '#f8fafc' },
      }),
      sample({
        tagName: 'main',
        rect: { width: 960, height: 600, top: 80, left: 0 },
        className: 'app surface',
        styles: { ...sample({}).styles, backgroundColor: '#ffffff' },
      }),
      sample({
        tagName: 'button',
        text: 'Buy now',
        className: 'primary cta',
        styles: { ...sample({}).styles, color: '#ffffff', backgroundColor: '#2563eb' },
      }),
      sample({
        tagName: 'a',
        text: 'Learn more',
        styles: { ...sample({}).styles, color: '#1d4ed8' },
      }),
      sample({
        tagName: 'p',
        text: 'Body copy',
        styles: { ...sample({}).styles, color: '#111827' },
      }),
      sample({
        tagName: 'span',
        className: 'muted',
        text: 'Secondary',
        styles: { ...sample({}).styles, color: '#6b7280' },
      }),
      sample({
        tagName: 'input',
        styles: {
          ...sample({}).styles,
          color: '#111827',
          backgroundColor: '#ffffff',
          borderTopColor: '#d1d5db',
          borderRightColor: '#d1d5db',
          borderBottomColor: '#d1d5db',
          borderLeftColor: '#d1d5db',
        },
      }),
    ]);

    const colors = inferColorRoles(observed);

    expect(colors.primary.value).toBe('#2563EB');
    expect(colors.primaryForeground?.value).toBe('#FFFFFF');
    expect(colors.background.value).toBe('#F8FAFC');
    expect(colors.surface?.value).toBe('#FFFFFF');
    expect(colors.textPrimary.value).toBe('#111827');
    expect(colors.textSecondary?.value).toBe('#6B7280');
    expect(colors.border?.value).toBe('#D1D5DB');
    expect(colors.primary.confidence).toBeGreaterThan(0.7);
    expect(colors.primary.evidence[0]).toContain('button');
  });

  it('detects active states, English and Chinese action intent, and status colors', () => {
    const observed = extractColorTokens([
      sample({
        tagName: 'body',
        rect: { width: 1280, height: 900, top: 0, left: 0 },
        styles: { ...sample({}).styles, backgroundColor: '#ffffff' },
      }),
      sample({
        tagName: 'a',
        text: '登录',
        ariaCurrent: 'page',
        className: 'nav active',
        styles: { ...sample({}).styles, color: '#7c3aed', borderBottomColor: '#7c3aed' },
      }),
      sample({
        tagName: 'button',
        text: 'Submit order',
        styles: { ...sample({}).styles, backgroundColor: '#7c3aed', color: '#ffffff' },
      }),
      sample({
        tagName: 'div',
        className: 'alert success',
        styles: { ...sample({}).styles, backgroundColor: '#16a34a' },
      }),
      sample({
        tagName: 'div',
        className: 'alert warning',
        styles: { ...sample({}).styles, backgroundColor: '#f59e0b' },
      }),
      sample({
        tagName: 'div',
        className: 'alert danger error',
        styles: { ...sample({}).styles, backgroundColor: '#dc2626' },
      }),
    ]);

    const colors = inferColorRoles(observed);

    expect(colors.primary.value).toBe('#7C3AED');
    expect(colors.success?.value).toBe('#16A34A');
    expect(colors.warning?.value).toBe('#F59E0B');
    expect(colors.danger?.value).toBe('#DC2626');
    expect(colors.primary.evidence.join(' ')).toMatch(/active|Submit order|登录/);
  });
});
