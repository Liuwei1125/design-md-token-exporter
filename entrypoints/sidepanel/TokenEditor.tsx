import type { EditableColorRole } from '../../src/store/design-store';
import { TokenRow } from './TokenRow';

interface ColorTokenEditorProps {
  label: string;
  role: EditableColorRole;
  value: string;
  confidence?: number;
  evidence?: string[];
  warnings?: string[];
  onChange: (role: EditableColorRole, value: string) => void;
}

interface TextTokenEditorProps {
  label: string;
  value: string;
  evidence?: string[];
  onChange: (value: string) => void;
}

interface NumberTokenEditorProps {
  label: string;
  value: number;
  evidence?: string[];
  onChange: (value: number) => void;
}

export function ColorTokenEditor({
  label,
  role,
  value,
  confidence,
  evidence,
  warnings,
  onChange,
}: ColorTokenEditorProps) {
  return (
    <TokenRow label={label} value={value} confidence={confidence} evidence={evidence} warnings={warnings} swatch={value}>
      <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2">
        <input
          type="color"
          aria-label={`${label} color picker`}
          className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs"
          value={toColorInputValue(value)}
          onInput={(event) => onChange(role, event.currentTarget.value.toUpperCase())}
        />
        <input
          type="text"
          aria-label={`${label} token value`}
          className="h-9 min-w-0 rounded-lg border border-slate-200 bg-slate-50/30 px-3 font-mono text-xs font-semibold text-slate-900 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-2xs"
          value={value}
          onInput={(event) => onChange(role, event.currentTarget.value)}
        />
      </div>
    </TokenRow>
  );
}

export function TextTokenEditor({ label, value, evidence, onChange }: TextTokenEditorProps) {
  return (
    <TokenRow label={label} value={value} confidence={1} evidence={evidence}>
      <input
        type="text"
        aria-label={`${label} token value`}
        className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50/30 px-3 text-xs text-slate-900 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-2xs"
        value={value}
        onInput={(event) => onChange(event.currentTarget.value)}
      />
    </TokenRow>
  );
}

export function NumberTokenEditor({ label, value, evidence, onChange }: NumberTokenEditorProps) {
  return (
    <TokenRow label={label} value={`${value}px`} confidence={1} evidence={evidence}>
      <input
        type="number"
        min="0"
        step="1"
        aria-label={`${label} token value`}
        className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50/30 px-3 font-mono text-xs font-semibold text-slate-900 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-2xs"
        value={value}
        onInput={(event) => onChange(Number(event.currentTarget.value))}
      />
    </TokenRow>
  );
}

function toColorInputValue(value: string): string {
  const match = value.match(/^#[0-9a-f]{6}$/i);
  return match ? value : '#000000';
}
