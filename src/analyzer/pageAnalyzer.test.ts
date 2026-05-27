import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  analyzeCurrentPage,
  collectColorSamples,
  collectLayoutSamples,
  collectPageMeta,
  collectVisibleElements,
  extractCssVariables,
} from './pageAnalyzer';

describe('page analyzer foundation', () => {
  beforeEach(() => {
    document.head.innerHTML = '<title>Example Product</title>';
    document.body.innerHTML = `
      <header style="--header-bg: #ffffff">Header</header>
      <main style="--brand-primary: #2563eb">
        <button style="--button-radius: 8px; background: #2563eb; color: #ffffff; cursor: pointer; padding: 10px 16px; border-top-left-radius: 8px; border-top-right-radius: 8px; border-bottom-right-radius: 8px; border-bottom-left-radius: 8px; height: 40px; font-size: 14px; font-weight: 600">Buy now</button>
        <a href="/docs" style="--link-color: #1d4ed8">Docs</a>
        <input style="--input-border: #d1d5db; border: 1px solid #d1d5db; border-top-left-radius: 6px; border-top-right-radius: 6px; border-bottom-right-radius: 6px; border-bottom-left-radius: 6px; padding: 8px 12px; height: 38px; font-size: 15px" />
        <section class="feature-card" style="background: #ffffff; border: 1px solid #e5e7eb; padding: 16px; gap: 24px; width: 320px; min-height: 120px; border-top-left-radius: 12px; border-top-right-radius: 12px; border-bottom-right-radius: 12px; border-bottom-left-radius: 12px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.14)">
          <h1 style="font-size: 40px; line-height: 48px; font-weight: 700">Headline</h1>
          <p style="font-size: 16px; line-height: 24px">Body copy</p>
        </section>
        <button id="below-fold" style="background: #dc2626; color: #ffffff">Below fold</button>
        <button id="zero-size" style="background: #16a34a; color: #ffffff">Zero size</button>
      </main>
      <div style="display: none">Hidden</div>
    `;

    document.documentElement.style.setProperty('--root-color', '#111827');
    document.body.style.setProperty('--body-bg', '#f8fafc');
    document.body.style.backgroundColor = '#f8fafc';
    window.history.replaceState({}, '', '/products?ref=test');
    vi.stubGlobal('innerWidth', 1024);
    vi.stubGlobal('innerHeight', 768);

    setRect(document.documentElement, { width: 1024, height: 768, top: 0, left: 0 });
    setRect(document.body, { width: 1024, height: 768, top: 0, left: 0 });
    setRect('header', { width: 1024, height: 64, top: 0, left: 0 });
    setRect('main', { width: 1024, height: 520, top: 80, left: 0 });
    setRect('button:not(#below-fold):not(#zero-size)', { width: 140, height: 40, top: 112, left: 24 });
    setRect('a', { width: 64, height: 24, top: 116, left: 180 });
    setRect('input', { width: 220, height: 38, top: 168, left: 24 });
    setRect('section', { width: 320, height: 160, top: 224, left: 24 });
    setRect('h1', { width: 260, height: 48, top: 240, left: 40 });
    setRect('p', { width: 220, height: 24, top: 304, left: 40 });
    setRect('#below-fold', { width: 160, height: 40, top: 940, left: 24 });
    setRect('#zero-size', { width: 0, height: 0, top: 420, left: 24 });
  });

  it('collects page metadata without page content', () => {
    const meta = collectPageMeta();

    expect(meta).toEqual({
      title: 'Example Product',
      url: 'http://localhost:3000/products?ref=test',
      hostname: 'localhost',
      analyzedAt: expect.any(String),
      favicon: expect.any(String),
    });
  });

  it('collects visible elements up to the requested limit', () => {
    const elements = collectVisibleElements({ limit: 3 });

    expect(elements).toHaveLength(3);
    expect(elements.map((element) => element.tagName)).toEqual(['header', 'main', 'button']);
  });

  it('ignores hidden, zero-size, and off-viewport elements', () => {
    const elements = collectVisibleElements();

    expect(elements.map((element) => element.id)).not.toContain('below-fold');
    expect(elements.map((element) => element.id)).not.toContain('zero-size');
    expect(elements.map((element) => element.tagName)).not.toContain('div');
  });

  it('keeps html and body baseline samples while filtering off-viewport token samples', () => {
    const colorSamples = collectColorSamples();
    const layoutSamples = collectLayoutSamples();

    expect(colorSamples.slice(0, 2).map((sample) => sample.tagName)).toEqual(['html', 'body']);
    expect(layoutSamples.slice(0, 2).map((sample) => sample.tagName)).toEqual(['html', 'body']);
    expect(colorSamples.map((sample) => sample.id)).not.toContain('below-fold');
    expect(layoutSamples.map((sample) => sample.id)).not.toContain('below-fold');
  });

  it('extracts css variables from root, body, and key elements', () => {
    const cssVariables = extractCssVariables();

    expect(cssVariables).toEqual(
      expect.arrayContaining([
        { name: '--root-color', value: '#111827', source: 'documentElement' },
        { name: '--body-bg', value: '#f8fafc', source: 'body' },
        { name: '--brand-primary', value: '#2563eb', source: 'main' },
        { name: '--button-radius', value: '8px', source: 'button' },
        { name: '--link-color', value: '#1d4ed8', source: 'a' },
        { name: '--input-border', value: '#d1d5db', source: 'input' },
      ]),
    );
  });

  it('returns a basic design snapshot with raw counts', () => {
    const snapshot = analyzeCurrentPage();

    expect(snapshot.meta.hostname).toBe('localhost');
    expect(snapshot.raw.cssVariables.length).toBeGreaterThanOrEqual(6);
    expect(snapshot.raw.elementCounts.totalVisible).toBeGreaterThanOrEqual(4);
    expect(snapshot.raw.elementCounts.byTag.button).toBe(1);
    expect(snapshot.raw.elementCounts.limitedTo).toBe(800);
    expect(snapshot.tokens.colors.primary.value).toBe('#2563EB');
    expect(snapshot.tokens.colors.background.value).toBe('#F8FAFC');
    expect(snapshot.tokens.colors.primary.evidence.length).toBeGreaterThan(0);
    expect(snapshot.tokens.typography.roles.heading).toEqual(expect.objectContaining({ fontSize: 40, lineHeight: 48 }));
    expect(snapshot.tokens.spacing.scale.md).toEqual(expect.objectContaining({ value: 16 }));
    expect(snapshot.tokens.radius.values).toEqual(expect.arrayContaining([expect.objectContaining({ value: 12 })]));
    expect(snapshot.tokens.shadows.scale.card).toEqual(expect.objectContaining({ value: '0 4px 12px rgba(15, 23, 42, 0.14)' }));
    expect(snapshot.components.button?.[0]).toEqual(
      expect.objectContaining({
        kind: 'button',
        style: expect.objectContaining({ backgroundColor: 'rgb(37, 99, 235)', borderRadius: '8px' }),
        evidence: expect.arrayContaining(['button tag +5']),
      }),
    );
    expect(snapshot.components.card?.[0]).toEqual(
      expect.objectContaining({
        kind: 'card',
        style: expect.objectContaining({ boxShadow: '0 4px 12px rgba(15, 23, 42, 0.14)' }),
      }),
    );
    expect(snapshot.components.input?.[0]).toEqual(
      expect.objectContaining({
        kind: 'input',
        style: expect.objectContaining({ borderColor: 'rgb(209, 213, 219)', height: '38px' }),
      }),
    );
  });
});

function setRect(target: string | HTMLElement, rect: { width: number; height: number; top: number; left: number }): void {
  const element = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (!element) {
    throw new Error(`Missing element for rect: ${target}`);
  }

  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    ...rect,
    x: rect.left,
    y: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    toJSON: () => rect,
  } as DOMRect);
}
