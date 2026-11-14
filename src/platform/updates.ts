/**
 * Checking for and installing new versions.
 *
 * - Desktop app: Tauri's updater reads the release feed (latest.json on GitHub releases),
 *   downloads the installer, checks its signature against the key built into the app, installs
 *   it and restarts. Copies it can't replace (the portable Windows .zip, Linux .deb/.rpm), or a
 *   release without a feed, fall back to the GitHub release page.
 * - Android: the latest GitHub release; the APK opens in the browser to install over this one
 *   (same signing key, so documents and settings are kept).
 * - Web app: the service worker fetches the new version; a reload switches to it.
 *
 * Nothing is sent but the request itself, and only when the user checks or has left automatic
 * checks on.
 */
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { APP_VERSION, PROJECT_LINKS } from '../appInfo';
import { compareVersions } from '../utils/version';
import { isMobile, isNativeApp } from './native';

export interface UpdateFound {
  /** "1.2.3", or null when only "something newer" is known (web app). */
  version: string | null;
  notes?: string;
  /** install: download, install and restart in the app. download: open `url`. reload: web app. */
  how: 'install' | 'download' | 'reload';
  url?: string;
}

const RELEASES_API = 'https://api.github.com/repos/uzairasad/qalam-urdu-studio/releases/latest';
const RELEASES_PAGE = `${PROJECT_LINKS.source}/releases/latest`;
const PREFS_KEY = 'qalam:updates:v1';
const DAY = 24 * 60 * 60 * 1000;

interface GithubRelease {
  tag_name: string;
  body?: string;
  html_url: string;
  draft?: boolean;
  prerelease?: boolean;
  assets?: { name: string; browser_download_url: string }[];
}

async function fromGithub(): Promise<UpdateFound | null> {
  const res = await fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
  if (res.status === 404) return null; // no release published yet
  if (!res.ok) {
    throw new Error(res.status === 403 ? 'GitHub is limiting requests right now. Try again later.' : `GitHub answered ${res.status}.`);
  }
  const rel = (await res.json()) as GithubRelease;
  if (rel.draft || rel.prerelease || compareVersions(rel.tag_name, APP_VERSION) <= 0) return null;
  const apk = isMobile() ? rel.assets?.find((a) => /android.*\.apk$/i.test(a.name)) : undefined;
  return {
    version: rel.tag_name.replace(/^v/i, ''),
    notes: rel.body,
    how: 'download',
    url: apk?.browser_download_url ?? rel.html_url,
  };
}

async function webCheck(): Promise<UpdateFound | null> {
  const reg = await navigator.serviceWorker?.getRegistration();
  if (!reg) return null; // not installed as an app / dev server: the page is always current
  await reg.update();
  const fresh = reg.installing ?? reg.waiting;
  return fresh ? { version: null, how: 'reload' } : null;
}

/** Looks for a newer version. Null means this one is the latest. */
export async function checkForUpdate(): Promise<UpdateFound | null> {
  savePrefs({ ...loadPrefs(), lastCheck: Date.now() });
  if (!isNativeApp()) return webCheck();
  if (!isMobile()) {
    try {
      const found = await invoke<{ version: string; notes?: string; canInstall: boolean } | null>('check_update');
      if (!found) return null;
      return found.canInstall
        ? { version: found.version, notes: found.notes, how: 'install' }
        : { version: found.version, notes: found.notes, how: 'download', url: RELEASES_PAGE };
    } catch (err) {
      // No signed feed for this release (or it couldn't be read): still say what's new.
      console.warn('Updater check failed, asking GitHub instead:', err);
    }
  }
  return fromGithub();
}

/** Installs a found update. Desktop installs and restarts; the others open the download. */
export async function applyUpdate(update: UpdateFound, onProgress?: (fraction: number | null) => void): Promise<void> {
  if (update.how === 'reload') {
    window.location.reload();
    return;
  }
  if (update.how === 'download') {
    const url = update.url ?? RELEASES_PAGE;
    if (isNativeApp()) await invoke('open_release_link', { url });
    else window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  const unlisten = await listen<[number, number | null]>('qalam://update-progress', (e) => {
    const [got, total] = e.payload;
    onProgress?.(total ? Math.min(1, got / total) : null);
  });
  try {
    await invoke('install_update'); // restarts the app when it succeeds
  } finally {
    unlisten();
  }
}

export interface UpdatePrefs {
  /** Check when the app starts (at most once a day). */
  auto: boolean;
  lastCheck: number;
}

export function loadPrefs(): UpdatePrefs {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<UpdatePrefs>;
    return { auto: saved.auto ?? true, lastCheck: saved.lastCheck ?? 0 };
  } catch {
    return { auto: true, lastCheck: 0 };
  }
}

export function savePrefs(p: UpdatePrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    // Storage unavailable: the preference just isn't remembered.
  }
}

/** Automatic checks run in the installed apps (the web app updates itself through its service worker). */
export const canAutoCheck = (): boolean => isNativeApp();

export function autoCheckDue(): boolean {
  const p = loadPrefs();
  return canAutoCheck() && p.auto && Date.now() - p.lastCheck > DAY;
}
