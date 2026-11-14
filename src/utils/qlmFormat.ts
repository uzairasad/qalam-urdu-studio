/**
 * The .qlm document format.
 *
 * Version 2 (Qalam Urdu Studio 0.1.7+) is a ZIP package, like .docx, .odt and .epub:
 *
 *   mimetype         "application/vnd.qalam-urdu-studio.document" (first, stored uncompressed)
 *   document.json    { format, version, generator, savedAt, document }
 *   media/…          pictures as ordinary image files, referenced from document.json
 *
 * Pictures are stored as themselves instead of base64 text inside the JSON, and everything is
 * compressed, so files are much smaller; any ZIP tool can open one. Version 1 files (0.1.6 and
 * earlier: the document as plain JSON) still open, as do .qpg and .json saves of that form.
 * `version` lets later releases migrate older files; newer files open as far as they can.
 */
import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate';
import type { DocElement, DocumentProject } from '../types/inpage.ts';

export const QLM_MIME = 'application/vnd.qalam-urdu-studio.document';
export const QLM_FORMAT = 'qalam-urdu-studio';
export const QLM_VERSION = 2;

export class QlmFormatError extends Error {}

const EXTENSIONS: Readonly<Record<string, string>> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
};
const MIME_BY_EXTENSION: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(EXTENSIONS).map(([mime, ext]) => [ext, mime])
);

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Every element of the document (pages and master page), for walking pictures. */
function allElements(project: DocumentProject): DocElement[] {
  return [...(project.masterElements ?? []), ...project.pages.flatMap((p) => p.elements)];
}

/** Saves a document as a version 2 package. */
export function encodeQlm(project: DocumentProject, generator = 'Qalam Urdu Studio'): Uint8Array {
  const files: Zippable = {};
  const media = new Map<string, string>(); // data URL → path, so a repeated picture is stored once
  const copy: DocumentProject = structuredClone(project);
  for (const el of allElements(copy)) {
    if (el.type !== 'picture' || !el.imageSrc?.startsWith('data:')) continue;
    const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(el.imageSrc);
    if (!m) continue;
    let path = media.get(el.imageSrc);
    if (!path) {
      const ext = EXTENSIONS[m[1].toLowerCase()] ?? 'bin';
      path = `media/image${media.size + 1}.${ext}`;
      const data = m[2] ? base64ToBytes(m[3]) : strToU8(decodeURIComponent(m[3]));
      // Already-compressed images are stored as they are.
      files[path] = [data, { level: ext === 'svg' || ext === 'bmp' ? 6 : 0 }];
      media.set(el.imageSrc, path);
    }
    el.imageSrc = path;
  }
  const doc = {
    format: QLM_FORMAT,
    version: QLM_VERSION,
    generator,
    savedAt: new Date().toISOString(),
    document: copy,
  };
  return zipSync({
    mimetype: [strToU8(QLM_MIME), { level: 0 }],
    'document.json': [strToU8(JSON.stringify(doc)), { level: 6 }],
    ...files,
  });
}

const isZip = (b: Uint8Array) => b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 3 && b[3] === 4;

/** Opens a .qlm (version 2 package, or a version 1 / legacy JSON save). */
export function decodeQlm(bytes: Uint8Array): DocumentProject {
  if (isZip(bytes)) {
    let entries: Record<string, Uint8Array>;
    try {
      entries = unzipSync(bytes);
    } catch {
      throw new QlmFormatError('This Qalam document is damaged (its package could not be read).');
    }
    const json = entries['document.json'];
    if (!json) throw new QlmFormatError('This file is not a Qalam Urdu Studio document.');
    let doc: { format?: string; version?: number; document?: DocumentProject };
    try {
      doc = JSON.parse(strFromU8(json));
    } catch {
      throw new QlmFormatError('This Qalam document is damaged (document.json could not be read).');
    }
    if (doc.format !== QLM_FORMAT || !doc.document) throw new QlmFormatError('This file is not a Qalam Urdu Studio document.');
    const project = doc.document;
    for (const el of allElements(project)) {
      if (el.type !== 'picture' || !el.imageSrc || el.imageSrc.startsWith('data:')) continue;
      const data = entries[el.imageSrc];
      if (!data) continue;
      const ext = el.imageSrc.split('.').pop()?.toLowerCase() ?? '';
      el.imageSrc = `data:${MIME_BY_EXTENSION[ext] ?? 'application/octet-stream'};base64,${bytesToBase64(data)}`;
    }
    return normalizeProject(project);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes).replace(/^﻿/, ''));
  } catch {
    throw new QlmFormatError('This file is not a Qalam Urdu Studio document.');
  }
  return normalizeProject(parsed);
}

/** Fills in anything an older or hand-edited document leaves out. */
export function normalizeProject(value: unknown): DocumentProject {
  const p = value as Partial<DocumentProject> | null;
  if (!p || typeof p !== 'object' || !Array.isArray(p.pages) || !p.pageSetup) {
    throw new QlmFormatError('This file is not a Qalam Urdu Studio document.');
  }
  const pages = p.pages.map((page, i) => ({
    ...page,
    id: page.id || `page-${i + 1}`,
    pageNumber: i + 1,
    elements: Array.isArray(page.elements) ? page.elements : [],
  }));
  if (!pages.length) pages.push({ id: 'page-1', pageNumber: 1, elements: [] });
  return {
    ...p,
    version: p.version ?? '1.0',
    title: p.title ?? 'Untitled',
    fileName: (p.fileName ?? 'Untitled.qlm').replace(/\.(qpg|json)$/i, '.qlm'),
    pageSetup: p.pageSetup,
    pages,
    masterElements: Array.isArray(p.masterElements) ? p.masterElements : [],
  } as DocumentProject;
}
