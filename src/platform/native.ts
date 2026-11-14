/**
 * One place where the editor talks to its host.
 *
 * In the desktop/mobile app (Tauri, `src-tauri/`) saving opens a native Save dialog and writes
 * a real file, printing uses the native print dialog, and documents opened from the OS
 * (double-click, "Open with", a second launch) arrive here. In a browser / the PWA everything
 * falls back to the web behaviour the app always had (anchor downloads, window.print()).
 */
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { PROJECT_LINKS, type ProjectLink } from '../appInfo';

export const isNativeApp = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/** Phones and tablets (the Android app, or a mobile browser). */
export const isMobile = (): boolean =>
  typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

type SaveData = Blob | string | Uint8Array | ArrayBuffer;

async function toBytes(data: SaveData): Promise<Uint8Array> {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (typeof data === 'string') {
    // data: URLs (canvas.toDataURL, JSON data URIs) become their decoded bytes.
    if (data.startsWith('data:')) {
      return new Uint8Array(await (await fetch(data)).arrayBuffer());
    }
    return new TextEncoder().encode(data);
  }
  return new Uint8Array(await data.arrayBuffer());
}

function browserDownload(fileName: string, data: SaveData, mimeType: string): void {
  let href: string;
  let revoke = false;
  if (typeof data === 'string' && data.startsWith('data:')) {
    href = data;
  } else {
    const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: mimeType });
    href = URL.createObjectURL(blob);
    revoke = true;
  }
  const a = document.createElement('a');
  a.href = href;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (revoke) setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/**
 * Saves `data` as `fileName`. Returns the saved file's name (the path's last part in the
 * native app, which the user may have changed), or `null` when the Save dialog was cancelled.
 */
export async function saveFile(
  fileName: string,
  data: SaveData,
  mimeType = 'application/octet-stream'
): Promise<string | null> {
  if (!isNativeApp()) {
    browserDownload(fileName, data, mimeType);
    return fileName;
  }
  const bytes = await toBytes(data);
  const savedPath = await invoke<string | null>('save_file', bytes, {
    headers: { 'x-file-name': encodeURIComponent(fileName) },
  });
  if (!savedPath) return null;
  return savedPath.split(/[\\/]/).pop() || fileName;
}

/** Native print dialog in the app; window.print() in a browser. */
export async function printDocument(): Promise<void> {
  if (isNativeApp()) {
    try {
      await invoke('print_document');
      return;
    } catch {
      // Fall through to the webview's own print.
    }
  }
  window.print();
}

interface PendingFile {
  path: string;
  name: string;
}

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
};

async function drainPendingFiles(onFile: (file: File) => void): Promise<void> {
  const pending = await invoke<PendingFile[]>('take_pending_files');
  for (const { path, name } of pending) {
    try {
      const buffer = await invoke<ArrayBuffer>('read_document', { path });
      const ext = name.split('.').pop()?.toLowerCase() ?? '';
      onFile(new File([buffer], name, { type: MIME_BY_EXT[ext] ?? 'application/json' }));
    } catch (err) {
      console.error('Could not open', path, err);
    }
  }
}

/**
 * Calls `onFile` for every document the OS hands the app: the ones it was launched with,
 * and any opened later. Returns an unsubscribe function. Does nothing in a browser.
 */
export function onFilesOpenedByOS(onFile: (file: File) => void): () => void {
  if (!isNativeApp()) return () => {};
  let unlisten: (() => void) | undefined;
  let disposed = false;
  listen('qalam://open-files', () => void drainPendingFiles(onFile)).then((fn) => {
    if (disposed) fn();
    else unlisten = fn;
  });
  void drainPendingFiles(onFile);
  return () => {
    disposed = true;
    unlisten?.();
  };
}

/** Opens the project website, source code, license or notices in the system browser. */
export async function openProjectLink(link: ProjectLink): Promise<void> {
  if (isNativeApp()) {
    await invoke('open_project_link', { link });
  } else {
    window.open(PROJECT_LINKS[link], '_blank', 'noopener,noreferrer');
  }
}
