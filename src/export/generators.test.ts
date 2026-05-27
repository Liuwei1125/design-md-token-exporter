import { describe, expect, it } from 'vitest';
import type { DesignSnapshot } from '../analyzer/types';
import {
  generateCssVariables,
  generateDesignMd,
  generateTailwindConfig,
  generateTokensJson,
} from './generators';
import { applyUserCorrections } from '../store/design-store';

const snapshot: DesignSnapshot = {
  meta: {
    title: 'Token Page',
    url: 'https://example.com',
    hostname: 'example.com',
    analyzedAt: '2026-05-26T00:00:00.000Z',
  },
  raw: {
    cssVariables: [{ name: '--brand-blue', value: '#2563EB', source: ':root' }],
    elementCounts: {
      totalVisible: 12,
      limitedTo: 800,
      byTag: { button: 3, input: 2 },
    },
    colorTokens: [],
  },
  tokens: {
    colors: {
      primary: {
        value: '#2563EB',
        confidence: 0.92,
        evidence: ['backgroundColor on button.primary'],
        warnings: [],
      },
      primaryForeground: {
        value: '#FFFFFF',
        confidence: 0.84,
        evidence: ['color on button.primary'],
        warnings: [],
      },
      background: {
        value: '#F8FAFC',
        confidence: 0.9,
        evidence: ['body background'],
        warnings: [],
      },
      surface: {
        value: '#FFFFFF',
        confidence: 0.86,
        evidence: ['card background'],
        warnings: [],
      },
      textPrimary: {
        value: '#0F172A',
        confidence: 0.95,
        evidence: ['body color'],
        warnings: [],
      },
      textSecondary: {
        value: '#64748B',
        confidence: 0.7,
        evidence: ['muted paragraph'],
        warnings: [],
      },
      border: {
        value: '#E2E8F0',
        confidence: 0.72,
        evidence: ['input border'],
        warnings: [],
      },
      warnings: ['No known design system signature matched'],
    },
    typography: {
      fontFamilies: [{ value: 'Inter, system-ui, sans-serif', frequency: 9, usage: ['body'], evidence: ['body'] }],
      fontSizes: [],
      fontWeights: [],
      lineHeights: [],
      letterSpacings: [],
      styles: [],
      roles: {
        heading: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 32,
          fontWeight: 700,
          lineHeight: 40,
          letterSpacing: 0,
          confidence: 0.82,
          evidence: ['h1'],
        },
        body: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 16,
          fontWeight: 400,
          lineHeight: 24,
          letterSpacing: 0,
          confidence: 0.88,
          evidence: ['body'],
        },
      },
    },
    spacing: {
      baseUnit: 4,
      values: [],
      scale: {
        xs: { value: 4, frequency: 1, usage: ['gap'], evidence: ['toolbar gap'] },
        md: { value: 16, frequency: 4, usage: ['padding'], evidence: ['card padding'] },
        xl: { value: 32, frequency: 2, usage: ['margin'], evidence: ['section margin'] },
      },
    },
    radius: {
      values: [],
      scale: {
        sm: { value: 4, frequency: 1, usage: ['borderRadius'], evidence: ['input radius'] },
        md: { value: 8, frequency: 3, usage: ['borderRadius'], evidence: ['button radius'] },
        full: { value: 9999, frequency: 1, usage: ['borderRadius'], evidence: ['pill radius'] },
      },
    },
    shadows: {
      values: [],
      scale: {
        card: {
          value: '0 12px 32px rgba(15, 23, 42, 0.12)',
          frequency: 2,
          usage: ['boxShadow'],
          evidence: ['card shadow'],
          type: 'boxShadow',
          offsetX: 0,
          offsetY: 12,
          blur: 32,
          spread: 0,
          score: 4,
        },
      },
    },
  },
  components: {
    button: [
      {
        kind: 'button',
        count: 3,
        confidence: 0.8,
        style: {
          backgroundColor: '#2563EB',
          color: '#FFFFFF',
          borderRadius: '8px',
          padding: '8px 16px',
        },
        evidence: ['button.primary'],
      },
    ],
  },
  designSystem: {
    id: 'shadcn',
    label: 'shadcn/ui',
    confidence: 0.84,
    evidence: ['CSS variable --primary', 'class bg-background'],
  },
};

