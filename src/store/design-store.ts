import { create } from 'zustand';
import type { DesignSnapshot } from '../analyzer/types';
import type { ColorRoleName, ColorRoleToken, RadiusScaleName, SpacingScaleName } from '../core/types';
import { LAST_SNAPSHOT_STORAGE_KEY, USER_CORRECTIONS_STORAGE_KEY } from '../messages';
import { getStoredValue, setStoredValue } from './storage';

export type SidePanelTabId = 'overview' | 'tokens' | 'export';

export type EditableColorRole =
  | 'primary'
  | 'background'
  | 'surface'
  | 'textPrimary'
  | 'textSecondary'
  | 'border';

const colorRoleNames: ColorRoleName[] = [
  'primary',
  'primaryForeground',
  'background',
  'surface',
  'textPrimary',
  'textSecondary',
  'border',
  'success',
  'warning',
  'danger',
  'neutral',
];

export interface UserCorrections {
  colors?: Partial<Record<EditableColorRole, string>>;
  fontFamily?: string;
  radius?: Partial<Record<RadiusScaleName, number>>;
  spacing?: Partial<Record<SpacingScaleName, number>>;
  ignoredTokens?: IgnoredTokenValues;
}

export type IgnoredTokenKind = 'colors' | 'fontFamilies' | 'spacing' | 'radius';

export interface IgnoredTokenValues {
  colors?: string[];
  fontFamilies?: string[];
  spacing?: number[];
  radius?: number[];
}

interface DesignStoreState {
  snapshot: DesignSnapshot | null;
  userCorrections: UserCorrections;
  activeSidePanelTab: SidePanelTabId;
  hydrated: boolean;
  correctedSnapshot: DesignSnapshot | null;
  loadPersistedState: () => Promise<void>;
  setSnapshot: (snapshot: DesignSnapshot | null) => Promise<void>;
  setUserCorrection: <TKey extends keyof UserCorrections>(key: TKey, value: NonNullable<UserCorrections[TKey]>) => Promise<void>;
  setColorCorrection: (role: EditableColorRole, value: string) => Promise<void>;
  setRadiusCorrection: (scaleName: RadiusScaleName, value: number) => Promise<void>;
  setSpacingCorrection: (scaleName: SpacingScaleName, value: number) => Promise<void>;
  ignoreTokenValue: (kind: IgnoredTokenKind, value: string | number) => Promise<void>;
  setActiveSidePanelTab: (tab: SidePanelTabId) => void;
}

export const useDesignStore = create<DesignStoreState>((set, get) => ({
  snapshot: null,
  userCorrections: {},
  activeSidePanelTab: 'overview',
  hydrated: false,
  correctedSnapshot: null,

  async loadPersistedState() {
    const [snapshot, userCorrections] = await Promise.all([
      getStoredValue<DesignSnapshot>(LAST_SNAPSHOT_STORAGE_KEY, undefined),
      getStoredValue<UserCorrections>(USER_CORRECTIONS_STORAGE_KEY, {}),
    ]);

    const nextSnapshot = snapshot ?? null;
    const nextCorrections = userCorrections ?? {};

    set({
      snapshot: nextSnapshot,
      userCorrections: nextCorrections,
      correctedSnapshot: applyUserCorrections(nextSnapshot, nextCorrections),
      hydrated: true,
    });
  },

  async setSnapshot(snapshot) {
    set({
      snapshot,
      correctedSnapshot: applyUserCorrections(snapshot, get().userCorrections),
    });

    if (snapshot) {
      await setStoredValue(LAST_SNAPSHOT_STORAGE_KEY, snapshot);
    }
  },

  async setUserCorrection(key, value) {
    const userCorrections = {
      ...get().userCorrections,
      [key]: value,
    };

    set({
      userCorrections,
      correctedSnapshot: applyUserCorrections(get().snapshot, userCorrections),
    });
    await setStoredValue(USER_CORRECTIONS_STORAGE_KEY, userCorrections);
  },

  async setColorCorrection(role, value) {
    const current = get().userCorrections;
    const userCorrections: UserCorrections = {
      ...current,
      colors: {
        ...current.colors,
        [role]: value,
      },
    };

    set({
      userCorrections,
      correctedSnapshot: applyUserCorrections(get().snapshot, userCorrections),
    });
    await setStoredValue(USER_CORRECTIONS_STORAGE_KEY, userCorrections);
  },

  async setRadiusCorrection(scaleName, value) {
    const current = get().userCorrections;
    const userCorrections: UserCorrections = {
      ...current,
      radius: {
        ...current.radius,
        [scaleName]: value,
      },
    };

    set({
      userCorrections,
      correctedSnapshot: applyUserCorrections(get().snapshot, userCorrections),
    });
    await setStoredValue(USER_CORRECTIONS_STORAGE_KEY, userCorrections);
  },

  async setSpacingCorrection(scaleName, value) {
    const current = get().userCorrections;
    const userCorrections: UserCorrections = {
      ...current,
      spacing: {
        ...current.spacing,
        [scaleName]: value,
      },
    };

    set({
      userCorrections,
      correctedSnapshot: applyUserCorrections(get().snapshot, userCorrections),
    });
    await setStoredValue(USER_CORRECTIONS_STORAGE_KEY, userCorrections);
  },

  async ignoreTokenValue(kind, value) {
    const current = get().userCorrections;
    const userCorrections: UserCorrections = {
      ...current,
      ignoredTokens: {
        ...current.ignoredTokens,
        [kind]: uniqueValues([...(current.ignoredTokens?.[kind] ?? []), value]),
      },
    };

    set({
      userCorrections,
      correctedSnapshot: applyUserCorrections(get().snapshot, userCorrections),
    });
    await setStoredValue(USER_CORRECTIONS_STORAGE_KEY, userCorrections);
  },

  setActiveSidePanelTab(tab) {
    set({ activeSidePanelTab: tab });
  },
}));

