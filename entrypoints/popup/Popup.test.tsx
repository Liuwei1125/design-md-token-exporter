import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DesignSnapshot } from '../../src/analyzer/types';
import { APP_VERSION } from '../../src/app-meta';
import { LAST_SNAPSHOT_STORAGE_KEY, USER_CORRECTIONS_STORAGE_KEY } from '../../src/messages';
import { Popup } from './Popup';

describe('Popup', () => {
  let storedValues: Record<string, unknown>;

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
          set: vi.fn(async (items: Record<string, unknown>) => {
            storedValues = { ...storedValues, ...items };
          }),
        },
      },
      runtime: {
        sendMessage: vi.fn(),
      },
      tabs: {
        query: vi.fn(async () => [{ windowId: 5 }]),
      },
      sidePanel: {
        open: vi.fn(async () => undefined),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the redesigned empty state with short actions and disabled copy', async () => {
    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<Popup />);
    });

    expect(host.textContent).toContain('Design.md Token Exporter');
    expect(host.textContent).toContain('Ready for local extraction');
    expect(host.textContent).toContain(`v${APP_VERSION}`);
    expect(host.textContent).toContain('Analyze');
    expect(host.textContent).toContain('Panel');
    expect(host.textContent).toContain('Copy');
    expect(host.textContent).toContain('No page analyzed yet.');

    const buttons = Array.from(host.querySelectorAll('button'));
    expect(buttons).toHaveLength(3);
    expect(buttons.map((button) => button.textContent)).toEqual(['Analyze', 'Panel', 'Copy']);

    const copyButton = buttons.find((button) => button.textContent === 'Copy');
    expect(copyButton?.disabled).toBe(true);
  });

  it('loads the last corrected snapshot with metrics, token previews, and copy support', async () => {
    storedValues[LAST_SNAPSHOT_STORAGE_KEY] = popupSnapshot;
    storedValues[USER_CORRECTIONS_STORAGE_KEY] = {
      colors: {
        primary: '#14B8A6',
      },
    };
    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<Popup />);
    });

    await vi.waitFor(() => {
      expect(host.textContent).toContain('Last analyzed: example.com');
    });

    expect(host.textContent).toContain('#14B8A6');
    expect(host.textContent).toContain('CSS Vars');
    expect(host.textContent).toContain('1');
    expect(host.textContent).toContain('Elements');
    expect(host.textContent).toContain('12');
    expect(host.textContent).toContain('Confidence');
    expect(host.textContent).toContain('100%');
    expect(host.textContent).toContain('Primary');
    expect(host.textContent).toContain('Spacing md');
    expect(host.textContent).toContain('16px');
    expect(host.textContent).toContain('Radius md');
    expect(host.textContent).toContain('8px');

    const copyButton = Array.from(host.querySelectorAll('button')).find((button) => button.textContent === 'Copy');
    expect(copyButton).toBeTruthy();
    expect(copyButton?.disabled).toBe(false);

    await act(async () => {
      copyButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('# DESIGN.md'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('#14B8A6'));
    expect(host.textContent).toContain('Copied last DESIGN.md');
  });

  it('shows analyzing feedback and renders the analyzed snapshot after user-triggered analysis', async () => {
    let resolveAnalyze: (value: unknown) => void = () => undefined;
    const analyzePromise = new Promise<unknown>((resolve) => {
      resolveAnalyze = resolve;
    });
    (chrome.runtime.sendMessage as unknown as { mockReturnValue: (value: Promise<unknown>) => void }).mockReturnValue(analyzePromise);
    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<Popup />);
    });

    const analyzeButton = Array.from(host.querySelectorAll('button')).find((button) => button.textContent === 'Analyze');
    expect(analyzeButton).toBeTruthy();

    await act(async () => {
      analyzeButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(host.textContent).toContain('Analyzing current page...');
    expect(Array.from(host.querySelectorAll('button')).find((button) => button.textContent === 'Analyzing')?.disabled).toBe(
      true,
    );

    await act(async () => {
      resolveAnalyze({ ok: true, snapshot: popupSnapshot });
    });

    await vi.waitFor(() => {
      expect(host.textContent).toContain('Analyzed example.com');
    });
    expect(host.textContent).toContain('92%');
  });
});

const popupSnapshot: DesignSnapshot = {
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
      scale: {},
    },
  },
  components: {},
};
