import { describe, expect, it } from 'vitest';
import { detectDesignSystem } from './detect-design-system';
import type { LayoutElementSample, LayoutStyleSample } from './types';

describe('detectDesignSystem', () => {
  it('detects shadcn/ui from semantic CSS variables and utility classes', () => {
    const detection = detectDesignSystem({
      cssVariables: [
        { name: '--background', value: '0 0% 100%', source: ':root' },
        { name: '--foreground', value: '222.2 84% 4.9%', source: ':root' },
        { name: '--primary', value: '222.2 47.4% 11.2%', source: ':root' },
        { name: '--primary-foreground', value: '210 40% 98%', source: ':root' },
        { name: '--ring', value: '222.2 84% 4.9%', source: ':root' },
        { name: '--radius', value: '0.5rem', source: ':root' },
      ],
      layoutSamples: [sample('button', 'inline-flex bg-background text-foreground border-input data-[state=open]')],
    });

    expect(detection.id).toBe('shadcn');
    expect(detection.label).toBe('shadcn/ui');
    expect(detection.confidence).toBeGreaterThan(0.7);
    expect(detection.evidence).toEqual(expect.arrayContaining(['CSS variable --primary', 'class bg-background']));
  });

  it('detects common framework signatures from visible classes and CSS variables', () => {
    expect(
      detectDesignSystem({
        cssVariables: [{ name: '--bs-primary', value: '#0d6efd', source: ':root' }],
        layoutSamples: [sample('button', 'btn btn-primary'), sample('div', 'container row col-md-6 card')],
      }).id,
    ).toBe('bootstrap');

    expect(
      detectDesignSystem({
        cssVariables: [{ name: '--ant-primary-color', value: '#1677ff', source: ':root' }],
        layoutSamples: [sample('button', 'ant-btn ant-btn-primary'), sample('div', 'ant-card ant-input')],
      }).id,
    ).toBe('antd');

    expect(
      detectDesignSystem({
        cssVariables: [{ name: '--md-sys-color-primary', value: '#6750a4', source: ':root' }],
        layoutSamples: [sample('button', 'mdc-button mat-mdc-raised-button'), sample('div', 'MuiButton-root')],
      }).id,
    ).toBe('material');

    expect(
      detectDesignSystem({
        cssVariables: [{ name: '--color-accent-fg', value: '#0969da', source: ':root' }],
        layoutSamples: [sample('button', 'Button btn-primary'), sample('div', 'Box color-bg-default color-fg-default')],
      }).id,
    ).toBe('primer');
  });

  it('falls back to generic when evidence is weak', () => {
    const detection = detectDesignSystem({
      cssVariables: [{ name: '--brand-color', value: '#2563eb', source: ':root' }],
      layoutSamples: [sample('button', 'primary-action')],
    });

    expect(detection).toEqual({
      id: 'generic',
      label: 'Generic',
      confidence: 0.1,
      evidence: ['No known design system signature matched'],
    });
  });
});

function sample(tagName: string, className: string): LayoutElementSample {
  return {
    tagName,
    className,
    rect: { width: 120, height: 40, top: 0, left: 0 },
    styles: baseStyles(),
  };
}

function baseStyles(): LayoutStyleSample {
  return {
    color: '',
    backgroundColor: '',
    borderTopColor: '',
    borderRightColor: '',
    borderBottomColor: '',
    borderLeftColor: '',
    borderTopWidth: '',
    borderRightWidth: '',
    borderBottomWidth: '',
    borderLeftWidth: '',
    cursor: '',
    width: '',
    height: '',
    fontFamily: '',
    fontSize: '',
    fontWeight: '',
    lineHeight: '',
    letterSpacing: '',
    paddingTop: '',
    paddingRight: '',
    paddingBottom: '',
    paddingLeft: '',
    marginTop: '',
    marginRight: '',
    marginBottom: '',
    marginLeft: '',
    gap: '',
    rowGap: '',
    columnGap: '',
    borderTopLeftRadius: '',
    borderTopRightRadius: '',
    borderBottomRightRadius: '',
    borderBottomLeftRadius: '',
    borderRadius: '',
    boxShadow: '',
    textShadow: '',
  };
}
