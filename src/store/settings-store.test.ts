import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_EXTENSION_SETTINGS,
  EXTENSION_SETTINGS_STORAGE_KEY,
  mergeExtensionSettings,
  useSettingsStore,
} from './settings-store';

type StoredValues = Record<string, unknown>;

describe('settings store', () => {
  let storedValues: StoredValues;

  beforeEach(() => {
    storedValues = {};
    useSettingsStore.setState({
      settings: DEFAULT_EXTENSION_SETTINGS,
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

  it('defaults token editing to disabled', () => {
    expect(DEFAULT_EXTENSION_SETTINGS.tokens.editingEnabled).toBe(false);
  });

  it('merges partial stored settings with defaults', () => {
    expect(mergeExtensionSettings({ tokens: {} })).toEqual(DEFAULT_EXTENSION_SETTINGS);
  });

  it('loads and persists token editing settings', async () => {
    storedValues[EXTENSION_SETTINGS_STORAGE_KEY] = {
      tokens: {
        editingEnabled: true,
      },
    };

    await useSettingsStore.getState().loadSettings();

    expect(useSettingsStore.getState().settings.tokens.editingEnabled).toBe(true);

    await useSettingsStore.getState().setTokenEditingEnabled(false);

    expect(storedValues[EXTENSION_SETTINGS_STORAGE_KEY]).toEqual({
      tokens: {
        editingEnabled: false,
      },
    });
  });
});
