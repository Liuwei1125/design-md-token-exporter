import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ANALYZE_CURRENT_PAGE, LAST_SNAPSHOT_STORAGE_KEY } from '../messages';

type RuntimeListener = (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
) => boolean | undefined;

describe('background analyzer message flow', () => {
  let runtimeListener: RuntimeListener | undefined;
  let storedValues: Record<string, unknown>;
  let executeScript: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    storedValues = {};
    executeScript = vi.fn(async () => [
      {
        result: {
          meta: {
            title: 'Injected Page',
            url: 'https://example.com',
            hostname: 'example.com',
            analyzedAt: '2026-05-26T00:00:00.000Z',
          },
          raw: {
            cssVariables: [{ name: '--brand', value: '#2563eb', source: 'documentElement' }],
            elementCounts: {
              totalVisible: 3,
              limitedTo: 800,
              byTag: { main: 1, button: 2 },
            },
            colorSamples: [
              {
                tagName: 'body',
                rect: { width: 1280, height: 900, top: 0, left: 0 },
                styles: {
                  color: 'rgb(17, 24, 39)',
                  backgroundColor: '#f8fafc',
                  backgroundImage: 'none',
                  borderTopColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderBottomColor: 'transparent',
                  borderLeftColor: 'transparent',
                  outlineColor: 'transparent',
                  textDecorationColor: 'transparent',
                },
              },
              {
                tagName: 'button',
                text: 'Buy now',
                rect: { width: 120, height: 40, top: 120, left: 40 },
                styles: {
                  color: '#ffffff',
                  backgroundColor: '#2563eb',
                  backgroundImage: 'none',
                  borderTopColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderBottomColor: 'transparent',
                  borderLeftColor: 'transparent',
                  outlineColor: 'transparent',
                  textDecorationColor: 'transparent',
                },
              },
            ],
            layoutSamples: [
              {
                tagName: 'body',
                rect: { width: 1280, height: 900, top: 0, left: 0 },
                styles: {
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
              },
              {
                tagName: 'button',
                text: 'Buy now',
                rect: { width: 120, height: 40, top: 120, left: 40 },
                styles: {
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: '600',
                  lineHeight: '20px',
                  letterSpacing: 'normal',
                  paddingTop: '8px',
                  paddingRight: '16px',
                  paddingBottom: '8px',
                  paddingLeft: '16px',
                  marginTop: '0px',
                  marginRight: '0px',
                  marginBottom: '0px',
                  marginLeft: '0px',
                  gap: '8px',
                  rowGap: '8px',
                  columnGap: '8px',
                  borderTopLeftRadius: '8px',
                  borderTopRightRadius: '8px',
                  borderBottomRightRadius: '8px',
                  borderBottomLeftRadius: '8px',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.12)',
                  textShadow: 'none',
                },
              },
            ],
          },
        },
      },
    ]);

    vi.stubGlobal('chrome', {
      runtime: {
        onInstalled: {
          addListener: vi.fn(),
        },
        onMessage: {
          addListener: vi.fn((listener: RuntimeListener) => {
            runtimeListener = listener;
          }),
        },
      },
      sidePanel: {
        setPanelBehavior: vi.fn(),
      },
      tabs: {
        query: vi.fn(async () => [{ id: 123, windowId: 456 }]),
      },
      scripting: {
        executeScript,
      },
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: storedValues[key] })),
          set: vi.fn(async (items: Record<string, unknown>) => {
            storedValues = { ...storedValues, ...items };
          }),
          remove: vi.fn(async (key: string) => {
            delete storedValues[key];
          }),
        },
      },
    });
  });

  it('injects the analyzer only after receiving the analyze message and stores the snapshot', async () => {
    const { setupBackground } = await import('../../entrypoints/background');
    setupBackground();

    expect(executeScript).not.toHaveBeenCalled();

    const sendResponse = vi.fn();
    const keepChannelOpen = runtimeListener?.({ type: ANALYZE_CURRENT_PAGE }, {}, sendResponse);

    expect(keepChannelOpen).toBe(true);

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          snapshot: expect.objectContaining({
            meta: expect.objectContaining({ hostname: 'example.com' }),
            tokens: expect.objectContaining({
              colors: expect.objectContaining({
                primary: expect.objectContaining({ value: '#2563EB' }),
              }),
            }),
          }),
        }),
      );
    });

    expect(executeScript).toHaveBeenCalledTimes(1);
    expect(executeScript).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 123 },
        func: expect.any(Function),
      }),
    );
    const injectedFunction = executeScript.mock.calls[0]?.[0]?.func as Function;
    expect(injectedFunction.toString()).not.toMatch(/extractColorTokens|inferColorRoles|collectColorWarnings|COLOR_SAMPLE_SELECTOR/);
    expect(storedValues[LAST_SNAPSHOT_STORAGE_KEY]).toEqual(
      expect.objectContaining({
        meta: expect.objectContaining({ title: 'Injected Page' }),
        tokens: expect.objectContaining({
          colors: expect.objectContaining({
            primary: expect.objectContaining({ value: '#2563EB' }),
          }),
        }),
      }),
    );
  });
});
