import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getStoredValue, removeStoredValue, setStoredValue } from './storage';

type StoredValues = Record<string, unknown>;

describe('storage helpers', () => {
  let storedValues: StoredValues;

  beforeEach(() => {
    storedValues = {};

    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: storedValues[key] })),
          set: vi.fn(async (items: StoredValues) => {
            storedValues = { ...storedValues, ...items };
          }),
          remove: vi.fn(async (key: string) => {
            delete storedValues[key];
          }),
        },
      },
    });
  });

  it('round-trips typed values through chrome.storage.local', async () => {
    await setStoredValue('lastSnapshot', { url: 'https://example.com', confidence: 78 });

    await expect(getStoredValue<{ url: string; confidence: number }>('lastSnapshot')).resolves.toEqual({
      url: 'https://example.com',
      confidence: 78,
    });
  });

  it('returns the fallback when a key has not been saved', async () => {
    await expect(getStoredValue('missingKey', 'fallback')).resolves.toBe('fallback');
  });

  it('removes a saved value', async () => {
    await setStoredValue('exportPreferences', { format: 'design-md' });
    await removeStoredValue('exportPreferences');

    await expect(getStoredValue('exportPreferences', null)).resolves.toBeNull();
  });
});
