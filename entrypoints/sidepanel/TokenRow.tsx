import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { normalizeColor } from '../../src/core/color-normalization';

interface TokenRowProps {
  label: string;
  value: string | number;
  confidence?: number;
  evidence?: string[];
  warnings?: string[];
  swatch?: string;
  children?: ReactNode;
}

export function TokenRow({ label, value, confidence, evidence = [], warnings = [], swatch, children }: TokenRowProps) {
  const normalizedValue = typeof value === 'string' ? (normalizeColor(value) || value) : value;
  const normalizedSwatch = swatch ? (normalizeColor(swatch) || swatch) : undefined;

  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs hover:shadow-xs hover:border-slate-300/80 transition-all duration-200">
      <div className="flex min-w-0 items-start gap-3">
        {normalizedSwatch ? (
          <span
            className="mt-0.5 h-8 w-8 shrink-0 rounded-lg border border-slate-300/95 shadow-xs transition-transform duration-200 hover:scale-105"
            style={{ backgroundColor: normalizedSwatch }}
            aria-hidden="true"
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <h4 className="min-w-0 truncate text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</h4>
            <p className="whitespace-nowrap font-mono text-xs font-bold text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100" title={String(normalizedValue)}>
              {normalizedValue}
            </p>
          </div>

          {confidence !== undefined || evidence.length ? (
            <div className="mt-2 min-w-0 text-[11px] leading-relaxed text-slate-400 space-y-1">
              {confidence !== undefined ? (
                <p className="flex items-center gap-1 font-medium text-slate-500">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span className="font-bold text-blue-600 tabular-nums">{Math.round(confidence * 100)}%</span>
                  <span>confidence</span>
                </p>
              ) : null}
              {evidence.slice(0, 2).map((item) => (
                <EvidenceSelectorViewer key={item} evidence={item} dataTestId="color-token-evidence" />
              ))}
            </div>
          ) : null}

          {warnings.length ? (
            <ul className="mt-2.5 space-y-1 rounded-lg border border-amber-100 bg-amber-50/40 p-2 text-[11px] leading-normal text-amber-800">
              {warnings.map((warning) => (
                <li key={warning} className="flex items-start gap-1">
                  <span className="mt-0.5 shrink-0 text-amber-500">⚠️</span>
                  <span className="break-words">{warning}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {children ? <div className="mt-3 border-t border-slate-100 pt-3">{children}</div> : null}
    </article>
  );
}

function sanitizeDescriptiveEvidence(str: string): string {
  if (!str) return str;
  // Regex to find content inside double quotes and truncate if it exceeds 25 characters
  return str.replace(/"([^"]+)"/g, (match, p1) => {
    if (p1.length > 25) {
      return `"${p1.substring(0, 25)}..."`;
    }
    return match;
  });
}

function EvidenceSelectorViewer({ evidence, dataTestId }: { evidence: string; dataTestId?: string }) {
  if (!evidence) return null;

  // Split the selector string by spaces to parse individual class selectors
  const parts = evidence.split(/\s+/).filter(Boolean);

  // Check if it is a descriptive CSS evidence sentence (not a pure selector class list)
  const isDescriptive =
    evidence.startsWith('backgroundColor on') ||
    evidence.startsWith('color on') ||
    evidence.startsWith('border') ||
    evidence.includes('"');

  const sanitized = sanitizeDescriptiveEvidence(evidence);

  // If it is just a short text, a descriptive sentence, or has few parts, show it cleanly
  if (isDescriptive || parts.length <= 4 || evidence.length < 80) {
    return (
      <p
        className="pl-2 border-l border-slate-200/60 line-clamp-2 break-words text-slate-400/90 hover:text-slate-600 transition-colors duration-150 font-mono text-[10px]"
        data-testid={dataTestId}
        title={evidence}
      >
        {sanitized}
      </p>
    );
  }

  const baseSelector = parts[0];
  const remainingCount = parts.length - 1;

  return (
    <details className="mt-1 group/details pl-2 border-l border-slate-200/60 text-[10px] leading-relaxed text-slate-400/90 select-none">
      <summary className="cursor-pointer hover-text-dynamic-primary flex items-center gap-1 font-mono font-medium outline-none">
        <span className="truncate max-w-[120px] inline-block align-bottom" title={baseSelector}>{baseSelector}</span>
        <span className="shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[8px] font-bold px-1 py-0.5 rounded border border-slate-200/50 transition-colors">
          +{remainingCount} classes
        </span>
        <span className="text-[8px] transition-transform group-open/details:rotate-90">▶</span>
      </summary>
      <div className="mt-2 pl-1 max-h-24 overflow-y-auto scrollbar-thin flex flex-wrap gap-1 py-1 pr-1 bg-slate-50/50 border border-slate-200/60 rounded-lg p-1.5 font-mono select-text" data-testid={dataTestId}>
        {parts.map((part, idx) => (
          <span
            key={`${part}-${idx}`}
            className="inline-block bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-slate-600 text-[9px] px-1 rounded font-bold"
          >
            {part}
          </span>
        ))}
      </div>
    </details>
  );
}