export function applyUserCorrections<TSnapshot extends DesignSnapshot | null>(
  snapshot: TSnapshot,
  corrections: UserCorrections,
): TSnapshot {
  if (!snapshot || !hasCorrections(corrections)) {
    return snapshot;
  }

  const corrected: DesignSnapshot = structuredClone(snapshot);

  applyIgnoredTokenValues(corrected, corrections.ignoredTokens);

  for (const [role, value] of Object.entries(corrections.colors ?? {}) as [EditableColorRole, string][]) {
    if (!value) continue;
    corrected.tokens.colors[role] = correctedColorToken(role, corrected.tokens.colors[role], value);
  }

  if (corrections.fontFamily) {
    corrected.tokens.typography.fontFamilies = corrected.tokens.typography.fontFamilies.length
      ? corrected.tokens.typography.fontFamilies.map((token, index) =>
          index === 0
            ? {
                ...token,
                value: corrections.fontFamily!,
                evidence: [`User correction: fontFamily`, ...token.evidence],
              }
            : token,
        )
      : [
          {
            value: corrections.fontFamily,
            frequency: 1,
            usage: ['user correction'],
            evidence: ['User correction: fontFamily'],
          },
        ];

    corrected.tokens.typography.roles = Object.fromEntries(
      Object.entries(corrected.tokens.typography.roles).map(([role, token]) => [
        role,
        token
          ? {
              ...token,
              fontFamily: corrections.fontFamily,
              confidence: 1,
              evidence: [`User correction: fontFamily`, ...token.evidence],
            }
          : token,
      ]),
    ) as DesignSnapshot['tokens']['typography']['roles'];
  }

  for (const [scaleName, value] of Object.entries(corrections.radius ?? {}) as [RadiusScaleName, number][]) {
    if (typeof value !== 'number' || Number.isNaN(value)) continue;
    const token = corrected.tokens.radius.scale[scaleName];
    corrected.tokens.radius.scale[scaleName] = {
      value,
      frequency: token?.frequency ?? 1,
      usage: token?.usage ?? ['user correction'],
      evidence: [`User correction: radius.${scaleName}`, ...(token?.evidence ?? [])],
    };
    corrected.tokens.radius.values = upsertClusterValue(
      corrected.tokens.radius.values,
      value,
      `User correction: radius.${scaleName}`,
    );
  }

  for (const [scaleName, value] of Object.entries(corrections.spacing ?? {}) as [SpacingScaleName, number][]) {
    if (typeof value !== 'number' || Number.isNaN(value)) continue;
    const token = corrected.tokens.spacing.scale[scaleName];
    corrected.tokens.spacing.scale[scaleName] = {
      value,
      frequency: token?.frequency ?? 1,
      usage: token?.usage ?? ['user correction'],
      evidence: [`User correction: spacing.${scaleName}`, ...(token?.evidence ?? [])],
    };
    corrected.tokens.spacing.values = upsertClusterValue(
      corrected.tokens.spacing.values,
      value,
      `User correction: spacing.${scaleName}`,
    );
  }

  return corrected as TSnapshot;
}

