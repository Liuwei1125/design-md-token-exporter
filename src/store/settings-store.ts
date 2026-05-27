import { create } from 'zustand';
import { getStoredValue, setStoredValue } from './storage';

export const EXTENSION_SETTINGS_STORAGE_KEY = 'extensionSettings';

export interface ExtensionSettings {
  tokens: {
    editingEnabled: boolean;
  };
}

export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettings = {
  tokens: {
    editingEnabled: false,
  },
};

interface SettingsStoreState {
  settings: ExtensionSettings;
  hydrated: boolean;
  loadSettings: () => Promise<void>;
  setTokenEditingEnabled: (editingEnabled: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  settings: DEFAULT_EXTENSION_SETTINGS,
  hydrated: false,

  async loadSettings() {
    const storedSettings = await getStoredValue<PartialExtensionSettings>(EXTENSION_SETTINGS_STORAGE_KEY, undefined);
    set({
      settings: mergeExtensionSettings(storedSettings),
      hydrated: true,
    });
  },

  async setTokenEditingEnabled(editingEnabled) {
    const settings: ExtensionSettings = {
      ...get().settings,
      tokens: {
        ...get().settings.tokens,
        editingEnabled,
      },
    };

    set({ settings });
    await setStoredValue(EXTENSION_SETTINGS_STORAGE_KEY, settings);
  },
}));

type PartialExtensionSettings = {
  tokens?: Partial<ExtensionSettings['tokens']>;
};

export function mergeExtensionSettings(settings?: PartialExtensionSettings): ExtensionSettings {
  return {
    tokens: {
      ...DEFAULT_EXTENSION_SETTINGS.tokens,
      ...settings?.tokens,
    },
  };
}
