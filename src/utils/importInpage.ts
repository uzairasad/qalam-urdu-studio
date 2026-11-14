/**
 * Opens documents made by classic InPage (1.x, 2.x, 2000, XP 2004, 2005): .inp files and the
 * .B01 backups InPage keeps next to them, plus .txt files exported from InPage.
 *
 * A .inp file is an OLE compound file; the document is in its "InPage100" stream. Inside it,
 * each paragraph is stored as a 32-bit length followed by that many bytes of InPage-encoded
 * text ending in 0x0D, and consecutive paragraphs of one story (text frame) follow each other
 * directly or after 5 bytes of paragraph attributes. Page layout, frames and styles are not
 * decoded yet: the text comes in, in order, and is laid out on A4 pages.
 */
import type { DocumentProject } from '../types/inpage.ts';
import { decodeInPageBytes, normalizeInPageText, tidyParagraph } from './inpageText.ts';
import { isOleFile, OleFile } from './ole.ts';
import { layoutTextAsProject } from './textLayout.ts';

export interface InPageParseResult {
  /** Stories (runs of consecutive paragraphs), each a list of paragraphs. */
  stories: string[][];
  /** Characters whose InPage code is unknown and were left out. */
  unreadable: number;
}

export class InPageFormatError extends Error {}

/** Does this paragraph record hold only text bytes (InPage pairs, ASCII, tabs) before its 0x0D? */
function isTextRecord(bytes: Uint8Array, start: number, length: number): boolean {
  const end = start + length - 1; // the 0x0D
  for (let i = start; i < end; i++) {
    const b = bytes[i];
    if (b === 0x04) {
      if (i + 1 >= end) return false;
      i++;
    } else if (!((b >= 0x20 && b < 0x7f) || b === 0x09)) {
      return false;
    }
  }
  return true;
}

/** Text from an "InPage100" stream. */
export function parseInPage100(stream: Uint8Array): InPageParseResult {
  const view = new DataView(stream.buffer, stream.byteOffset, stream.byteLength);
  const stories: string[][] = [];
  let story: string[] = [];
  let unreadable = 0;
  let prevEnd = -1;

  for (let p = 0; p + 4 < stream.length; ) {
    const length = view.getUint32(p, true);
    const start = p + 4;
    if (
      length >= 1 &&
      length <= 1_000_000 &&
      start + length <= stream.length &&
      stream[start + length - 1] === 0x0d &&
      isTextRecord(stream, start, length)
    ) {
      // A gap other than 0 or 5 bytes means a new story (another text frame).
      if (prevEnd >= 0 && p - prevEnd !== 0 && p - prevEnd !== 5) {
        if (story.length) stories.push(story);
        story = [];
      }
      const decoded = decodeInPageBytes(stream.subarray(start, start + length - 1));
      unreadable += decoded.unreadable;
      story.push(tidyParagraph(normalizeInPageText(decoded.text)));
      prevEnd = start + length;
      p = prevEnd;
    } else {
      p++;
    }
  }
  if (story.length) stories.push(story);

  // Drop stories with no text at all (empty frames).
  return { stories: stories.filter((s) => s.some((para) => para.trim())), unreadable };
}

/** Text from a .inp/.B01 file's bytes. */
export function parseInPageFile(bytes: Uint8Array): InPageParseResult {
  if (!isOleFile(bytes)) throw new InPageFormatError('This is not an InPage document.');
  const ole = new OleFile(bytes);
  const stream = ole.stream('InPage100');
  if (stream) return parseInPage100(stream);
  if (ole.streamNames().some((n) => /^inpage/i.test(n))) {
    throw new InPageFormatError(
      'This document was saved by a newer InPage version (2009 or later) whose format Qalam Urdu Studio cannot read yet. ' +
        'In that InPage, save it as InPage 2000–2005 or export it as Unicode text.'
    );
  }
  throw new InPageFormatError('This file is not an InPage document (it may be an old Word or Excel file).');
}

/** True when a .txt file looks like InPage's own text export (0x04-prefixed Urdu codes). */
export function looksLikeInPageText(bytes: Uint8Array): boolean {
  let pairs = 0;
  const n = Math.min(bytes.length - 1, 4000);
  for (let i = 0; i < n; i++) {
    if (bytes[i] === 0x04 && bytes[i + 1] >= 0x81) {
      pairs++;
      i++;
    }
  }
  return pairs >= 4 && pairs * 2 >= n * 0.3;
}

/** Text from InPage's exported .txt (paragraphs on CR LF lines). */
export function parseInPageText(bytes: Uint8Array): InPageParseResult {
  const { text, unreadable } = decodeInPageBytes(bytes);
  const paragraphs = normalizeInPageText(text).split('\n').map(tidyParagraph);
  return { stories: [paragraphs], unreadable };
}

/**
 * Paragraphs become lines; blank paragraphs and story boundaries become blank lines, which
 * the layout treats as paragraph breaks.
 */
export function storiesToText(stories: string[][]): string {
  return stories
    .map((s) => s.join('\n').replace(/\n{3,}/g, '\n\n').trim())
    .filter(Boolean)
    .join('\n\n');
}

export interface InPageImport {
  project: DocumentProject;
  unreadable: number;
  paragraphs: number;
}

/** Builds a Qalam document from an InPage file (.inp, .B01, or InPage-exported .txt). */
export function inPageBytesToProject(bytes: Uint8Array, fileName: string): InPageImport {
  const parsed = isOleFile(bytes) ? parseInPageFile(bytes) : parseInPageText(bytes);
  const text = storiesToText(parsed.stories);
  if (!text) throw new InPageFormatError('No text was found in this InPage document.');
  const title = fileName.replace(/\.(inp|b0\d|txt)$/i, '') || 'InPage_Document';
  return {
    project: layoutTextAsProject(text, title, 'inp'),
    unreadable: parsed.unreadable,
    paragraphs: parsed.stories.reduce((n, s) => n + s.filter((p) => p.trim()).length, 0),
  };
}
