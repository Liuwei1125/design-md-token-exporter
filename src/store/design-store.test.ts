import { describe, expect, it } from 'vitest';
import type { DesignSnapshot } from '../analyzer/types';
import { applyUserCorrections, type UserCorrections } from './design-store';

const baseSnapshot: DesignSnapshot = {
  meta: {
    title: 'Token Page',
    url: 'https://example.com',
    hostname: 'example.com',
    analyzedAt: '2026-05-26T00:00:00.000Z',
  },
  raw: {
    cssVariables: [],
    elementCounts: {
      totalVisible: 4,
      limitedTo: 800,
      byTag: { body: 1, button: 1, div: 2 },
    },
    colorTokens: [],
  },
  tokens: {
    colors: {
      primary: {
        value: '#2563EB',
        confidence: 0.91,
        evidence: ['backgroundColor on button.cta "Start"'],
        warnings: [],
      },
      background: {
        value: '#F8FAFC',
        confidence: 0.88,
        evidence: ['backgroundColor on body'],
        warnings: [],
      },
      surface: {
        value: '#FFFFFF',
        confidence: 0.8,
        evidence: ['backgroundColor on div.card'],
        warnings: [],
      },
      textPrimary: {
        value: '#111827',
        confidence: 0.96,
        evidence: ['color on body'],
        warnings: [],
      },
      textSecondary: {
        value: '#6B7280',
        confidence: 0.7,
        evidence: ['color on p.muted'],
        warnings: ['low text secondary contrast'],
      },
      border: {
        value: '#E5E7EB',
        confidence: 0.72,
        evidence: ['borderColor on input'],
        warnings: [],
      },
      neutral: {
        value: '#737373',
        confidence: 0.54,
        evidence: ['color on small.meta'],
        warnings: ['neutral has weak supporting evidence'],
      },
      warnings: ['primary: similar to background'],
    },
    typography: {
      fontFamilies: [
        { value: 'Inter, system-ui, sans-serif', frequency: 4, usage: ['body'], evidence: ['body'] },
        { value: 'Georgia, serif', frequency: 1, usage: ['blockquote'], evidence: ['blockquote'] },
      ],
      fontSizes: [],
      fontWeights: [],
      lineHeights: [],
      letterSpacings: [],
      styles: [],
      roles: {
        body: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 16,
          fontWeight: 400,
          lineHeight: 24,
          letterSpacing: 0,
          confidence: 0.86,
          evidence: ['body text'],
        },
        heading: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 32,
          fontWeight: 700,
          lineHeight: 40,
          letterSpacing: 0,
          confidence: 0.82,
          evidence: ['h1'],
        },
      },
    },
    spacing: {
      baseUnit: 4,
      values: [
        { value: 16, frequency: 6, usage: ['padding'], evidence: ['padding on card'] },
        { value: 32, frequency: 1, usage: ['margin'], evidence: ['margin on hero'] },
      ],
      scale: {
        md: { value: 16, frequency: 6, usage: ['padding'], evidence: ['padding on card'] },
        xl: { value: 32, frequency: 1, usage: ['margin'], evidence: ['margin on hero'] },
      },
    },
    radius: {
      values: [
        { value: 8, frequency: 3, usage: ['borderRadius'], evidence: ['button radius'] },
        { value: 980, frequency: 1, usage: ['borderRadius'], evidence: ['pill radius'] },
      ],
      scale: {
        md: { value: 8, frequency: 3, usage: ['borderRadius'], evidence: ['button radius'] },
        full: { value: 980, frequency: 1, usage: ['borderRadius'], evidence: ['pill radius'] },
      },
    },
    shadows: {
      values: [],
      scale: {},
    },
  },
  components: {},
};

describe('applyUserCorrections', () => {
  it('overrides editable token values while preserving original evidence and warnings', () => {
    const corrections: UserCorrections = {
      colors: {
        primary: '#14B8A6',
        background: '#020617',
        surface: '#0F172A',
        textPrimary: '#F8FAFC',
        textSecondary: '#CBD5E1',
        border: '#334155',
      },
      fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
      radius: {
        md: 12,
        full: 9999,
      },
      spacing: {
        xs: 4,
        md: 20,
        xl: 48,
      },
    };

    const corrected = applyUserCorrections(baseSnapshot, corrections);

    expect(corrected.tokens.colors.primary).toMatchObject({
      value: '#14B8A6',
      confidence: 1,
      evidence: ['User correction: primary', 'backgroundColor on button.cta "Start"'],
      warnings: [],
    });
    expect(corrected.tokens.colors.background.value).toBe('#020617');
    expect(corrected.tokens.colors.surface?.value).toBe('#0F172A');
    expect(corrected.tokens.colors.textPrimary.value).toBe('#F8FAFC');
    expect(corrected.tokens.colors.textSecondary?.value).toBe('#CBD5E1');
    expect(corrected.tokens.colors.border?.value).toBe('#334155');
    expect(corrected.tokens.colors.textSecondary?.warnings).toContain('low text secondary contrast');
    expect(corrected.tokens.colors.warnings).toEqual(['primary: similar to background']);
    expect(corrected.tokens.typography.fontFamilies[0]?.value).toBe('IBM Plex Sans, system-ui, sans-serif');
    expect(corrected.tokens.typography.roles.body?.fontFamily).toBe('IBM Plex Sans, system-ui, sans-serif');
    expect(corrected.tokens.typography.roles.heading?.fontFamily).toBe('IBM Plex Sans, system-ui, sans-serif');
    expect(corrected.tokens.radius.scale.md?.value).toBe(12);
    expect(corrected.tokens.radius.scale.full?.value).toBe(9999);
    expect(corrected.tokens.radius.scale.full?.evidence).toContain('User correction: radius.full');
    expect(corrected.tokens.radius.values.some((token) => token.value === 12)).toBe(true);
    expect(corrected.tokens.spacing.scale.md?.value).toBe(20);
    expect(corrected.tokens.spacing.scale.xs?.value).toBe(4);
    expect(corrected.tokens.spacing.scale.xl?.value).toBe(48);
    expect(corrected.tokens.spacing.scale.xl?.evidence).toContain('User correction: spacing.xl');
    expect(corrected.tokens.spacing.values.some((token) => token.value === 48)).toBe(true);
  });

  it('returns the original snapshot when no corrections are present', () => {
    expect(applyUserCorrections(baseSnapshot, {})).toBe(baseSnapshot);
  });

  it('filters ignored noisy token values from corrected snapshots', () => {
    const corrected = applyUserCorrections(baseSnapshot, {
      ignoredTokens: {
        colors: ['#737373'],
        fontFamilies: ['Georgia, serif'],
        spacing: [32],
        radius: [980],
      },
    });

    expect(corrected).not.toBe(baseSnapshot);
    expect(corrected.tokens.colors.neutral).toBeUndefined();
    expect(corrected.tokens.typography.fontFamilies.map((token) => token.value)).not.toContain('Georgia, serif');
    expect(corrected.tokens.spacing.values.map((token) => token.value)).not.toContain(32);
    expect(corrected.tokens.spacing.scale.xl).toBeUndefined();
    expect(corrected.tokens.radius.values.map((token) => token.value)).not.toContain(980);
    expect(corrected.tokens.radius.scale.full).toBeUndefined();
  });
});