function hasCorrections(corrections: UserCorrections): boolean {
  return Boolean(
    corrections.fontFamily ||
      hasIgnoredTokenValues(corrections.ignoredTokens) ||
      Object.values(corrections.radius ?? {}).some((value) => typeof value === 'number') ||
      Object.values(corrections.spacing ?? {}).some((value) => typeof value === 'number') ||
      Object.values(corrections.colors ?? {}).some(Boolean),
  );
}

function applyIgnoredTokenValues(snapshot: DesignSnapshot, ignoredTokens: IgnoredTokenValues | undefined): void {
  if (!ignoredTokens) return;

  const ignoredColors = new Set((ignoredTokens.colors ?? []).map(normalizeColorValue));
  if (ignoredColors.size) {
    snapshot.raw.colorTokens = snapshot.raw.colorTokens.filter((token) => !ignoredColors.has(normalizeColorValue(token.value)));

    for (const role of colorRoleNames) {
      const token = snapshot.tokens.colors[role];
      if (!token || !ignoredColors.has(normalizeColorValue(token.value))) continue;
      if (role === 'primary' || role === 'background' || role === 'textPrimary') continue;
      delete snapshot.tokens.colors[role];
    }
  }

  const ignoredFontFamilies = new Set(ignoredTokens.fontFamilies ?? []);
  if (ignoredFontFamilies.size) {
    snapshot.tokens.typography.fontFamilies = snapshot.tokens.typography.fontFamilies.filter(
      (token) => !ignoredFontFamilies.has(token.value),
    );
  }

  const ignoredSpacing = new Set(ignoredTokens.spacing ?? []);
  if (ignoredSpacing.size) {
    snapshot.tokens.spacing.values = snapshot.tokens.spacing.values.filter((token) => !ignoredSpacing.has(token.value));
    for (const [scaleName, token] of Object.entries(snapshot.tokens.spacing.scale) as [SpacingScaleName, { value: number } | undefined][]) {
      if (token && ignoredSpacing.has(token.value)) {
        delete snapshot.tokens.spacing.scale[scaleName];
      }
    }
  }

  const ignoredRadius = new Set(ignoredTokens.radius ?? []);
  if (ignoredRadius.size) {
    snapshot.tokens.radius.values = snapshot.tokens.radius.values.filter((token) => !ignoredRadius.has(token.value));
    for (const [scaleName, token] of Object.entries(snapshot.tokens.radius.scale) as [RadiusScaleName, { value: number } | undefined][]) {
      if (token && ignoredRadius.has(token.value)) {
        delete snapshot.tokens.radius.scale[scaleName];
      }
    }
  }
}

function hasIgnoredTokenValues(ignoredTokens: IgnoredTokenValues | undefined): boolean {
  return Boolean(
    ignoredTokens &&
      ((ignoredTokens.colors?.length ?? 0) ||
        (ignoredTokens.fontFamilies?.length ?? 0) ||
        (ignoredTokens.spacing?.length ?? 0) ||
        (ignoredTokens.radius?.length ?? 0)),
  );
}

function normalizeColorValue(value: string): string {
  return value.trim().toUpperCase();
}

function uniqueValues<TValue extends string | number>(values: TValue[]): TValue[] {
  return Array.from(new Set(values));
}

function correctedColorToken(role: EditableColorRole, token: ColorRoleToken | undefined, value: string): ColorRoleToken {
  return {
    value,
    confidence: 1,
    evidence: [`User correction: ${role}`, ...(token?.evidence ?? [])],
    warnings: token?.warnings ?? [],
  };
}

function upsertClusterValue<TToken extends { value: number; frequency: number; usage: string[]; evidence: string[] }>(
  tokens: TToken[],
  value: number,
  evidence: string,
): TToken[] {
  const existingIndex = tokens.findIndex((token) => token.value === value);

  if (existingIndex >= 0) {
    return tokens.map((token, index) =>
      index === existingIndex
        ? {
            ...token,
            evidence: token.evidence.includes(evidence) ? token.evidence : [evidence, ...token.evidence],
          }
        : token,
    );
  }

  return [
    ...tokens,
    {
      value,
      frequency: 1,
      usage: ['user correction'],
      evidence: [evidence],
    } as TToken,
  ];
}
