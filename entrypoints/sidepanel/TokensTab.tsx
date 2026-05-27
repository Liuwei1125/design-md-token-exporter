import { Ban, Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { normalizeColor } from '../../src/core/color-normalization';
import type { DesignSnapshot } from '../../src/analyzer/types';
import type {
  ColorRoleName,
  ColorRoleToken,
  RadiusScaleName,
  SpacingScaleName,
  TypographyRoleName,
  TypographyRoleToken,
} from '../../src/core/types';
import type { EditableColorRole, IgnoredTokenKind, UserCorrections } from '../../src/store/design-store';
import { ColorTokenEditor, NumberTokenEditor, TextTokenEditor } from './TokenEditor';

interface TokensTabProps {
  snapshot: DesignSnapshot | null;
  userCorrections: UserCorrections;
  editingEnabled: boolean;
  emptyState: string;
  onColorChange: (role: EditableColorRole, value: string) => void;
  onFontFamilyChange: (value: string) => void;
  onRadiusChange: (scaleName: RadiusScaleName, value: number) => void;
  onSpacingChange: (scaleName: SpacingScaleName, value: number) => void;
  onIgnoreToken: (kind: IgnoredTokenKind, value: string | number) => void;
}

type ColorSpecimenGroup = 'Brand / Accent' | 'Surfaces / Text / Borders' | 'Semantic' | 'Neutrals';

interface ColorSpecimenRow {
  role: ColorRoleName;
  label: string;
  group: ColorSpecimenGroup;
  token: ColorRoleToken;
}

interface RadiusSpecimenRow {
  scaleName: RadiusScaleName;
  value?: number;
  evidence?: string[];
  detected: boolean;
}

const colorRoleDefinitions: { role: ColorRoleName; label: string; group: ColorSpecimenGroup }[] = [
  { role: 'primary', label: 'Primary', group: 'Brand / Accent' },
  { role: 'primaryForeground', label: 'Primary Foreground', group: 'Brand / Accent' },
  { role: 'background', label: 'Background', group: 'Surfaces / Text / Borders' },
  { role: 'surface', label: 'Surface', group: 'Surfaces / Text / Borders' },
  { role: 'textPrimary', label: 'Text Primary', group: 'Surfaces / Text / Borders' },
  { role: 'textSecondary', label: 'Text Secondary', group: 'Surfaces / Text / Borders' },
  { role: 'border', label: 'Border', group: 'Surfaces / Text / Borders' },
  { role: 'success', label: 'Success', group: 'Semantic' },
  { role: 'warning', label: 'Warning', group: 'Semantic' },
  { role: 'danger', label: 'Danger', group: 'Semantic' },
  { role: 'neutral', label: 'Neutral', group: 'Neutrals' },
];
const editableColorRoles: EditableColorRole[] = ['primary', 'background', 'surface', 'textPrimary', 'textSecondary', 'border'];
const typographyRoleOrder: TypographyRoleName[] = ['heading', 'body', 'caption', 'button', 'input'];
const radiusScaleOrder: RadiusScaleName[] = ['sm', 'md', 'lg', 'xl', 'full'];
const spacingScaleOrder: SpacingScaleName[] = ['xs', 'sm', 'md', 'lg', 'xl'];

export function TokensTab({
  snapshot,
  userCorrections,
  editingEnabled,
  emptyState,
  onColorChange,
  onFontFamilyChange,
  onRadiusChange,
  onSpacingChange,
  onIgnoreToken,
}: TokensTabProps) {
  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center transition-all duration-200 shadow-2xs hover:border-slate-400">
        <h2 className="text-base font-bold tracking-tight text-slate-900">Tokens</h2>
        <p className="mt-2 text-xs leading-5 text-slate-500 max-w-xs mx-auto">{emptyState}</p>
      </div>
    );
  }

  const fontFamily =
    userCorrections.fontFamily ||
    snapshot.tokens.typography.fontFamilies[0]?.value ||
    snapshot.tokens.typography.roles.body?.fontFamily ||
    '';
  const colorRows = buildColorRows(snapshot);
  const typographyRows = buildTypographyRows(snapshot, fontFamily);
  const radiusRows = buildRadiusRows(snapshot, userCorrections);
  const spacingRows = buildSpacingRows(snapshot, userCorrections);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-slate-900 shadow-2xs antialiased">
      <div className="grid gap-7">
        <header className="grid gap-3 border-b border-slate-100 pb-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Token Specimen</p>
          <div className="grid gap-1">
            <div className="flex items-center gap-2 min-w-0">
              {snapshot.meta.favicon ? (
                <img
                  src={snapshot.meta.favicon}
                  alt=""
                  className="h-5 w-5 rounded object-contain shrink-0 border border-slate-100 bg-slate-50"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900 leading-snug truncate">
                {snapshot.meta.title || snapshot.meta.hostname || 'Extracted Design System'}
              </h2>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              A local, evidence-backed specimen of the colors, typography, spacing, and shape extracted from the current page.
            </p>
          </div>
          <div className={[
            'rounded-xl border p-3.5 shadow-2xs',
            editingEnabled
              ? 'border-blue-100 bg-blue-50/40 text-blue-800'
              : 'border-slate-200 bg-slate-50/50 text-slate-700'
          ].join(' ')}>
            <p className="text-[10px] font-bold uppercase tracking-wider">
              {editingEnabled ? 'Token corrections enabled' : 'Token corrections disabled'}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              {editingEnabled
                ? 'Correction controls are visible. Saved corrections override extracted values locally.'
                : 'Tokens are read-only by default. Open settings to enable correction controls.'}
            </p>
          </div>
        </header>

        <ColorPaletteSection
          rows={colorRows}
          editingEnabled={editingEnabled}
          userCorrections={userCorrections}
          onColorChange={onColorChange}
          onIgnoreToken={onIgnoreToken}
        />

        <TypographySpecimenSection rows={typographyRows} />

        <FontFamiliesSection
          fontFamilies={snapshot.tokens.typography.fontFamilies}
          fontFamily={fontFamily}
          editingEnabled={editingEnabled}
          onFontFamilyChange={onFontFamilyChange}
          onIgnoreToken={onIgnoreToken}
        />

        <SpacingShapeSection
          spacingRows={spacingRows}
          editingEnabled={editingEnabled}
          onSpacingChange={onSpacingChange}
          onIgnoreToken={onIgnoreToken}
        />

        <BorderRadiusSection
          radiusRows={radiusRows}
          editingEnabled={editingEnabled}
          onRadiusChange={onRadiusChange}
          onIgnoreToken={onIgnoreToken}
        />

        <ExtractionNotesSection snapshot={snapshot} colorRows={colorRows} />
      </div>
    </div>
  );
}

