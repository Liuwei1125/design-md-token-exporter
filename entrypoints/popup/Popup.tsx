import { Copy, PanelRightOpen, ScanLine } from 'lucide-react';
import { useEffect, useState } from 'react';
import { normalizeColor } from '../../src/core/color-normalization';
import type { DesignSnapshot } from '../../src/analyzer/types';
import { generateDesignMd } from '../../src/export/generators';
import { APP_GITHUB_URL, APP_NAME, APP_VERSION } from '../../src/app-meta';
import {
  ANALYZE_CURRENT_PAGE,
  LAST_SNAPSHOT_STORAGE_KEY,
  USER_CORRECTIONS_STORAGE_KEY,
  type AnalyzeCurrentPageMessage,
  type AnalyzeCurrentPageResponse,
} from '../../src/messages';
import { applyUserCorrections, type UserCorrections } from '../../src/store/design-store';
import { getStoredValue } from '../../src/store/storage';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function percentWidth(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value * 100)))}%`;
}

function formatPx(value?: number) {
  return typeof value === 'number' ? `${value}px` : '-';
}

export function Popup() {
  const [status, setStatus] = useState('Ready for local extraction');
  const [snapshot, setSnapshot] = useState<DesignSnapshot | null>(null);
  const [userCorrections, setUserCorrections] = useState<UserCorrections>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLastSnapshot() {
      const [storedSnapshot, storedCorrections] = await Promise.all([
        getStoredValue<DesignSnapshot>(LAST_SNAPSHOT_STORAGE_KEY, undefined),
        getStoredValue<UserCorrections>(USER_CORRECTIONS_STORAGE_KEY, {}),
      ]);

      if (!isMounted) return;

      const nextCorrections = storedCorrections ?? {};
      setUserCorrections(nextCorrections);

      if (storedSnapshot) {
        setSnapshot(applyUserCorrections(storedSnapshot, nextCorrections));
        setStatus(`Last analyzed: ${storedSnapshot.meta.hostname || 'current page'}`);
      }
    }

    void loadLastSnapshot();

    return () => {
      isMounted = false;
    };
  }, []);

  async function openSidePanel() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab?.windowId !== undefined) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      setStatus('Side panel opened');
      return;
    }

    setStatus('Open a browser tab first');
  }

  async function analyzePage() {
    setIsAnalyzing(true);
    setStatus('Analyzing current page...');

    try {
      const response = (await chrome.runtime.sendMessage({
        type: ANALYZE_CURRENT_PAGE,
      } satisfies AnalyzeCurrentPageMessage)) as AnalyzeCurrentPageResponse;

      if (response?.ok) {
        setSnapshot(applyUserCorrections(response.snapshot, userCorrections));
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

  async function copyLastDesignMd() {
    if (!snapshot) return;

    try {
      await navigator.clipboard.writeText(generateDesignMd(snapshot));
      setStatus('Copied last DESIGN.md');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Copy failed');
    }
  }

  const rawPrimaryColor = snapshot?.tokens.colors.primary.value ?? '-';
  const primaryColor = rawPrimaryColor !== '-' ? (normalizeColor(rawPrimaryColor) || rawPrimaryColor) : '-';
  const primaryConfidence = snapshot?.tokens.colors.primary.confidence ?? 0;
  const spacingMd = snapshot?.tokens.spacing.scale.md?.value;
  const radiusMd = snapshot?.tokens.radius.scale.md?.value;
  const confidenceLabel = formatPercent(primaryConfidence);
  const confidenceBarWidth = percentWidth(primaryConfidence);

  return (
    <main className="w-[360px] bg-slate-50/90 p-4 text-slate-900 antialiased selection:bg-blue-100">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <img className="h-12 w-12 shrink-0 rounded-xl shadow-sm" src="/icon/icon-128.png" alt="" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight text-slate-900">{APP_NAME}</h1>
            <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
              <span className="relative flex h-2 w-2 shrink-0">
                {isAnalyzing ? (
                  <>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                  </>
                ) : snapshot ? (
                  <>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-slate-300"></span>
                )}
              </span>
              <p className="truncate text-[11px] font-medium text-slate-500" title={status}>
                {status}
              </p>
            </div>
          </div>
        </div>

        <a
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          href={APP_GITHUB_URL}
          rel="noreferrer"
          target="_blank"
          title="Open GitHub repository"
        >
          <GithubIcon className="shrink-0" />
          v{APP_VERSION}
        </a>
      </header>

      <section className="mt-3 grid grid-cols-3 gap-2" aria-label="Popup actions">
        <button
          type="button"
          className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-blue-400 disabled:opacity-75 disabled:active:scale-100"
          onClick={analyzePage}
          disabled={isAnalyzing}
        >
          <ScanLine aria-hidden="true" size={14} className={isAnalyzing ? 'animate-spin' : ''} />
          <span className="truncate">{isAnalyzing ? 'Analyzing' : 'Analyze'}</span>
        </button>

        <button
          type="button"
          className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95"
          onClick={openSidePanel}
        >
          <PanelRightOpen aria-hidden="true" size={14} />
          <span className="truncate">Panel</span>
        </button>

        <button
          type="button"
          className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-60 disabled:active:scale-100"
          onClick={copyLastDesignMd}
          disabled={!snapshot}
        >
          <Copy aria-hidden="true" size={14} />
          <span className="truncate">Copy</span>
        </button>
      </section>

      <section className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs" aria-label="Last result">
        {snapshot ? (
          <div className="space-y-3.5">
            <div>
              <div className="grid grid-cols-3 divide-x divide-slate-100">
                <Metric label="CSS Vars" value={snapshot.raw.cssVariables.length} />
                <Metric label="Elements" value={snapshot.raw.elementCounts.totalVisible} />
                <Metric label="Confidence" value={confidenceLabel} />
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out" style={{ width: confidenceBarWidth }} />
              </div>
            </div>

            <div className="space-y-1.5 border-t border-slate-100 pt-3">
              <TokenPreview label="Primary" value={primaryColor}>
                <span
                  className="h-6 w-6 rounded border border-slate-200 shadow-xs shrink-0"
                  style={{ backgroundColor: primaryColor === '-' ? '#F8FAFC' : primaryColor }}
                />
              </TokenPreview>
              <TokenPreview label="Spacing md" value={formatPx(spacingMd)}>
                <span className="flex h-6 w-10 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-50/50">
                  <span className="h-2 w-6 rounded bg-blue-500/80" />
                </span>
              </TokenPreview>
              <TokenPreview label="Radius md" value={formatPx(radiusMd)}>
                <span
                  className="h-6 w-6 shrink-0 border border-blue-200 bg-blue-50/50"
                  style={{ borderRadius: formatPx(radiusMd) }}
                />
              </TokenPreview>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-xs font-medium text-slate-500">No page analyzed yet.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="min-w-0 text-center first:text-left last:text-right px-2 first:pl-0 last:pr-0">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}

function TokenPreview({ children, label, value }: { children: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex h-9 items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/40 px-2 py-1 shadow-2xs hover:bg-slate-50 transition-colors duration-150">
      <div className="flex min-w-0 items-center gap-2">
        {children}
        <span className="truncate text-xs font-semibold text-slate-600">{label}</span>
      </div>
      <span className="shrink-0 font-mono text-xs font-bold text-slate-800 tracking-tight">{value}</span>
    </div>
  );
}
