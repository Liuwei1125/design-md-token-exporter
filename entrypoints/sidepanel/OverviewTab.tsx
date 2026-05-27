import { ClipboardList } from 'lucide-react';
import type { DesignSnapshot } from '../../src/analyzer/types';
import { TokenRow } from './TokenRow';

interface OverviewTabProps {
  snapshot: DesignSnapshot | null;
  emptyState: string;
}

export function OverviewTab({ snapshot, emptyState }: OverviewTabProps) {
  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center transition-all duration-200 shadow-2xs hover:border-slate-400">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 shadow-2xs" style={{ color: 'var(--dynamic-primary)' }}>
          <ClipboardList aria-hidden="true" size={22} style={{ color: 'var(--dynamic-primary)' }} />
        </div>
        <h2 className="text-base font-bold tracking-tight text-slate-900">Overview</h2>
        <p className="mt-2 text-xs leading-5 text-slate-500 max-w-xs mx-auto">{emptyState}</p>
      </div>
    );
  }

  const evidence = buildEvidence(snapshot);
  const warnings = snapshot.tokens.colors.warnings;
  const confidence = snapshot.tokens.colors.primary.confidence;
  const designSystem = getDesignSystem(snapshot);

  // SVG Gauge calculations
  const radius = 32;
  const circumference = 2 * Math.PI * radius; // ~201.06
  const strokeDashoffset = circumference - (confidence * circumference);

  const headingFont = snapshot.tokens.typography?.roles?.heading?.fontFamily || snapshot.tokens.typography?.fontFamilies?.[0]?.value || 'system-ui, sans-serif';
  const bodyFont = snapshot.tokens.typography?.roles?.body?.fontFamily || snapshot.tokens.typography?.fontFamilies?.[0]?.value || 'system-ui, sans-serif';

  return (
    <div className="grid gap-4.5 antialiased">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Detected Design</h2>
        <div className="mt-1 flex items-center gap-2 min-w-0">
          {snapshot.meta.favicon ? (
            <img
              src={snapshot.meta.favicon}
              alt=""
              className="h-4.5 w-4.5 rounded object-contain shrink-0 border border-slate-100 bg-slate-50"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : null}
          <p className="truncate text-sm font-extrabold text-slate-900 tracking-tight" title={snapshot.meta.title || snapshot.meta.hostname}>
            {snapshot.meta.title || snapshot.meta.hostname}
          </p>
        </div>

        <div className="grid grid-cols-[5.5rem_1fr] gap-4 items-center mt-3 border-t border-slate-100 pt-3">
          {/* Circular Gauge */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative flex h-20 w-20 items-center justify-center shrink-0">
              <svg className="h-full w-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-slate-100 fill-transparent"
                  strokeWidth="6.5"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="fill-transparent animate-ring-grow"
                  strokeWidth="6.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    stroke: 'var(--dynamic-primary)',
                    '--dasharray': circumference,
                    '--dashoffset': strokeDashoffset,
                  } as React.CSSProperties}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="sr-only">Confidence</span>
                <span className="font-mono text-sm font-bold text-slate-900 leading-none">
                  {Math.round(confidence * 100)}%
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Score</span>
              </div>
            </div>
          </div>
          {/* Metric Rows */}
          <div className="grid gap-2 pl-2">
            <SummaryRow label="System" value={designSystem.label} />
            <SummaryRow label="Mode" value="Local Extraction" />
            <SummaryRow label="Visible elements" value={snapshot.raw.elementCounts.totalVisible} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Evidence</h3>
        {/* Stream Timeline */}
        <div className="relative ml-2 pl-5 border-l border-slate-200 space-y-4 py-1 mt-4">
          {evidence.map((item) => (
            <div key={item} className="relative flex items-center group pl-1.5 py-0.5">
              {/* Connector Dot */}
              <span className="absolute -left-[25px] h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-300 shadow-3xs group-hover-bg-dynamic-primary group-hover:scale-110 transition-all duration-200" />
              {/* Event Line */}
              <p className="text-xs font-bold text-slate-500 group-hover:text-slate-800 transition-colors duration-150 leading-relaxed select-none">
                {item}
              </p>
            </div>
          ))}
        </div>
      </section>

      {warnings.length ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Warnings</h3>
          <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-amber-850 font-semibold">
            {warnings.map((warning) => (
              <li key={warning} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-amber-500">⚠️</span>
                <span className="break-words">{warning}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1 mb-3">Typography DNA</h3>
        
        {/* Typography Pair blackboard card */}
        <div className="bg-slate-900 bg-blueprint-grid-dark rounded-xl border border-slate-800 p-3.5 flex items-center justify-between text-slate-100 relative overflow-hidden shadow-sm">
          <div className="flex items-baseline min-w-0">
            <span className="font-extrabold text-2xl leading-none tracking-tight shrink-0 filter brightness-110" style={{ fontFamily: headingFont, color: 'var(--dynamic-primary)' }}>Aa</span>
            <span className="text-xs font-semibold text-slate-400 pl-2 leading-none" style={{ fontFamily: bodyFont }}>Aa</span>
          </div>
          
          <div className="text-right min-w-0 pl-3">
            <p className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest leading-none">Font Stack</p>
            <p className="mt-1 truncate font-mono text-[9px] font-bold text-slate-200 max-w-[140px] leading-tight" title={headingFont}>
              {headingFont.split(',')[0].replace(/['"]/g, '')}
            </p>
            <p className="truncate font-mono text-[8px] font-semibold text-slate-400 max-w-[140px] leading-none mt-0.5" title={bodyFont}>
              Body: {bodyFont.split(',')[0].replace(/['"]/g, '')}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-2.5">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Key Tokens</h3>
        <div className="grid gap-2.5">
          <TokenRow label="Primary" value={snapshot.tokens.colors.primary.value} confidence={snapshot.tokens.colors.primary.confidence} evidence={snapshot.tokens.colors.primary.evidence} warnings={snapshot.tokens.colors.primary.warnings} swatch={snapshot.tokens.colors.primary.value} />
          <TokenRow label="Background" value={snapshot.tokens.colors.background.value} confidence={snapshot.tokens.colors.background.confidence} evidence={snapshot.tokens.colors.background.evidence} warnings={snapshot.tokens.colors.background.warnings} swatch={snapshot.tokens.colors.background.value} />
          <TokenRow label="Text Primary" value={snapshot.tokens.colors.textPrimary.value} confidence={snapshot.tokens.colors.textPrimary.confidence} evidence={snapshot.tokens.colors.textPrimary.evidence} warnings={snapshot.tokens.colors.textPrimary.warnings} swatch={snapshot.tokens.colors.textPrimary.value} />
          {snapshot.tokens.colors.surface ? (
            <TokenRow label="Surface" value={snapshot.tokens.colors.surface.value} confidence={snapshot.tokens.colors.surface.confidence} evidence={snapshot.tokens.colors.surface.evidence} warnings={snapshot.tokens.colors.surface.warnings} swatch={snapshot.tokens.colors.surface.value} />
          ) : null}
          {snapshot.tokens.colors.border ? (
            <TokenRow label="Border" value={snapshot.tokens.colors.border.value} confidence={snapshot.tokens.colors.border.confidence} evidence={snapshot.tokens.colors.border.evidence} warnings={snapshot.tokens.colors.border.warnings} swatch={snapshot.tokens.colors.border.value} />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 last:border-b-0 last:pb-0 text-xs">
      <span className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider shrink-0">{label}</span>
      <span className="font-bold text-slate-800 truncate max-w-[120px]" title={String(value)}>{value}</span>
    </div>
  );
}

function buildEvidence(snapshot: DesignSnapshot): string[] {
  const designSystem = getDesignSystem(snapshot);
  const items = [
    `Found ${snapshot.raw.cssVariables.length} CSS variables`,
    `Found ${snapshot.raw.colorTokens.length} dominant colors`,
    `Found ${snapshot.tokens.typography.styles.length || Object.keys(snapshot.tokens.typography.roles).length} typography levels`,
  ];

  if (designSystem.id !== 'generic') {
    items.push(`Design system signal: ${designSystem.label} (${Math.round(designSystem.confidence * 100)}%)`);
  }

  const componentKinds = Object.entries(snapshot.components)
    .filter(([, candidates]) => candidates?.length)
    .map(([kind]) => kind);

  if (componentKinds.length) {
    items.push(`Found ${componentKinds.join('/')} candidates`);
  }

  return items;
}

function getDesignSystem(snapshot: DesignSnapshot) {
  return (
    snapshot.designSystem ?? {
      id: 'generic' as const,
      label: 'Generic',
      confidence: 0.1,
      evidence: ['No known design system signature matched'],
    }
  );
}