function ColorPaletteSection({
  rows,
  editingEnabled,
  userCorrections,
  onColorChange,
  onIgnoreToken,
}: {
  rows: ColorSpecimenRow[];
  editingEnabled: boolean;
  userCorrections: UserCorrections;
  onColorChange: TokensTabProps['onColorChange'];
  onIgnoreToken: TokensTabProps['onIgnoreToken'];
}) {
  const groups = ['Brand / Accent', 'Surfaces / Text / Borders', 'Semantic', 'Neutrals'] as const;

  return (
    <SpecimenSection title="Color Palette">
      <div className="grid gap-5">
        {groups.map((group) => {
          const groupRows = rows.filter((row) => row.group === group);
          if (!groupRows.length) return null;

          return (
            <div key={group} className="grid gap-2.5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">{group}</h3>
              <div className="grid grid-cols-2 gap-3">
                {groupRows.map((row) => (
                  <article
                    key={row.role}
                    data-testid={`color-specimen-${row.role}`}
                    className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/20 p-3 shadow-2xs hover:shadow-xs transition-all duration-200"
                  >
                    <div className="group relative">
                      <div
                        className="h-12 rounded-xl border border-slate-200/80 shadow-inner"
                        style={{ background: row.token.value }}
                        aria-hidden="true"
                      />
                      <CopyTokenButton
                        label={row.label}
                        value={row.token.value}
                        className="absolute right-2 top-2 bg-black/35 text-white backdrop-blur-xs transition-all duration-150 hover:bg-black/50"
                        showLabel
                      />
                    </div>
                    <div className="mt-2.5 px-0.5">
                      <h4 className="truncate text-xs font-bold text-slate-900 leading-snug">{row.label}</h4>
                      <CopyableValue
                        label={row.label}
                        value={userCorrections.colors?.[row.role as EditableColorRole] || row.token.value}
                        compact
                        editingEnabled={editingEnabled && editableColorRoles.includes(row.role as EditableColorRole)}
                        type="color"
                        onSave={(nextVal) => onColorChange(row.role as EditableColorRole, nextVal)}
                      />
                      <div className="mt-2.5 flex items-center gap-1 text-[10px] font-medium text-slate-400">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                        <span className="font-bold text-blue-600 tabular-nums">{Math.round(row.token.confidence * 100)}%</span>
                        <span>confidence</span>
                      </div>
                      {row.token.evidence[0] ? (
                        <EvidenceSelectorViewer evidence={row.token.evidence[0]} />
                      ) : null}
                      {row.token.warnings.length ? <WarningList warnings={row.token.warnings} /> : null}

                      {editingEnabled ? (
                        <div className="mt-3 border-t border-slate-100 pt-3">
                          {editableColorRoles.includes(row.role as EditableColorRole) ? (
                            <div className="mb-2">
                              <ColorTokenEditor
                                label={row.label}
                                role={row.role as EditableColorRole}
                                value={userCorrections.colors?.[row.role as EditableColorRole] || row.token.value}
                                confidence={row.token.confidence}
                                evidence={row.token.evidence}
                                warnings={row.token.warnings}
                                onChange={onColorChange}
                              />
                            </div>
                          ) : null}
                          <IgnoreTokenButton
                            label={`${row.label} token`}
                            onIgnore={() => onIgnoreToken('colors', row.token.value)}
                          />
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </SpecimenSection>
  );
}

function TypographySpecimenSection({ rows }: { rows: { role: TypographyRoleName; token: TypographyRoleToken }[] }) {
  if (!rows.length) return null;

  return (
    <SpecimenSection title="Typography Scale">
      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-[minmax(0,1fr)_8rem] border-b border-slate-200 bg-slate-50/50 px-4 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TYPE SCALE</p>
          <p className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Size · Weight · Line</p>
        </div>
        {rows.map(({ role, token }) => (
          <article
            key={role}
            data-testid={`typography-specimen-${role}`}
            className="border-b border-slate-100 bg-white px-4 py-3.5 last:border-b-0 hover:bg-slate-50/10 transition-colors duration-150"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{role}</h3>
              <p className="font-mono text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                {token.fontSize}px / {token.lineHeight}px / {token.fontWeight}
              </p>
            </div>
            <p
              className="mt-2.5 break-words text-slate-900 tracking-tight"
              style={{
                fontFamily: token.fontFamily,
                fontSize: `${clamp(token.fontSize, 12, 28)}px`,
                fontWeight: token.fontWeight,
                lineHeight: `${clamp(token.lineHeight, 16, 36)}px`,
                letterSpacing: `${token.letterSpacing}px`,
              }}
            >
              The quick brown fox jumps
            </p>
            {token.evidence[0] ? (
              <EvidenceSelectorViewer evidence={token.evidence[0]} />
            ) : null}
          </article>
        ))}
      </div>
    </SpecimenSection>
  );
}

function FontFamiliesSection({
  fontFamilies,
  fontFamily,
  editingEnabled,
  onFontFamilyChange,
  onIgnoreToken,
}: {
  fontFamilies: DesignSnapshot['tokens']['typography']['fontFamilies'];
  fontFamily: string;
  editingEnabled: boolean;
  onFontFamilyChange: TokensTabProps['onFontFamilyChange'];
  onIgnoreToken: TokensTabProps['onIgnoreToken'];
}) {
  const rows = fontFamilies.length
    ? fontFamilies.slice(0, 4)
    : fontFamily
      ? [{ value: fontFamily, frequency: 1, usage: ['user correction'], evidence: ['User correction: fontFamily'] }]
      : [];

  if (!rows.length && !editingEnabled) return null;

  return (
    <SpecimenSection title="Font Families">
      <div className="grid gap-3">
        {rows.map((row, index) => {
          const value = index === 0 ? fontFamily || row.value : row.value;
          const isPrimary = index === 0;

          return (
            <article key={`${row.value}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50/20 p-4 shadow-2xs hover:shadow-xs transition-all duration-200">
              <span className={[
                'inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider',
                isPrimary
                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                  : 'bg-slate-100 text-slate-600 border border-slate-200/80'
              ].join(' ')}>
                {isPrimary ? 'Primary' : 'Supporting'}
              </span>
              <div className="mt-2.5 flex min-w-0 flex-wrap items-baseline justify-between gap-2">
                <div className="group inline-flex min-w-0 items-center gap-1.5">
                  {editingEnabled && isPrimary ? (
                    <InlineEditFontFamily
                      label="Primary font family"
                      value={value}
                      onSave={onFontFamilyChange}
                    />
                  ) : (
                    <p className="min-w-0 break-words text-sm font-bold text-slate-900 tracking-tight" style={{ fontFamily: value }}>
                      {value}
                    </p>
                  )}
                  <CopyTokenButton label={`${isPrimary ? 'Primary' : 'Supporting'} font family`} value={value} />
                </div>
                <p className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100/85 px-1 py-0.5 rounded border border-slate-200">{row.frequency}x usage</p>
              </div>
              {row.usage.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {row.usage.map(u => (
                    <span key={u} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-500">
                      {u}
                    </span>
                  ))}
                </div>
              ) : null}
              {row.evidence[0] ? (
                <EvidenceSelectorViewer evidence={row.evidence[0]} />
              ) : null}
              {editingEnabled ? (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <IgnoreTokenButton
                    label={`${isPrimary ? 'Primary' : 'Supporting'} font family token`}
                    onIgnore={() => onIgnoreToken('fontFamilies', row.value)}
                  />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {editingEnabled ? (
        <div className="mt-3">
          <TextTokenEditor
            label="Font Family"
            value={fontFamily}
            evidence={fontFamilies[0]?.evidence}
            onChange={onFontFamilyChange}
          />
        </div>
      ) : null}
    </SpecimenSection>
  );
}

function SpacingShapeSection({
  spacingRows,
  editingEnabled,
  onSpacingChange,
  onIgnoreToken,
}: {
  spacingRows: { scaleName: SpacingScaleName; value: number; evidence?: string[] }[];
  editingEnabled: boolean;
  onSpacingChange: TokensTabProps['onSpacingChange'];
  onIgnoreToken: TokensTabProps['onIgnoreToken'];
}) {
  if (!spacingRows.length) return null;

  return (
    <SpecimenSection title="Spacing & Shape">
      <div className="mb-5 bg-slate-900 text-slate-100 rounded-2xl p-4.5 shadow-md border border-slate-800 relative overflow-hidden bg-blueprint-grid-dark">
        {/* Blueprint header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 mb-3.5">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Blueprint Spacing Scale</span>
          <span className="text-[9px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded uppercase font-bold">Caliper Mode</span>
        </div>
        
        {/* Calipers and rulers container */}
        <div className="space-y-4">
          {spacingRows.map(({ scaleName, value }) => (
            <div key={scaleName} className="relative group">
              {/* Caliper Header: label and precise value */}
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-mono font-bold text-slate-300">spacing.{scaleName}</span>
                <span className="font-mono text-xs font-semibold filter brightness-110" style={{ color: 'var(--dynamic-primary)' }}>{value}px</span>
              </div>
              
              {/* Caliper Visualization Area */}
              <div className="h-10 bg-slate-950/85 rounded-lg border border-slate-800 relative flex items-center px-3 overflow-hidden">
                {/* Tick marks representing engineering ruler background */}
                <div className="absolute inset-x-0 bottom-0 h-2 bg-slate-900 border-t border-slate-800/80 pointer-events-none" style={{
                  backgroundImage: 'repeating-linear-gradient(to right, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 8px)',
                  backgroundSize: '100% 100%'
                }} />
                
                {/* Caliper Block with exact width */}
                <div
                  data-testid={`spacing-scale-block-${scaleName}`}
                  className="h-5 rounded border transition-all duration-300 flex items-center relative"
                  style={{
                    width: `${clamp(value * 3, 24, 180)}px`,
                    borderColor: 'var(--dynamic-primary)',
                    backgroundColor: 'rgba(var(--dynamic-primary-rgb), 0.15)',
                    boxShadow: 'inset 0 0 8px rgba(var(--dynamic-primary-rgb), 0.2)'
                  }}
                >
                  {/* Left and Right extension arms */}
                  <div className="absolute -left-px top-0 bottom-0 w-px" style={{ backgroundColor: 'var(--dynamic-primary)' }} />
                  <div className="absolute -right-px top-0 bottom-0 w-px" style={{ backgroundColor: 'var(--dynamic-primary)' }} />
                  
                  {/* Caliper dimension indicator: inside if wide, outside if narrow to avoid squishing */}
                  {value * 3 >= 36 ? (
                    <span className="w-full text-center font-mono text-[9px] font-extrabold filter brightness-125 select-none tracking-tight" style={{ color: 'var(--dynamic-primary)' }}>
                      {value}px
                    </span>
                  ) : (
                    <span className="absolute left-[calc(100%+8px)] whitespace-nowrap font-mono text-[9px] font-extrabold filter brightness-125 select-none tracking-tight" style={{ color: 'var(--dynamic-primary)' }}>
                      {value}px
                    </span>
                  )}
                </div>
                
                {/* Ruler ticks background decoration */}
                <div className="absolute right-3 font-mono text-[8px] text-slate-700 tracking-wider font-bold">
                  SCALE 1:1
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-2xs">
        <TableHeader labels={['Purpose', 'Value', 'Preview']} />
        {spacingRows.map(({ scaleName, value, evidence }) => (
          <div
            key={scaleName}
            data-testid={`spacing-specimen-${scaleName}`}
            className="border-b border-slate-100 bg-white px-4 py-3.5 last:border-b-0 hover:bg-slate-50/10 transition-colors duration-150"
          >
            <div className="grid grid-cols-[5.5rem_auto_minmax(0,1fr)] items-center gap-3">
              <h3 className="text-xs font-bold text-slate-800">Spacing {scaleName}</h3>
              <CopyableValue
                label={`Spacing ${scaleName}`}
                value={`${value}px`}
                editingEnabled={editingEnabled}
                onSave={(nextVal) => {
                  const parsed = parseInt(String(nextVal), 10);
                  if (!isNaN(parsed)) {
                    onSpacingChange(scaleName, parsed);
                  }
                }}
              />
              <div
                className="rounded-md bg-gradient-to-r from-blue-600 to-indigo-500 shadow-2xs border border-blue-500/20"
                style={{
                  width: `${clamp(value * 2, 8, 96)}px`,
                  height: `${clamp(value * 0.9, 8, 28)}px`,
                }}
                aria-hidden="true"
              />
            </div>
            {evidence?.[0] ? (
              <EvidenceSelectorViewer evidence={evidence[0]} />
            ) : null}
            {editingEnabled ? (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <NumberTokenEditor
                  label={`Spacing ${scaleName}`}
                  value={value}
                  evidence={evidence}
                  onChange={(nextValue) => onSpacingChange(scaleName, nextValue)}
                />
                <div className="mt-2">
                  <IgnoreTokenButton
                    label={`Spacing ${scaleName} token`}
                    onIgnore={() => onIgnoreToken('spacing', value)}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </SpecimenSection>
  );
}

function BorderRadiusSection({
  radiusRows,
  editingEnabled,
  onRadiusChange,
  onIgnoreToken,
}: {
  radiusRows: RadiusSpecimenRow[];
  editingEnabled: boolean;
  onRadiusChange: TokensTabProps['onRadiusChange'];
  onIgnoreToken: TokensTabProps['onIgnoreToken'];
}) {
  if (!radiusRows.length) return null;

  return (
    <SpecimenSection title="Border Radius">
      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-2xs">
        <TableHeader labels={['Element', 'Value', 'Preview']} />
        {radiusRows.map(({ scaleName, value, evidence }) => {
          const hasValue = typeof value === 'number';
          const previewRadius = hasValue ? (scaleName === 'full' ? 64 : clamp(value, 0, 40)) : 0;

          return (
            <div
              key={scaleName}
              data-testid={`radius-specimen-${scaleName}`}
              className="border-b border-slate-100 bg-white px-4 py-3.5 last:border-b-0 hover:bg-slate-50/10 transition-colors duration-150"
            >
              <div className="grid grid-cols-[5.5rem_auto_minmax(0,1fr)] items-center gap-3">
                <h3 className="text-xs font-bold text-slate-800">Radius {scaleName}</h3>
                {hasValue ? (
                  <CopyableValue
                    label={`Radius ${scaleName}`}
                    value={`${value}px`}
                    editingEnabled={editingEnabled}
                    onSave={(nextVal) => {
                      const parsed = parseInt(String(nextVal), 10);
                      if (!isNaN(parsed)) {
                        onRadiusChange(scaleName, parsed);
                      }
                    }}
                  />
                ) : (
                  <p className="text-xs font-medium text-slate-400 italic">Not detected</p>
                )}
                {hasValue ? (
                  <CornerRadiusPreview scaleName={scaleName} previewRadius={previewRadius} />
                ) : (
                  <MissingRadiusPreview scaleName={scaleName} />
                )}
              </div>
              {evidence?.[0] ? (
                <EvidenceSelectorViewer evidence={evidence[0]} />
              ) : null}
              {editingEnabled && hasValue ? (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <NumberTokenEditor
                    label={`Radius ${scaleName}`}
                    value={value}
                    evidence={evidence}
                    onChange={(nextValue) => onRadiusChange(scaleName, nextValue)}
                  />
                  <div className="mt-2">
                    <IgnoreTokenButton
                      label={`Radius ${scaleName} token`}
                      onIgnore={() => onIgnoreToken('radius', value)}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </SpecimenSection>
  );
}

function ExtractionNotesSection({ snapshot, colorRows }: { snapshot: DesignSnapshot; colorRows: ColorSpecimenRow[] }) {
  const notes = [
    ...snapshot.tokens.colors.warnings,
    ...colorRows.flatMap((row) => row.token.warnings),
    ...colorRows
      .filter((row) => row.token.confidence < 0.7)
      .map((row) => `${row.label} has low confidence (${Math.round(row.token.confidence * 100)}%).`),
  ];

  if (!notes.length) return null;

  return (
    <SpecimenSection title="Extraction Notes">
      <ul className="grid gap-2 text-xs leading-relaxed text-amber-800">
        {Array.from(new Set(notes)).map((note) => (
          <li key={note} className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 shadow-2xs font-medium flex items-start gap-2">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </SpecimenSection>
  );
}

function IgnoreTokenButton({ label, onIgnore }: { label: string; onIgnore: () => void }) {
  return (
    <button
      type="button"
      aria-label={`Ignore ${label}`}
      title={`Ignore ${label}`}
      className="mt-2 inline-flex h-8 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
      onClick={onIgnore}
    >
      <Ban aria-hidden="true" size={13} />
      Ignore
    </button>
  );
}

function SpecimenSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TableHeader({ labels }: { labels: [string, string, string] }) {
  return (
    <div className="grid grid-cols-[5.5rem_4rem_minmax(0,1fr)] gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2">
      {labels.map((label) => (
        <p key={label} className="text-[11px] font-semibold text-slate-500">
          {label}
        </p>
      ))}
    </div>
  );
}

function CopyableValue({
  label,
  value,
  compact = false,
  editingEnabled = false,
  type = 'text',
  onSave,
}: {
  label: string;
  value: string | number;
  compact?: boolean;
  editingEnabled?: boolean;
  type?: 'text' | 'number' | 'color';
  onSave?: (val: any) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(String(value));

  useEffect(() => {
    setTempValue(String(value));
  }, [value]);

  if (editingEnabled && isEditing) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        setIsEditing(false);
        const finalVal = type === 'number' ? Number(tempValue) : tempValue;
        onSave?.(finalVal);
      } else if (e.key === 'Escape') {
        setTempValue(String(value));
        setIsEditing(false);
      }
    };

    const handleBlur = () => {
      setIsEditing(false);
      const finalVal = type === 'number' ? Number(tempValue) : tempValue;
      onSave?.(finalVal);
    };

    return (
      <input
        type={type === 'color' ? 'text' : type}
        aria-label={`Edit ${label}`}
        autoFocus
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="h-6 w-20 rounded border border-blue-500 bg-white px-1 font-mono text-xs font-semibold text-slate-900 outline-none ring-2 ring-blue-100 shadow-2xs"
      />
    );
  }

  return (
    <div
      className={compact ? 'group inline-flex max-w-full items-center gap-1 cursor-pointer select-none' : 'group flex min-w-0 items-center gap-1 cursor-pointer select-none'}
      onDoubleClick={() => {
        if (editingEnabled) {
          setIsEditing(true);
        }
      }}
      title={editingEnabled ? 'Double click to edit inline' : undefined}
    >
      <p className="whitespace-nowrap font-mono text-xs text-slate-600 hover:text-blue-600 hover:bg-slate-50 px-1 rounded transition-colors" title={String(value)}>
        {value}
        {editingEnabled && (
          <span className="ml-1 opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 font-sans font-medium transition-opacity">
            ✎
          </span>
        )}
      </p>
      <CopyTokenButton label={label} value={String(value)} />
    </div>
  );
}

function InlineEditFontFamily({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (val: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  if (isEditing) {
    return (
      <input
        type="text"
        aria-label={`Edit ${label}`}
        autoFocus
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setIsEditing(false);
            onSave(tempValue);
          } else if (e.key === 'Escape') {
            setTempValue(value);
            setIsEditing(false);
          }
        }}
        onBlur={() => {
          setIsEditing(false);
          onSave(tempValue);
        }}
        className="h-6 w-40 rounded border border-blue-500 bg-white px-1.5 font-sans text-xs font-semibold text-slate-900 outline-none ring-2 ring-blue-100 shadow-2xs"
      />
    );
  }

  return (
    <p
      className="min-w-0 break-words text-sm font-bold text-slate-900 tracking-tight cursor-pointer hover:text-blue-600 hover:bg-slate-50 px-1 rounded transition-colors"
      style={{ fontFamily: value }}
      onDoubleClick={() => setIsEditing(true)}
      title="Double click to edit inline"
    >
      {value}
      <span className="ml-1 opacity-0 hover:opacity-100 text-[10px] text-blue-500 font-sans font-medium transition-opacity">
        ✎
      </span>
    </p>
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

export function EvidenceSelectorViewer({ evidence, dataTestId }: { evidence: string; dataTestId?: string }) {
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
        className="mt-1.5 pl-2 border-l border-slate-200/60 line-clamp-2 break-words text-slate-400/90 hover:text-slate-600 transition-colors duration-150 font-mono text-[10px]"
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
    <details className="mt-1.5 group/details pl-2 border-l border-slate-200/60 text-[10px] leading-relaxed text-slate-400/90 select-none">
      <summary className="cursor-pointer hover-text-dynamic-primary flex items-center gap-1 font-mono font-medium outline-none">
        <span className="truncate max-w-[150px] inline-block align-bottom" title={baseSelector}>{baseSelector}</span>
        <span className="shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[8px] font-bold px-1 py-0.5 rounded border border-slate-200/50 transition-colors">
          +{remainingCount} classes
        </span>
        <span className="text-[8px] transition-transform group-open/details:rotate-90">▶</span>
      </summary>
      <div className="mt-2 pl-1 max-h-28 overflow-y-auto scrollbar-thin flex flex-wrap gap-1 py-1 pr-1 bg-slate-50/50 border border-slate-200/60 rounded-lg p-1.5 font-mono select-text" data-testid={dataTestId}>
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

function CopyTokenButton({
  label,
  value,
  className = 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
  showLabel = false,
}: {
  label: string;
  value: string;
  className?: string;
  showLabel?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    await navigator.clipboard?.writeText(value);
    setCopied(true);
  }

  function clearCopied() {
    setCopied(false);
  }

  return (
    <button
      type="button"
      aria-label={`Copy ${label} value`}
      title={copied ? 'Copied' : `Copy ${value}`}
      className={[
        'inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium opacity-0 transition focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100',
        copied ? 'opacity-100' : '',
        className,
      ].join(' ')}
      onClick={() => void copyValue()}
      onBlur={clearCopied}
      onMouseLeave={clearCopied}
      onMouseOut={clearCopied}
    >
      {copied ? <Check aria-hidden="true" size={14} /> : <Copy aria-hidden="true" size={14} />}
      {showLabel ? <span>{copied ? 'Copied' : 'Copy'}</span> : null}
    </button>
  );
}

function CornerRadiusPreview({ scaleName, previewRadius }: { scaleName: RadiusScaleName; previewRadius: number }) {
  return (
    <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200 bg-white bg-blueprint-grid shadow-3xs shrink-0 flex items-center justify-center" aria-hidden="true">
      {/* Center crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
        <div className="h-full w-px border-l border-dashed border-slate-300" />
        <div className="w-full h-px border-t border-dashed border-slate-300" />
      </div>
      
      {/* Arc stroke drawing the corner radius */}
      <div
        data-testid={`radius-preview-${scaleName}`}
        className="absolute -bottom-2 -right-2 h-16 w-16 border-l border-t transition-all duration-300"
        style={{
          borderTopLeftRadius: `${previewRadius}px`,
          borderColor: 'var(--dynamic-primary)',
          borderWidth: '2px',
          backgroundColor: 'rgba(var(--dynamic-primary-rgb), 0.05)',
          width: '56px',
        }}
      />
      {/* Arc radius badge label */}
      <span className="absolute bottom-0.5 left-1 font-mono text-[8px] font-bold text-slate-400">r={previewRadius}</span>
    </div>
  );
}

function MissingRadiusPreview({ scaleName }: { scaleName: RadiusScaleName }) {
  return (
    <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200/50 bg-white bg-blueprint-grid opacity-50 shrink-0 flex items-center justify-center animate-pulse-slow" aria-hidden="true">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="h-full w-px border-l border-dashed border-slate-300" />
        <div className="w-full h-px border-t border-dashed border-slate-300" />
      </div>
      <div
        data-testid={`radius-preview-${scaleName}`}
        className="absolute -bottom-2 -right-2 h-16 w-16 border-l border-t border-dashed border-slate-300 bg-slate-50/40"
        style={{ width: '56px' }}
      />
      <span className="absolute bottom-0.5 left-1 font-mono text-[8px] font-bold text-slate-300">N/A</span>
    </div>
  );
}

function WarningList({ warnings }: { warnings: string[] }) {
  return (
    <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-700">
      {warnings.map((warning) => (
        <li key={warning}>{warning}</li>
      ))}
    </ul>
  );
}

function buildColorRows(snapshot: DesignSnapshot): ColorSpecimenRow[] {
  return colorRoleDefinitions.flatMap((definition) => {
    const token = snapshot.tokens.colors[definition.role];
    if (!token) return [];
    const normalizedValue = normalizeColor(token.value) || token.value;
    return [{
      ...definition,
      token: {
        ...token,
        value: normalizedValue,
      },
    }];
  });
}

function buildTypographyRows(snapshot: DesignSnapshot, fontFamily: string) {
  return typographyRoleOrder.flatMap((role) => {
    const token = snapshot.tokens.typography.roles[role];
    return token
      ? [
          {
            role,
            token: {
              ...token,
              fontFamily: fontFamily || token.fontFamily,
            },
          },
        ]
      : [];
  });
}

function buildRadiusRows(snapshot: DesignSnapshot, userCorrections: UserCorrections) {
  return radiusScaleOrder
    .map((scaleName) => {
      const token = snapshot.tokens.radius.scale[scaleName];
      const correctedValue = userCorrections.radius?.[scaleName];
      const value = correctedValue ?? token?.value;

      return {
        scaleName,
        value,
        evidence: token?.evidence,
        detected: typeof value === 'number',
      };
    })
    .filter((row) => row.detected || !(userCorrections.ignoredTokens?.radius?.length ?? 0));
}

function buildSpacingRows(snapshot: DesignSnapshot, userCorrections: UserCorrections) {
  return spacingScaleOrder
    .filter((scaleName) => snapshot.tokens.spacing.scale[scaleName] || userCorrections.spacing?.[scaleName] !== undefined)
    .map((scaleName) => {
      const token = snapshot.tokens.spacing.scale[scaleName];

      return {
        scaleName,
        value: userCorrections.spacing?.[scaleName] ?? token?.value ?? 0,
        evidence: token?.evidence,
      };
    });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
