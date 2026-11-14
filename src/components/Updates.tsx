import React, { useCallback, useState } from 'react';
import { CheckCircle2, Download, RefreshCw, RotateCw } from 'lucide-react';
import { APP_VERSION } from '../appInfo';
import {
  applyUpdate,
  canAutoCheck,
  checkForUpdate,
  loadPrefs,
  savePrefs,
  type UpdateFound,
} from '../platform/updates';

export type UpdateStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'current' }
  | { kind: 'found'; update: UpdateFound }
  | { kind: 'installing'; update: UpdateFound; progress: number | null }
  | { kind: 'error'; message: string; update?: UpdateFound };

export type Updates = ReturnType<typeof useUpdates>;

/** Update state shared by the start-up check (App), the title bar and the About box. */
export function useUpdates() {
  const [status, setStatus] = useState<UpdateStatus>({ kind: 'idle' });

  /** `quiet`: an automatic check, which never shows errors or "up to date". */
  const check = useCallback(async (quiet = false): Promise<UpdateFound | null> => {
    if (!quiet) setStatus({ kind: 'checking' });
    try {
      const update = await checkForUpdate();
      if (update) setStatus({ kind: 'found', update });
      else if (!quiet) setStatus({ kind: 'current' });
      return update;
    } catch (err) {
      if (!quiet) {
        setStatus({ kind: 'error', message: `Couldn't check for updates: ${err instanceof Error ? err.message : String(err)}` });
      }
      return null;
    }
  }, []);

  const install = useCallback(async (update: UpdateFound) => {
    if (update.how === 'install') setStatus({ kind: 'installing', update, progress: null });
    try {
      await applyUpdate(update, (progress) => setStatus({ kind: 'installing', update, progress }));
    } catch (err) {
      setStatus({ kind: 'error', update, message: `The update didn't install: ${err instanceof Error ? err.message : String(err)}` });
    }
  }, []);

  return { status, check, install };
}

/** The update the user can act on, if any. */
export function availableUpdate(status: UpdateStatus): UpdateFound | undefined {
  if (status.kind === 'found' || status.kind === 'installing') return status.update;
  if (status.kind === 'error') return status.update;
  return undefined;
}

function updateLabel(u: UpdateFound) {
  return u.version ? `Version ${u.version} is available` : 'A new version is available';
}

const btn =
  'inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors disabled:opacity-60 disabled:cursor-default';

/** The "Updates" part of the About box. */
export const UpdatesSection: React.FC<{ updates: Updates }> = ({ updates }) => {
  const { status, check, install } = updates;
  const [auto, setAuto] = useState(() => loadPrefs().auto);
  const found = availableUpdate(status);

  return (
    <div className="mx-4 mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          {status.kind === 'idle' && <span className="text-slate-500">You have version {APP_VERSION}.</span>}
          {status.kind === 'checking' && <span className="text-slate-500">Checking for updates…</span>}
          {status.kind === 'current' && (
            <span className="flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> {APP_VERSION} is the latest version.
            </span>
          )}
          {found && status.kind !== 'error' && <span className="font-semibold text-blue-700">{updateLabel(found)}</span>}
          {status.kind === 'installing' && (
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-blue-600 transition-[width]"
                style={{ width: status.progress === null ? '30%' : `${Math.round(status.progress * 100)}%` }}
              />
            </div>
          )}
          {status.kind === 'error' && <span className="text-red-700">{status.message}</span>}
        </div>
        {found && status.kind !== 'installing' ? (
          <button type="button" onClick={() => void install(found)} className={`${btn} bg-blue-600 hover:bg-blue-700 text-white`}>
            {found.how === 'install' ? (
              <>
                <Download className="w-3.5 h-3.5" /> Install and restart
              </>
            ) : found.how === 'reload' ? (
              <>
                <RotateCw className="w-3.5 h-3.5" /> Reload to update
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" /> Download
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void check()}
            disabled={status.kind === 'checking' || status.kind === 'installing'}
            className={`${btn} bg-white border border-slate-300 text-slate-700 hover:bg-slate-100`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${status.kind === 'checking' ? 'animate-spin' : ''}`} /> Check for updates
          </button>
        )}
      </div>
      {status.kind === 'installing' && (
        <p className="mt-1.5 text-slate-500">Downloading and installing. Qalam restarts when it's done; your open documents are kept.</p>
      )}
      {found?.how === 'download' && status.kind === 'found' && (
        <p className="mt-1.5 leading-snug text-slate-500">
          The download opens in your browser. Install it over this copy: your documents and settings are kept.
        </p>
      )}
      {found?.how === 'reload' && status.kind === 'found' && (
        <p className="mt-1.5 leading-snug text-slate-500">Your open documents are saved automatically and come back after the reload.</p>
      )}
      {canAutoCheck() && (
        <label className="mt-2 pt-2 border-t border-slate-200 flex cursor-pointer items-start gap-2 text-slate-700">
          <input
            type="checkbox"
            className="mt-0.5 accent-blue-600"
            checked={auto}
            onChange={(e) => {
              setAuto(e.target.checked);
              savePrefs({ ...loadPrefs(), auto: e.target.checked });
            }}
          />
          <span>
            Check for updates when Qalam starts
            <span className="block text-[10px] text-slate-500">
              At most once a day. Only asks GitHub for the latest release; nothing about you or your documents is sent.
            </span>
          </span>
        </label>
      )}
    </div>
  );
};
