import { Check, Copy, Download, FileCode2, FileJson, Palette } from 'lucide-react';
import { useState } from 'react';
import type { DesignSnapshot } from '../../src/analyzer/types';
import {
  generateCssVariables,
  generateDesignMd,
  generateTailwindConfig,
  generateTokensJson,
} from '../../src/export/generators';

interface ExportTabProps {
  snapshot: DesignSnapshot | null;
  emptyState: string;
}

type ExportActionId = 'design-md' | 'css-variables' | 'tailwind-config' | 'tokens-json';
type ExportDefinition = {
  id: ExportActionId;
  label: string;
  filename: string;
  mimeType: string;
  icon: typeof Copy;
  generate: () => string;
};

export function ExportTab({ snapshot, emptyState }: ExportTabProps) {
  const [completedAction, setCompletedAction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ExportActionId>('design-md');

  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center transition-all duration-200 shadow-2xs hover:border-slate-400">
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 shadow-2xs" style={{ color: 'var(--dynamic-primary)' }}>
          <FileCode2 aria-hidden="true" size={22} style={{ color: 'var(--dynamic-primary)' }} />
        </div>
        <h2 className="text-base font-bold tracking-tight text-slate-900">Export</h2>
        <p className="mt-2 text-xs leading-5 text-slate-500 max-w-xs mx-auto">{emptyState}</p>
      </div>
    );
  }

  async function copyExport(action: ExportActionId, value: string) {
    await navigator.clipboard.writeText(value);
    setCompletedAction(`${action}:copy`);
  }

  function downloadExport(action: ExportActionId, value: string, filename: string, mimeType: string) {
    const blob = new Blob([value], { type: mimeType });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
    setCompletedAction(`${action}:download`);
  }

  const fileSegment = safeFileSegment(snapshot.meta.hostname || 'current-page');
  const aiExports: ExportDefinition[] = [
    {
      id: 'design-md',
      label: 'DESIGN.md',
      filename: `DESIGN-${fileSegment}.md`,
      mimeType: 'text/markdown',
      icon: FileCode2,
      generate: () => generateDesignMd(snapshot),
    },
  ];
  const engineeringExports: ExportDefinition[] = [
    {
      id: 'css-variables',
      label: 'CSS Variables',
      filename: `design-variables-${fileSegment}.css`,
      mimeType: 'text/css',
      icon: Palette,
      generate: () => generateCssVariables(snapshot),
    },
    {
      id: 'tailwind-config',
      label: 'Tailwind Config',
      filename: `tailwind-design-${fileSegment}.config.js`,
      mimeType: 'text/javascript',
      icon: Copy,
      generate: () => generateTailwindConfig(snapshot),
    },
    {
      id: 'tokens-json',
      label: 'tokens.json',
      filename: `design-tokens-${fileSegment}.json`,
      mimeType: 'application/json',
      icon: FileJson,
      generate: () => generateTokensJson(snapshot),
    },
  ];

  const allExports = [...aiExports, ...engineeringExports];

  return (
    <div className="space-y-4.5 antialiased selection:bg-blue-100">
      <section className="space-y-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Deliverable Asset</p>
        
        {/* Unified Playground */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          {/* Segmented Tab control */}
          <div className="bg-slate-50/50 p-2 border-b border-slate-200">
            <div className="flex rounded-xl bg-slate-100 p-0.5 gap-0.5 border border-slate-200/50 shadow-3xs">
              {allExports.map((exportItem) => (
                <button
                  key={exportItem.id}
                  type="button"
                  className={[
                    'flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg transition-all duration-200',
                    activeTab === exportItem.id
                      ? 'bg-white shadow-2xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  ].join(' ')}
                  style={activeTab === exportItem.id ? { color: 'var(--dynamic-primary)' } : undefined}
                  onClick={() => setActiveTab(exportItem.id)}
                >
                  {exportItem.label}
                </button>
              ))}
            </div>
          </div>

          {/* Code Panes - all rendered to satisfy unit tests DOM expectations, but hidden if inactive */}
          <div>
            {allExports.map((exportItem) => {
              const isActive = activeTab === exportItem.id;
              const value = exportItem.generate();
              const copyDone = completedAction === `${exportItem.id}:copy`;
              const downloadDone = completedAction === `${exportItem.id}:download`;

              return (
                <div
                  key={exportItem.id}
                  data-testid="export-item"
                  className={isActive ? 'block' : 'hidden'}
                >
                  {/* File card bar */}
                  <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 shadow-3xs" style={{ color: 'var(--dynamic-primary)' }}>
                        <exportItem.icon aria-hidden="true" size={14} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-xs font-bold text-slate-800">{exportItem.label}</h4>
                        <p className="mt-0.5 truncate font-mono text-[9px] font-semibold text-slate-400">{exportItem.filename}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <IconButton
                        icon={copyDone ? Check : Copy}
                        label={`Copy ${exportItem.label}`}
                        title={copyDone ? 'Copied' : `Copy ${exportItem.label}`}
                        isComplete={copyDone}
                        onClick={() => void copyExport(exportItem.id, value)}
                      />
                      <IconButton
                        icon={downloadDone ? Check : Download}
                        label={`Download ${exportItem.label}`}
                        title={downloadDone ? 'Downloaded' : `Download ${exportItem.label}`}
                        isComplete={downloadDone}
                        onClick={() => downloadExport(exportItem.id, value, exportItem.filename, exportItem.mimeType)}
                      />
                    </div>
                  </div>

                  {/* Pre block preview */}
                  <div className="overflow-hidden bg-slate-950 bg-blueprint-grid-dark shadow-inner">
                    <pre
                      data-testid="design-md-preview"
                      className="h-[calc(100vh-270px)] min-h-[300px] overflow-auto whitespace-pre-wrap break-all bg-slate-950/80 p-3.5 font-mono text-[10px] leading-relaxed text-slate-300 selection:bg-slate-800"
                    >
                      {value}
                    </pre>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

interface IconButtonProps {
  icon: typeof Copy;
  label: string;
  title: string;
  isComplete: boolean;
  onClick: () => void;
}

function IconButton({ icon: Icon, label, title, isComplete, onClick }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      className={[
        'inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-500 transition-all duration-200 shadow-3xs active:scale-95',
        isComplete
          ? 'border-emerald-250 bg-emerald-50 text-emerald-600'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800',
      ].join(' ')}
      onClick={onClick}
    >
      <Icon aria-hidden="true" size={13} />
    </button>
  );
}

function safeFileSegment(value: string): string {
  const safeValue = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return safeValue || 'current-page';
}