describe('export generators', () => {
  it('generates a structured AI-coding-friendly DESIGN.md specification', () => {
    const designMd = generateDesignMd(snapshot);

    expect(designMd).toMatch(/^---\nversion: alpha\nname: extracted-design-system\n/);
    expect(designMd).toContain('source:');
    expect(designMd).toContain('  hostname: "example.com"');
    expect(designMd).toContain('designSystem:');
    expect(designMd).toContain('  id: "shadcn"');
    expect(designMd).toContain('  label: "shadcn/ui"');
    expect(designMd).toContain('Design system signal: shadcn/ui');
    expect(designMd).toContain('colors:');
    expect(designMd).toContain('  primary: "#2563EB"');
    expect(designMd).toContain('  on-primary: "#FFFFFF"');
    expect(designMd).toContain('typography:');
    expect(designMd).toContain('  display:');
    expect(designMd).toContain('  body-md:');
    expect(designMd).toContain('rounded:');
    expect(designMd).toContain('  md: 8px');
    expect(designMd).toContain('spacing:');
    expect(designMd).toContain('  md: 16px');
    expect(designMd).toContain('components:');
    expect(designMd).toContain('  button-primary:');
    expect(designMd).toContain('    backgroundColor: "{colors.primary}"');
    expect(designMd).toContain('    textColor: "{colors.on-primary}"');
    expect(designMd).toContain('---\n\n# DESIGN.md');
    expect(designMd).toContain('## Overview');
    expect(designMd).toContain('## Key Characteristics');
    expect(designMd).toContain('## Colors');
    expect(designMd).toContain('`{colors.primary}`');
    expect(designMd).toContain('## Typography');
    expect(designMd).toContain('## Layout');
    expect(designMd).toContain('## Elevation & Shapes');
    expect(designMd).toContain('## Components');
    expect(designMd).toContain('## Interaction States');
    expect(designMd).toContain('Focus: use a visible');
    expect(designMd).toContain('## Do');
    expect(designMd).toContain('## Do Not');
    expect(designMd).toContain('## Usage Notes');
    expect(designMd).toContain('Use semantic tokens first');
    expect(designMd).toContain('## Known Gaps');
    expect(designMd.length).toBeLessThan(9000);
  });

  it('generates semantic CSS variables', () => {
    const css = generateCssVariables(snapshot);

    expect(css).toContain(':root {');
    expect(css).toContain('--design-color-primary: #2563EB;');
    expect(css).toContain('--design-color-background: #F8FAFC;');
    expect(css).toContain('--design-font-family-sans: Inter, system-ui, sans-serif;');
    expect(css).toContain('--design-spacing-md: 16px;');
    expect(css).toContain('--design-radius-full: 9999px;');
    expect(css).toContain('--design-shadow-card: 0 12px 32px rgba(15, 23, 42, 0.12);');
  });

  it('generates Tailwind config that references CSS variables', () => {
    const config = generateTailwindConfig(snapshot);

    expect(config).toContain('colors: {');
    expect(config).toContain("primary: 'var(--design-color-primary)'");
    expect(config).toContain("background: 'var(--design-color-background)'");
    expect(config).toContain("fontFamily: {");
    expect(config).toContain("sans: ['var(--design-font-family-sans)']");
    expect(config).toContain("spacing: {");
    expect(config).toContain("md: 'var(--design-spacing-md)'");
    expect(config).toContain("borderRadius: {");
    expect(config).toContain("full: 'var(--design-radius-full)'");
    expect(config).not.toContain('#2563EB');
  });

  it('generates DTCG-like tokens.json with $type and $value', () => {
    const tokens = JSON.parse(generateTokensJson(snapshot));

    expect(tokens.$schema).toBe('https://design-tokens.github.io/community-group/format/');
    expect(tokens.color.primary).toEqual({ $type: 'color', $value: '#2563EB' });
    expect(tokens.color.background).toEqual({ $type: 'color', $value: '#F8FAFC' });
    expect(tokens.typography.heading).toMatchObject({
      $type: 'typography',
      $value: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '32px',
        fontWeight: 700,
        lineHeight: '40px',
      },
    });
    expect(tokens.spacing.md).toEqual({ $type: 'dimension', $value: '16px' });
    expect(tokens.radius.full).toEqual({ $type: 'dimension', $value: '9999px' });
    expect(tokens.shadow.card).toEqual({ $type: 'shadow', $value: '0 12px 32px rgba(15, 23, 42, 0.12)' });
  });

  it('does not reintroduce ignored spacing or radius values in derived DESIGN.md tokens', () => {
    const corrected = applyUserCorrections(snapshot, {
      ignoredTokens: {
        spacing: [32],
        radius: [9999],
      },
    });

    const designMd = generateDesignMd(corrected);

    expect(corrected.tokens.spacing.scale.xl).toBeUndefined();
    expect(corrected.tokens.radius.scale.full).toBeUndefined();
    expect(designMd).not.toContain('  xl: 32px');
    expect(designMd).not.toContain('  pill: 9999px');
    expect(designMd).not.toContain('  full: 9999px');
  });
});
