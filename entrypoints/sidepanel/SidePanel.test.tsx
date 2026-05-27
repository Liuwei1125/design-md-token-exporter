import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SidePanel } from './SidePanel';

type StoredValues = Record<string, unknown>;

const storedSnapshot = {
  meta: {
    title: 'Token Page',
    url: 'https://example.com',
    hostname: 'example.com',
    analyzedAt: '2026-05-26T00:00:00.000Z',
  },
  raw: {
    cssVariables: [
      { name: '--background', value: '0 0% 100%', source: ':root' },
      { name: '--primary', value: '222.2 47.4% 11.2%', source: ':root' },
    ],
    elementCounts: {
      totalVisible: 4,
      limitedTo: 800,
      byTag: { a: 2, button: 1, textarea: 1 },
    },
    colorTokens: [],
  },
  tokens: {
    colors: {
      primary: {
        value: '#FFCC00',
        confidence: 0.94,
        evidence: ['backgroundColor on a.nav-cta "CONFIGURE A VERY LONG ACTION LABEL THAT USED TO OVERFLOW THE PANEL"'],
        warnings: [],
      },
      primaryForeground: {
        value: '#111111',
        confidence: 0.86,
        evidence: ['color on a.nav-cta "CONFIGURE"'],
        warnings: [],
      },
      background: {
        value: '#202020',
        confidence: 0.95,
        evidence: ['color on a.btn-white "CONFIGURE"'],
        warnings: [],
      },
      surface: {
        value: '#2A2A2A',
        confidence: 0.81,
        evidence: ['backgroundColor on div.card'],
        warnings: [],
      },
      textPrimary: {
        value: '#FFFFFF',
        confidence: 0.98,
        evidence: ['color on a.nav-cta "CONFIGURE"'],
        warnings: [],
      },
      textSecondary: {
        value: '#D1D5DB',
        confidence: 0.66,
        evidence: ['color on p.secondary'],
        warnings: ['textSecondary has limited supporting evidence'],
      },
      border: {
        value: '#404040',
        confidence: 0.72,
        evidence: ['borderColor on input.email'],
        warnings: [],
      },
      neutral: {
        value: '#737373',
        confidence: 0.61,
        evidence: ['color on small.meta'],
        warnings: ['neutral has weak supporting evidence'],
      },
      warnings: ['No known design system signature matched'],
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
        heading: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 32,
          fontWeight: 700,
          lineHeight: 40,
          letterSpacing: -0.2,
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
        caption: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 12,
          fontWeight: 400,
          lineHeight: 16,
          letterSpacing: 0,
          confidence: 0.64,
          evidence: ['small.meta'],
        },
      },
    },
    spacing: {
      baseUnit: 4,
      values: [
        { value: 4, frequency: 1, usage: ['gap'], evidence: ['gap on toolbar'] },
        { value: 16, frequency: 3, usage: ['padding'], evidence: ['padding on card'] },
        { value: 32, frequency: 2, usage: ['margin'], evidence: ['margin on section'] },
      ],
      scale: {
        xs: { value: 4, frequency: 1, usage: ['gap'], evidence: ['gap on toolbar'] },
        md: { value: 16, frequency: 3, usage: ['padding'], evidence: ['padding on card'] },
        xl: { value: 32, frequency: 2, usage: ['margin'], evidence: ['margin on section'] },
      },
    },
    radius: {
      values: [
        { value: 4, frequency: 1, usage: ['borderRadius'], evidence: ['input radius'] },
        { value: 8, frequency: 2, usage: ['borderRadius'], evidence: ['button radius'] },
        { value: 980, frequency: 1, usage: ['borderRadius'], evidence: ['pill radius'] },
      ],
      scale: {
        sm: { value: 4, frequency: 1, usage: ['borderRadius'], evidence: ['input radius'] },
        md: { value: 8, frequency: 2, usage: ['borderRadius'], evidence: ['button radius'] },
        full: { value: 980, frequency: 1, usage: ['borderRadius'], evidence: ['pill radius'] },
      },
    },
    shadows: {
      values: [],
      scale: {},
    },
  },
  components: {},
  designSystem: {
    id: 'shadcn',
    label: 'shadcn/ui',
    confidence: 0.74,
    evidence: ['CSS variable --primary', 'class bg-background'],
  },
};

