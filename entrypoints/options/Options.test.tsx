import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EXTENSION_SETTINGS_STORAGE_KEY, useSettingsStore } from '../../src/store/settings-store';
import { Options } from './Options';

type StoredValues = Record<string, unknown>;

describe('Options', () => {
  let storedValues: StoredValues;

  beforeEach(() => {
    storedValues = {};
    useSettingsStore.setState({
      settings: {
        tokens: {
          editingEnabled: false,
        },
      },
      hydrated: false,
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
    });
  });

  it('renders token correction settings and persists changes', async () => {
    const host = document.createElement('div');
    document.body.append(host);

    await act(async () => {
      createRoot(host).render(<Options />);
    });

    expect(host.textContent).toContain('Settings');
    expect(host.textContent).toContain('Token corrections');

    const checkbox = host.querySelector<HTMLInputElement>('input[aria-label="Enable token corrections"]');
    expect(checkbox?.checked).toBe(false);

    await act(async () => {
      checkbox!.checked = true;
      checkbox!.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await vi.waitFor(() => {
      expect(storedValues[EXTENSION_SETTINGS_STORAGE_KEY]).toEqual({
        tokens: {
          editingEnabled: true,
        },
      });
    });
  });
});
