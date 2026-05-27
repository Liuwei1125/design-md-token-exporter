import { ClipboardList, Layers3, PackageOpen, ScanLine, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { normalizeColor } from '../../src/core/color-normalization';
import {
  ANALYZE_CURRENT_PAGE,
  type AnalyzeCurrentPageMessage,
  type AnalyzeCurrentPageResponse,
} from '../../src/messages';
import { useDesignStore, type SidePanelTabId } from '../../src/store/design-store';
import { useSettingsStore } from '../../src/store/settings-store';
import { ExportTab } from './ExportTab';
import { OverviewTab } from './OverviewTab';
import { TokensTab } from './TokensTab';

const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    icon: ClipboardList,
    emptyState: 'Extraction summary will appear here after the user analyzes the current page.',
  },
  {
    id: 'tokens',
    label: 'Tokens',
    icon: Layers3,
    emptyState: 'Editable color, typography, spacing, radius, and shadow tokens appear after analysis.',
  },
  {
    id: 'export',
    label: 'Export',
    icon: PackageOpen,
    emptyState: 'DESIGN.md, CSS variables, Tailwind config, and tokens.json exports appear after analysis.',
  },
] as const;

function hexToRgb(hex: string): string {
  const cleanHex = hex.trim().replace(/^#/, '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return '37, 99, 235'; // Default blue-600 RGB
}

export function SidePanel() {
  const {
    correctedSnapshot,
    userCorrections,
    activeSidePanelTab,
    loadPersistedState,
    setSnapshot,
    setColorCorrection,
    setRadiusCorrection,
    setSpacingCorrection,
    setUserCorrection,
    ignoreTokenValue,
    setActiveSidePanelTab,
  } = useDesignStore();
  const { settings, loadSettings, setTokenEditingEnabled } = useSettingsStore();
  const [status, setStatus] = useState('Ready for local extraction');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const selectedTab = tabs.find((tab) => tab.id === activeSidePanelTab) ?? tabs[0];
  const selectedTabId = selectedTab.id;

  useEffect(() => {
    Promise.all([loadPersistedState(), loadSettings()]).then(() => {
      const snapshot = useDesignStore.getState().correctedSnapshot;
      if (snapshot) {
        setStatus(`Last analyzed: ${snapshot.meta.hostname || snapshot.meta.title || 'current page'}`);
      }
    });
  }, [loadPersistedState, loadSettings]);

  async function analyzePage() {
    setIsAnalyzing(true);
    setStatus('Analyzing current page...');

    try {
      const response = (await chrome.runtime.sendMessage({
        type: ANALYZE_CURRENT_PAGE,
      } satisfies AnalyzeCurrentPageMessage)) as AnalyzeCurrentPageResponse;

      if (response?.ok) {
        await setSnapshot(response.snapshot);
        setActiveSidePanelTab('overview');
        setStatus(`Analyzed ${response.snapshot.meta.hostname || 'current page'}`);
        return;
      }

      setStatus(response?.error ?? 'Analysis failed');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }

  const rawPrimary = correctedSnapshot?.tokens.colors.primary.value || '#2563eb';
  const normalizedPrimary = normalizeColor(rawPrimary) || rawPrimary;
  const primaryColor = clampColorLightness(normalizedPrimary);
  const dynamicRgb = hexToRgb(primaryColor);

  return (
    <main 
      className="h-screen flex flex-col bg-gradient-to-b from-[rgba(var(--dynamic-primary-rgb),0.02)] to-slate-50/60 text-slate-900 antialiased selection:bg-blue-100 transition-colors duration-500 overflow-hidden relative"
      style={{
        '--dynamic-primary': primaryColor,
        '--dynamic-primary-rgb': dynamicRgb,
      } as React.CSSProperties}
    >
      <header className="glass-header border-b border-slate-200 flex-shrink-0 px-4 py-4 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-widest filter brightness-90" style={{ color: 'var(--dynamic-primary)' }}>Workbench</p>
            <h1 className="mt-0.5 truncate text-lg font-extrabold tracking-tight text-slate-900 leading-snug">
              Design.md Token Exporter
            </h1>
          </div>
          <button
            type="button"
            aria-label="Open settings"
            title="Open settings"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings aria-hidden="true" size={15} />
          </button>
        </div>
        <p className="mt-1 truncate text-xs font-semibold text-slate-400" title={status}>
          {status}
        </p>
        <button
          type="button"
          className="mt-3.5 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-75 disabled:active:scale-100"
          style={{ backgroundColor: 'var(--dynamic-primary)' }}
          onClick={analyzePage}
          disabled={isAnalyzing}
        >
          <ScanLine aria-hidden="true" size={14} className={isAnalyzing ? 'animate-spin' : ''} />
          <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Current Page'}</span>
        </button>
      </header>

      <nav className="grid grid-cols-3 border-b border-slate-200 bg-white px-1 shadow-2xs flex-shrink-0" aria-label="Side panel tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === selectedTabId;

          return (
            <button
              key={tab.id}
              type="button"
              className={[
                'flex min-h-12 flex-col items-center justify-center gap-1 border-b-2 py-1.5 px-1 text-[11px] font-bold transition-all duration-200',
                isActive
                  ? ''
                  : 'border-transparent text-slate-400 hover:bg-slate-50/50 hover:text-slate-800',
              ].join(' ')}
              style={isActive ? { borderColor: 'var(--dynamic-primary)', color: 'var(--dynamic-primary)' } : undefined}
              onClick={() => setActiveSidePanelTab(tab.id as SidePanelTabId)}
            >
              <Icon aria-hidden="true" size={14} className={isActive ? 'scale-105 transition-transform duration-200' : ''} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <section className="flex-1 overflow-y-auto p-4 transition-all duration-300 scrollbar-thin">
        {selectedTabId === 'overview' ? (
          <OverviewTab snapshot={correctedSnapshot} emptyState={selectedTab.emptyState} />
        ) : null}

        {selectedTabId === 'tokens' ? (
          <TokensTab
            snapshot={correctedSnapshot}
            userCorrections={userCorrections}
            editingEnabled={settings.tokens.editingEnabled}
            emptyState={selectedTab.emptyState}
            onColorChange={(role, value) => void setColorCorrection(role, value)}
            onFontFamilyChange={(value) => void setUserCorrection('fontFamily', value)}
            onRadiusChange={(scaleName, value) => void setRadiusCorrection(scaleName, value)}
            onSpacingChange={(scaleName, value) => void setSpacingCorrection(scaleName, value)}
            onIgnoreToken={(kind, value) => void ignoreTokenValue(kind, value)}
          />
        ) : null}

        {selectedTabId === 'export' ? <ExportTab snapshot={correctedSnapshot} emptyState={selectedTab.emptyState} /> : null}
      </section>

      {/* Settings Drawer Overlay */}
      {isSettingsOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs z-50 transition-opacity duration-300 flex items-end justify-center"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div 
            className="w-full bg-white rounded-t-2xl border-t border-slate-200 shadow-2xl p-5 pb-7 animate-slide-up relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Drag Accent */}
            <div className="mx-auto h-1 w-12 rounded-full bg-slate-200 mb-4" />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Settings</h3>
              <button
                type="button"
                className="text-xs font-bold hover:brightness-95 active:scale-95 transition"
                style={{ color: 'var(--dynamic-primary)' }}
                onClick={() => setIsSettingsOpen(false)}
              >
                Done
              </button>
            </div>

            {/* Toggle Card with animated premium HSL Switch */}
            <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 shadow-2xs">
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-800">Token corrections</h4>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  Enable correction fields directly inside the Tokens tab for custom overrides.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-label="Enable token corrections"
                aria-checked={settings.tokens.editingEnabled}
                className={[
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2',
                  settings.tokens.editingEnabled ? '' : 'bg-slate-200'
                ].join(' ')}
                style={settings.tokens.editingEnabled ? { backgroundColor: 'var(--dynamic-primary)', '--tw-ring-color': 'var(--dynamic-primary)' } as React.CSSProperties : undefined}
                onClick={() => void setTokenEditingEnabled(!settings.tokens.editingEnabled)}
              >
                <span
                  aria-hidden="true"
                  className={[
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out',
                    settings.tokens.editingEnabled ? 'translate-x-5' : 'translate-x-0'
                  ].join(' ')}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function clampColorLightness(hex: string): string {
  const normalized = normalizeColor(hex) || hex;
  const cleanHex = normalized.trim().replace(/^#/, '');
  let r = 37, g = 99, b = 235; // Default blue-600 RGB channels
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6 || cleanHex.length === 8) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  } else {
    // Fall back to safe high-contrast default blue-600 to prevent blinding white/unresolvable variable contrast bugs!
    return '#2563EB';
  }

  // Convert RGB to HSL
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0, s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rNorm) h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
    else if (max === gNorm) h = (bNorm - rNorm) / d + 2;
    else h = (rNorm - gNorm) / d + 4;
    h /= 6;
  }

  // Double-sided contrast clamping for dynamic primary colors
  if (l > 0.55) {
    l = 0.50;
    // Boost saturation slightly if it was extremely pale/desaturated to make it a nice muted primary color
    if (s < 0.1) {
      s = 0.20;
    }
  } else if (l < 0.30) {
    l = 0.45;
    // Boost saturation slightly if it was extremely dark/desaturated to make it a nice readable accent
    if (s < 0.1) {
      s = 0.20;
    }
  }

  // Convert HSL back to RGB
  let newR = l, newG = l, newB = l;
  if (s !== 0) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    newR = hueToRgbChannel(p, q, h + 1 / 3);
    newG = hueToRgbChannel(p, q, h);
    newB = hueToRgbChannel(p, q, h - 1 / 3);
  }

  const finalR = Math.max(0, Math.min(255, Math.round(newR * 255)));
  const finalG = Math.max(0, Math.min(255, Math.round(newG * 255)));
  const finalB = Math.max(0, Math.min(255, Math.round(newB * 255)));

  return `#${[finalR, finalG, finalB].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function hueToRgbChannel(p: number, q: number, t: number): number {
  let localT = t;
  if (localT < 0) localT += 1;
  if (localT > 1) localT -= 1;
  if (localT < 1 / 6) return p + (q - p) * 6 * localT;
  if (localT < 1 / 2) return q;
  if (localT < 2 / 3) return p + (q - p) * (2 / 3 - localT) * 6;
  return p;
}