describe('SidePanel', () => {
  let storedValues: StoredValues;

  beforeEach(() => {
    document.body.innerHTML = '';
    storedValues = {};
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(async () => undefined),
      },
    });

    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: storedValues[key] })),
          set: vi.fn(async (items: StoredValues) => {
            storedValues = { ...storedValues, ...items };
          }),
        },
      },
      runtime: {
        sendMessage: vi.fn(),
        openOptionsPage: vi.fn(async () => undefined),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the three empty workspace tabs without Preview', async () => {
    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<SidePanel />);
    });

    expect(host.textContent).toContain('Overview');
    expect(host.textContent).toContain('Tokens');
    expect(host.textContent).toContain('Export');
    expect(host.textContent).not.toContain('Preview');
    expect(host.textContent).toContain('Extraction summary will appear here');
  });

  it('keeps long color evidence in a bounded row detail', async () => {
    storedValues.lastSnapshot = storedSnapshot;

    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<SidePanel />);
    });

    const evidence = host.querySelector('[data-testid="color-token-evidence"]');

    expect(evidence?.textContent).toContain('backgroundColor on a.nav-cta');
    expect(evidence?.className).toContain('line-clamp-2');
    expect(evidence?.className).toContain('break-words');
  });

  it('renders overview trust signals from the corrected snapshot', async () => {
    storedValues.lastSnapshot = storedSnapshot;
    storedValues.userCorrections = {
      colors: {
        primary: '#14B8A6',
      },
    };

    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<SidePanel />);
    });

    expect(host.textContent).toContain('Mode');
    expect(host.textContent).toContain('Local Extraction');
    expect(host.textContent).toContain('Confidence');
    expect(host.textContent).toContain('100%');
    expect(host.textContent).toContain('shadcn/ui');
    expect(host.textContent).toContain('Found 2 CSS variables');
    expect(host.textContent).toContain('Design system signal: shadcn/ui');
    expect(host.textContent).toContain('No known design system signature matched');
    expect(host.textContent).toContain('#14B8A6');
    expect(host.textContent).toContain('User correction: primary');
    expect(host.textContent).toContain('Typography DNA');
    expect(host.textContent).toContain('Font Stack');
  });

  it('opens the extension settings page from the side panel header', async () => {
    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<SidePanel />);
    });

    const settingsButton = host.querySelector<HTMLButtonElement>('button[aria-label="Open settings"]');
    expect(settingsButton).toBeTruthy();

    await act(async () => {
      settingsButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Verify the inline settings drawer overlay is open
    expect(host.textContent).toContain('Settings');
    expect(host.textContent).toContain('Token corrections');
  });

  it('shows tokens as read-only when token corrections are disabled', async () => {
    storedValues.lastSnapshot = storedSnapshot;
    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<SidePanel />);
    });

    const tokensTab = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.includes('Tokens'));
    expect(tokensTab).toBeTruthy();

    await act(async () => {
      tokensTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const primaryInput = host.querySelector<HTMLInputElement>('input[aria-label="Primary token value"]');
    expect(primaryInput).toBeNull();
    expect(host.textContent).toContain('Token corrections disabled');
    expect(host.textContent).toContain('#FFCC00');
    expect(host.textContent).toContain('Radius sm');
    expect(host.textContent).toContain('Spacing xl');
  });

  it('renders a polished token specimen using corrected snapshot values in read-only mode', async () => {
    storedValues.lastSnapshot = storedSnapshot;
    storedValues.userCorrections = {
      colors: {
        primary: '#14B8A6',
      },
      fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
      radius: {
        md: 18,
      },
      spacing: {
        xl: 40,
      },
    };
    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<SidePanel />);
    });

    const tokensTab = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.includes('Tokens'));
    expect(tokensTab).toBeTruthy();

    await act(async () => {
      tokensTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(host.textContent).toContain('Color Palette');
    expect(host.textContent).toContain('Typography Scale');
    expect(host.textContent).toContain('Font Families');
    expect(host.textContent).toContain('Spacing & Shape');
    expect(host.textContent).toContain('Border Radius');
    expect(host.textContent).toContain('Extraction Notes');
    expect(host.textContent).toContain('The quick brown fox jumps');
    expect(host.textContent).toContain('Token Specimen');
    expect(host.textContent).toContain('Brand / Accent');
    expect(host.textContent).toContain('Surfaces / Text / Borders');
    expect(host.textContent).toContain('TYPE SCALE');
    expect(host.textContent).toContain('Purpose');
    expect(host.textContent).toContain('Preview');
    expect(host.textContent).toContain('#14B8A6');
    expect(host.textContent).toContain('IBM Plex Sans, system-ui, sans-serif');
    expect(host.textContent).toContain('18px');
    expect(host.textContent).toContain('40px');
    expect(host.textContent).toContain('980px');
    expect(host.textContent).toContain('neutral has weak supporting evidence');
    expect(host.querySelector('[data-testid="color-specimen-primary"]')).toBeTruthy();
    expect(host.querySelector('[data-testid="typography-specimen-heading"]')).toBeTruthy();
    expect(host.querySelector('[data-testid="spacing-specimen-xl"]')).toBeTruthy();
    expect(host.querySelector('[data-testid="spacing-scale-track"]')).toBeNull();
    expect(host.querySelector('[data-testid="spacing-scale-block-xl"]')).toBeTruthy();
    expect(host.querySelector('[data-testid="radius-specimen-md"]')).toBeTruthy();
    expect(host.querySelector('[data-testid="radius-specimen-lg"]')).toBeTruthy();
    expect(host.querySelector('[data-testid="radius-specimen-xl"]')).toBeTruthy();
    expect(host.textContent).toContain('Not detected');
    const fullRadiusPreview = host.querySelector<HTMLElement>('[data-testid="radius-preview-full"]');
    expect(fullRadiusPreview?.style.borderTopLeftRadius).toBe('64px');
    expect(fullRadiusPreview?.style.width).toBe('56px');
    expect(host.querySelector<HTMLInputElement>('input[aria-label="Primary token value"]')).toBeNull();
  });

  it('copies token values from specimen controls', async () => {
    storedValues.lastSnapshot = storedSnapshot;
    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<SidePanel />);
    });

    const tokensTab = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.includes('Tokens'));
    expect(tokensTab).toBeTruthy();

    await act(async () => {
      tokensTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const copyPrimary = host.querySelector<HTMLButtonElement>('button[aria-label="Copy Primary value"]');
    expect(copyPrimary).toBeTruthy();
    expect(copyPrimary?.className).toContain('opacity-0');

    await act(async () => {
      copyPrimary!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('#FFCC00');
    expect(copyPrimary?.textContent).toContain('Copied');

    const copyRadiusFull = host.querySelector<HTMLButtonElement>('button[aria-label="Copy Radius full value"]');
    expect(copyRadiusFull).toBeTruthy();
    expect(copyRadiusFull?.className).toContain('opacity-0');

    await act(async () => {
      copyRadiusFull!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('980px');
    expect(copyRadiusFull?.textContent).not.toContain('Copied');
    expect(copyRadiusFull?.getAttribute('title')).toBe('Copied');

    await act(async () => {
      copyRadiusFull!.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    });

    expect(copyRadiusFull?.getAttribute('title')).toBe('Copy 980px');

    const copyFontFamily = host.querySelector<HTMLButtonElement>('button[aria-label="Copy Primary font family value"]');
    expect(copyFontFamily).toBeTruthy();

    await act(async () => {
      copyFontFamily!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Inter, system-ui, sans-serif');
    expect(copyFontFamily?.textContent).not.toContain('Copied');
    expect(copyFontFamily?.getAttribute('title')).toBe('Copied');
  });

  it('edits tokens and persists user corrections when token corrections are enabled', async () => {
    storedValues.lastSnapshot = storedSnapshot;
    storedValues.extensionSettings = {
      tokens: {
        editingEnabled: true,
      },
    };
    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<SidePanel />);
    });

    const tokensTab = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.includes('Tokens'));
    expect(tokensTab).toBeTruthy();

    await act(async () => {
      tokensTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(host.textContent).toContain('Token corrections enabled');

    const primaryInput = host.querySelector<HTMLInputElement>('input[aria-label="Primary token value"]');
    expect(primaryInput?.value).toBe('#FFCC00');

    await act(async () => {
      primaryInput!.value = '#14B8A6';
      primaryInput!.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await vi.waitFor(() => {
      expect(storedValues.userCorrections).toEqual(
        expect.objectContaining({
          colors: expect.objectContaining({
            primary: '#14B8A6',
          }),
        }),
      );
    });

    const radiusSmInput = host.querySelector<HTMLInputElement>('input[aria-label="Radius sm token value"]');
    expect(radiusSmInput?.value).toBe('4');

    await act(async () => {
      radiusSmInput!.value = '6';
      radiusSmInput!.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await vi.waitFor(() => {
      expect(storedValues.userCorrections).toEqual(
        expect.objectContaining({
          radius: expect.objectContaining({
            sm: 6,
          }),
        }),
      );
    });

    const spacingXlInput = host.querySelector<HTMLInputElement>('input[aria-label="Spacing xl token value"]');
    expect(spacingXlInput?.value).toBe('32');

    await act(async () => {
      spacingXlInput!.value = '40';
      spacingXlInput!.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await vi.waitFor(() => {
      expect(storedValues.userCorrections).toEqual(
        expect.objectContaining({
          spacing: expect.objectContaining({
            xl: 40,
          }),
        }),
      );
    });

    expect(host.textContent).toContain('#14B8A6');
    expect(host.textContent).toContain('User correction: primary');
    expect(host.textContent).toContain('User correction: radius.sm');
    expect(host.textContent).toContain('User correction: spacing.xl');
    expect(host.textContent).toContain('textSecondary has limited supporting evidence');
    expect(host.textContent).toContain('Font Family');
    expect(host.textContent).toContain('Radius sm');
    expect(host.textContent).toContain('Radius md');
    expect(host.textContent).toContain('Radius full');
    expect(host.textContent).toContain('Spacing xs');
    expect(host.textContent).toContain('Spacing md');
    expect(host.textContent).toContain('Spacing xl');
  });

  it('ignores noisy tokens and removes them from corrected UI when token corrections are enabled', async () => {
    storedValues.lastSnapshot = storedSnapshot;
    storedValues.extensionSettings = {
      tokens: {
        editingEnabled: true,
      },
    };
    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<SidePanel />);
    });

    const tokensTab = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.includes('Tokens'));
    expect(tokensTab).toBeTruthy();

    await act(async () => {
      tokensTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(host.textContent).toContain('#737373');
    expect(host.textContent).toContain('Georgia, serif');
    expect(host.textContent).toContain('Spacing xl');
    expect(host.textContent).toContain('Radius full');

    const ignoreNeutral = host.querySelector<HTMLButtonElement>('button[aria-label="Ignore Neutral token"]');
    expect(ignoreNeutral).toBeTruthy();

    await act(async () => {
      ignoreNeutral!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await vi.waitFor(() => {
      expect(storedValues.userCorrections).toEqual(
        expect.objectContaining({
          ignoredTokens: expect.objectContaining({
            colors: expect.arrayContaining(['#737373']),
          }),
        }),
      );
    });
    expect(host.textContent).not.toContain('#737373');

    const ignoreFont = host.querySelector<HTMLButtonElement>('button[aria-label="Ignore Supporting font family token"]');
    const ignoreSpacing = host.querySelector<HTMLButtonElement>('button[aria-label="Ignore Spacing xl token"]');
    const ignoreRadius = host.querySelector<HTMLButtonElement>('button[aria-label="Ignore Radius full token"]');
    expect(ignoreFont).toBeTruthy();
    expect(ignoreSpacing).toBeTruthy();
    expect(ignoreRadius).toBeTruthy();

    await act(async () => {
      ignoreFont!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      ignoreSpacing!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      ignoreRadius!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await vi.waitFor(() => {
      expect(storedValues.userCorrections).toEqual(
        expect.objectContaining({
          ignoredTokens: expect.objectContaining({
            colors: expect.arrayContaining(['#737373']),
            fontFamilies: expect.arrayContaining(['Georgia, serif']),
            spacing: expect.arrayContaining([32]),
            radius: expect.arrayContaining([980]),
          }),
        }),
      );
    });

    expect(host.textContent).not.toContain('Georgia, serif');
    expect(host.textContent).not.toContain('Spacing xl');
    expect(host.textContent).not.toContain('Radius full');
  });

  it('copies and downloads every generated export from the Export tab', async () => {
    storedValues.lastSnapshot = storedSnapshot;
    storedValues.userCorrections = {
      colors: {
        primary: '#14B8A6',
      },
    };
    const createdBlobs: Blob[] = [];
    const createObjectUrl = vi.fn((blob: Blob) => {
      createdBlobs.push(blob);
      return `blob:export-${createdBlobs.length}`;
    });
    const revokeObjectUrl = vi.fn();
    const anchorClicks: string[] = [];
    vi.stubGlobal('URL', {
      createObjectURL: createObjectUrl,
      revokeObjectURL: revokeObjectUrl,
    });
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string, options?: ElementCreationOptions) => {
      const element = originalCreateElement(tagName, options);

      if (tagName.toLowerCase() === 'a') {
        vi.spyOn(element as HTMLAnchorElement, 'click').mockImplementation(function click(this: HTMLAnchorElement) {
          anchorClicks.push(`${this.download}:${this.href}`);
        });
      }

      return element;
    });

    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<SidePanel />);
    });

    const exportTab = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.includes('Export'));
    expect(exportTab).toBeTruthy();

    await act(async () => {
      exportTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const copyDesignMd = host.querySelector<HTMLButtonElement>('button[aria-label="Copy DESIGN.md"]');
    const downloadDesignMd = host.querySelector<HTMLButtonElement>('button[aria-label="Download DESIGN.md"]');
    const copyCss = host.querySelector<HTMLButtonElement>('button[aria-label="Copy CSS Variables"]');
    const downloadCss = host.querySelector<HTMLButtonElement>('button[aria-label="Download CSS Variables"]');
    const copyTailwind = host.querySelector<HTMLButtonElement>('button[aria-label="Copy Tailwind Config"]');
    const downloadTailwind = host.querySelector<HTMLButtonElement>('button[aria-label="Download Tailwind Config"]');
    const copyTokens = host.querySelector<HTMLButtonElement>('button[aria-label="Copy tokens.json"]');
    const downloadTokens = host.querySelector<HTMLButtonElement>('button[aria-label="Download tokens.json"]');

    expect(copyDesignMd).toBeTruthy();
    expect(downloadDesignMd).toBeTruthy();
    expect(copyCss).toBeTruthy();
    expect(downloadCss).toBeTruthy();
    expect(copyTailwind).toBeTruthy();
    expect(downloadTailwind).toBeTruthy();
    expect(copyTokens).toBeTruthy();
    expect(downloadTokens).toBeTruthy();
    expect(host.querySelectorAll('[data-testid="export-item"]').length).toBe(4);
    const designPreview = host.querySelector<HTMLElement>('[data-testid="design-md-preview"]');
    expect(designPreview).toBeTruthy();
    expect(designPreview?.textContent).toContain('---');
    expect(designPreview?.textContent).toContain('colors:');
    expect(designPreview?.textContent).toContain('components:');
    expect(designPreview?.textContent).toContain('# DESIGN.md');
    expect(designPreview?.textContent).toContain('## Overview');
    expect(designPreview?.textContent).toContain('## Interaction States');
    expect(designPreview?.className).toContain('h-[calc(100vh-270px)]');
    expect(designPreview?.className).toContain('overflow-auto');
    expect(designPreview?.className).toContain('font-mono');
    expect(designPreview?.className).toContain('bg-slate-950');
    expect(host.textContent).not.toContain('Copy DESIGN.mdDownload DESIGN.md');

    await act(async () => {
      copyDesignMd!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(expect.stringContaining('# DESIGN.md'));
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(expect.stringContaining('#14B8A6'));
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(expect.stringContaining('components:'));

    await act(async () => {
      downloadDesignMd!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(createdBlobs[0]?.type).toBe('text/markdown');
    await expect(createdBlobs[0]!.text()).resolves.toContain('# DESIGN.md');
    await expect(createdBlobs[0]!.text()).resolves.toContain('components:');
    await expect(createdBlobs[0]!.text()).resolves.toContain('#14B8A6');

    await act(async () => {
      copyCss!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(
      expect.stringContaining('--design-color-primary: #14B8A6;'),
    );

    await act(async () => {
      downloadCss!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(createdBlobs[1]?.type).toBe('text/css');
    await expect(createdBlobs[1]!.text()).resolves.toContain('--design-color-primary: #14B8A6;');

    await act(async () => {
      copyTailwind!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(
      expect.stringContaining("primary: 'var(--design-color-primary)'"),
    );

    await act(async () => {
      downloadTailwind!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(createdBlobs[2]?.type).toBe('text/javascript');
    await expect(createdBlobs[2]!.text()).resolves.toContain("primary: 'var(--design-color-primary)'");

    await act(async () => {
      copyTokens!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(expect.stringContaining('"$type": "color"'));
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(expect.stringContaining('"$value": "#14B8A6"'));

    await act(async () => {
      downloadTokens!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
    const blob = createdBlobs[3];
    expect(blob).toBeTruthy();
    expect(blob.type).toBe('application/json');
    await expect(blob.text()).resolves.toContain('"$type": "color"');
    await expect(blob.text()).resolves.toContain('"$value": "#14B8A6"');
    expect(anchorClicks).toEqual([
      'DESIGN-example.com.md:blob:export-1',
      'design-variables-example.com.css:blob:export-2',
      'tailwind-design-example.com.config.js:blob:export-3',
      'design-tokens-example.com.json:blob:export-4',
    ]);
    expect(revokeObjectUrl).toHaveBeenCalledTimes(4);
    expect(revokeObjectUrl).toHaveBeenLastCalledWith('blob:export-4');
  });

  it('clamps and falls back colors correctly in the workbench container to prevent contrast issues', async () => {
    const testColors = [
      { input: 'lab(120 0 0 / 0.8)', expected: '#2563EB' }, // advanced color space fallback
      { input: 'var(--accent-primary)', expected: '#2563EB' }, // CSS variable fallback
      { input: '#FFFFFF', expected: '#996666' }, // extremely bright white clamped down
      { input: '#000000', expected: '#8A5C5C' }, // extremely dark black clamped up
      { input: '#2563EB', expected: '#2563EB' }, // standard blue remains intact
    ];

    for (const { input, expected } of testColors) {
      const customSnapshot = JSON.parse(JSON.stringify(storedSnapshot));
      customSnapshot.tokens.colors.primary.value = input;
      storedValues.lastSnapshot = customSnapshot;

      const host = document.createElement('div');
      document.body.append(host);

      await act(async () => {
        createRoot(host).render(<SidePanel />);
      });

      const mainElement = host.querySelector('main');
      expect(mainElement).toBeTruthy();
      
      const dynamicPrimary = (mainElement as HTMLElement).style.getPropertyValue('--dynamic-primary');
      expect(dynamicPrimary).toBe(expected);

      // Clean up host for next iteration
      document.body.removeChild(host);
    }
  });

  it('renders PermissionWarningCard when snapshot is null and a permission error occurs', async () => {
    const originalSendMessage = chrome.runtime.sendMessage;
    chrome.runtime.sendMessage = vi.fn().mockImplementation(async () => {
      return {
        ok: false,
        error: 'Cannot access contents of the page. Extension manifest must request permission to access...',
      };
    });

    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<SidePanel />);
    });

    expect(host.textContent).toContain('Ready for local extraction');
    expect(host.querySelector('[data-testid="permission-warning-card"]')).toBeFalsy();

    const analyzeButton = host.querySelector('button[aria-label="Analyze current page"]');
    expect(analyzeButton).toBeTruthy();

    await act(async () => {
      analyzeButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(host.querySelector('[data-testid="permission-warning-card"]')).toBeTruthy();
    expect(host.textContent).toContain('Authorization required');
    expect(host.textContent).toContain('Click the extension icon');

    chrome.runtime.sendMessage = originalSendMessage;
    document.body.removeChild(host);
  });

  it('shows "Refresh analysis" on the button and fixed-width styling when history snapshot is loaded', async () => {
    storedValues.lastSnapshot = storedSnapshot;

    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<SidePanel />);
    });

    const analyzeButton = host.querySelector('button[aria-label="Analyze current page"]');
    expect(analyzeButton).toBeTruthy();
    expect(analyzeButton?.textContent).toContain('Refresh analysis');
    expect(analyzeButton?.className).toContain('w-40');
    expect(analyzeButton?.className).toContain('min-w-[160px]');

    document.body.removeChild(host);
  });

  it('renders ProtectedPageWarningCard when snapshot is null and a protected page error occurs', async () => {
    const originalSendMessage = chrome.runtime.sendMessage;
    chrome.runtime.sendMessage = vi.fn().mockImplementation(async () => {
      return {
        ok: false,
        error: 'chrome://protected-page cannot be accessed',
      };
    });

    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<SidePanel />);
    });

    const analyzeButton = host.querySelector('button[aria-label="Analyze current page"]');
    expect(analyzeButton).toBeTruthy();

    await act(async () => {
      analyzeButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(host.querySelector('[data-testid="protected-warning-card"]')).toBeTruthy();
    expect(host.textContent).toContain('Page cannot be analyzed');
    expect(host.textContent).toContain('Chrome blocks extensions on protected pages');
    expect(host.textContent).not.toContain('Click the extension icon');

    chrome.runtime.sendMessage = originalSendMessage;
    document.body.removeChild(host);
  });

  it('keeps stable status and displays inline warning notice when history exists and a permission error occurs', async () => {
    storedValues.lastSnapshot = storedSnapshot;
    const originalSendMessage = chrome.runtime.sendMessage;
    chrome.runtime.sendMessage = vi.fn().mockImplementation(async () => {
      return {
        ok: false,
        error: 'Cannot access contents of the page. Extension manifest must request permission to access...',
      };
    });

    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<SidePanel />);
    });

    const overviewTab = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.includes('Overview'));
    expect(overviewTab).toBeTruthy();

    await act(async () => {
      overviewTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Before clicking, it should show stable status based on storedSnapshot
    expect(host.textContent).toContain('Last analyzed: example.com');

    const analyzeButton = host.querySelector('button[aria-label="Analyze current page"]');
    expect(analyzeButton).toBeTruthy();

    await act(async () => {
      analyzeButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // After clicking and failing, status MUST still be stable
    expect(host.textContent).toContain('Last analyzed: example.com');

    // Content area must NOT render the full page warning card (it should show the overview snapshot data instead)
    expect(host.querySelector('[data-testid="permission-warning-card"]')).toBeFalsy();
    expect(host.textContent).toContain('Confidence'); // Key Token overview indicator

    // An inline notice must be displayed in the header right below the button
    const inlineNotice = host.querySelector('[data-testid="inline-permission-notice"]');
    expect(inlineNotice).toBeTruthy();
    expect(inlineNotice?.textContent).toContain('Chrome needs a toolbar click before this extension can read the current tab');

    chrome.runtime.sendMessage = originalSendMessage;
    document.body.removeChild(host);
  });

  it('renders GenericErrorWarningCard when snapshot is null and a generic failure occurs', async () => {
    const originalSendMessage = chrome.runtime.sendMessage;
    chrome.runtime.sendMessage = vi.fn().mockImplementation(async () => {
      return {
        ok: false,
        error: 'Some weird network timeout or arbitrary page crash',
      };
    });

    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<SidePanel />);
    });

    const analyzeButton = host.querySelector('button[aria-label="Analyze current page"]');
    expect(analyzeButton).toBeTruthy();

    await act(async () => {
      analyzeButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(host.querySelector('[data-testid="other-warning-card"]')).toBeTruthy();
    expect(host.querySelector('[data-testid="permission-warning-card"]')).toBeFalsy();
    expect(host.textContent).toContain('Analysis failed');
    expect(host.textContent).toContain('An unexpected error occurred during page analysis');

    chrome.runtime.sendMessage = originalSendMessage;
    document.body.removeChild(host);
  });

  it('keeps stable status and displays inline generic notice when history exists and a generic failure occurs', async () => {
    storedValues.lastSnapshot = storedSnapshot;
    const originalSendMessage = chrome.runtime.sendMessage;
    chrome.runtime.sendMessage = vi.fn().mockImplementation(async () => {
      return {
        ok: false,
        error: 'Arbitrary backend/script injection failed',
      };
    });

    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<SidePanel />);
    });

    const overviewTab = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.includes('Overview'));
    expect(overviewTab).toBeTruthy();

    await act(async () => {
      overviewTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const analyzeButton = host.querySelector('button[aria-label="Analyze current page"]');
    expect(analyzeButton).toBeTruthy();

    await act(async () => {
      analyzeButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Stable status retained
    expect(host.textContent).toContain('Last analyzed: example.com');

    // Overview data still visible
    expect(host.textContent).toContain('Confidence');

    // Inline generic warning notice is displayed below the button
    const inlineNotice = host.querySelector('[data-testid="inline-other-notice"]');
    expect(inlineNotice).toBeTruthy();
    expect(inlineNotice?.textContent).toContain('An unexpected error occurred during page analysis. Please try again.');

    chrome.runtime.sendMessage = originalSendMessage;
    document.body.removeChild(host);
  });
});

