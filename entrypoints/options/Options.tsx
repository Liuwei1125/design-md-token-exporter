import { SlidersHorizontal } from 'lucide-react';
import { useEffect } from 'react';
import { useSettingsStore } from '../../src/store/settings-store';

export function Options() {
  const { settings, loadSettings, setTokenEditingEnabled } = useSettingsStore();

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  return (
    <main className="min-h-screen bg-slate-50/50 text-slate-900 antialiased selection:bg-blue-100">
      <div className="mx-auto w-full max-w-2xl px-5 py-10">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Design.md Token Exporter</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 leading-snug">Settings</h1>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-500">
            Keep extraction review lightweight by default, then enable correction controls only when you need to adjust the
            local result.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5.5 shadow-2xs hover:shadow-xs transition-shadow duration-200">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
              <SlidersHorizontal aria-hidden="true" size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-slate-900">Token corrections</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                Show correction inputs in the Tokens tab. When disabled, corrected snapshots still use any saved corrections,
                but the workspace stays read-only.
              </p>
            </div>
            <label className="inline-flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors duration-150">
              <span className="min-w-6 text-center tabular-nums">{settings.tokens.editingEnabled ? 'On' : 'Off'}</span>
              <input
                type="checkbox"
                aria-label="Enable token corrections"
                className="h-4.5 w-4.5 rounded border-slate-350 text-blue-600 focus:ring-blue-100 cursor-pointer shadow-2xs transition-colors duration-150"
                checked={settings.tokens.editingEnabled}
                onInput={(event) => void setTokenEditingEnabled(event.currentTarget.checked)}
              />
            </label>
          </div>
        </section>
      </div>
    </main>
  );
}
