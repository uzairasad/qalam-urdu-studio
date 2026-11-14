/**
 * Opens InPage documents: .inp files from InPage 1.x, 2.x, 2000, XP 2004, 2005 ("InPage100"
 * stream, InPage's own 8-bit text encoding) and InPage 2009 and later ("InPage300", Unicode
 * text), the .B01 backups InPage keeps next to them, and .txt files exported from InPage.
 *
 * The pages are rebuilt as InPage laid them out (inpageLayout.ts, on the structures read by
 * inpageFormat.ts): page size and margins, every text frame in its place with the text InPage
 * set in it, columns, rotation, lines, boxes and pictures. When a file's layout can't be read,
 * its text still comes in, laid out on pages of the document's own size.
 */
import type { DocumentProject } from '../types/inpage.ts';
import { readPageGeometry, readTextV1, readTextV3, type InPageText } from './inpageFormat.ts';
import { buildLayout, decodeRange, pageSetupFromGeometry } from './inpageLayout.ts';
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

/** The document stream of a .inp/.B01 file, and which InPage generation wrote it. */
function documentStream(ole: OleFile): { stream: Uint8Array; version: 1 | 3 } {
  const v3 = ole.stream('InPage300');
  if (v3) return { stream: v3, version: 3 };
  const v1 = ole.stream('InPage100') ?? ole.stream('InPage200');
  if (v1) return { stream: v1, version: 1 };
  if (ole.streamNames().some((n) => /^inpage/i.test(n))) {
    throw new InPageFormatError('This InPage document uses a format Qalam Urdu Studio cannot read yet.');
  }
  throw new InPageFormatError('This file is not an InPage document (it may be an old Word or Excel file).');
}

/** Stories of decoded text (each a list of paragraphs). */
function storiesFromText(text: InPageText): InPageParseResult {
  const stories: string[][] = [];
  let unreadable = 0;
  const ranges: [number, number][] = [];
  for (const p of text.paragraphs) {
    const r = ranges[p.story];
    if (!r) ranges[p.story] = [p.position, p.position + p.length];
    else r[1] = p.position + p.length;
  }
  for (const r of ranges) {
    if (!r) continue;
    const d = decodeRange(text, r[0], r[1]);
    unreadable += d.unreadable;
    const paras = d.text.replace(/\{\{PAGE\}\}/g, '').split('\n');
    if (paras.some((x) => x.trim())) stories.push(paras);
  }
  return { stories, unreadable };
}

/** Text from a .inp/.B01 file's bytes. */
export function parseInPageFile(bytes: Uint8Array): InPageParseResult {
  if (!isOleFile(bytes)) throw new InPageFormatError('This is not an InPage document.');
  const { stream, version } = documentStream(new OleFile(bytes));
  const text = version === 3 ? readTextV3(stream) : readTextV1(stream);
  if (text) return storiesFromText(text);
  if (version === 1) return parseInPage100(stream);
  throw new InPageFormatError('No text was found in this InPage document.');
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
  /** True when the pages were rebuilt as InPage laid them out (not just the text). */
  layout: boolean;
  /** Which InPage generation wrote the file: 1 (InPage 1.x–2005) or 3 (2009 and later). */
  version?: 1 | 3;
}

const titleOf = (fileName: string) => fileName.replace(/\.(inp|b0\d|txt)$/i, '') || 'InPage_Document';

/** Builds a Qalam document from an InPage file (.inp, .B01, or InPage-exported .txt). */
export function inPageBytesToProject(bytes: Uint8Array, fileName: string): InPageImport {
  const title = titleOf(fileName);
  if (isOleFile(bytes)) {
    const ole = new OleFile(bytes);
    const { stream, version } = documentStream(ole);
    const text = version === 3 ? readTextV3(stream) : readTextV1(stream);
    if (text) {
      const pictures = (name: string) => ole.stream(name);
      const built = buildLayout(stream, text, title, pictures);
      if (built && built.frames > 0) {
        return { project: built.project, unreadable: built.unreadable, paragraphs: built.paragraphs, layout: true, version };
      }
    }
    const parsed = text ? storiesFromText(text) : version === 1 ? parseInPage100(stream) : null;
    if (!parsed) throw new InPageFormatError('No text was found in this InPage document.');
    return { ...textOnly(parsed, title, stream), version };
  }
  return textOnly(parseInPageText(bytes), title, null);
}

function textOnly(parsed: InPageParseResult, title: string, stream: Uint8Array | null): InPageImport {
  const body = storiesToText(parsed.stories);
  if (!body) throw new InPageFormatError('No text was found in this InPage document.');
  const project = layoutTextAsProject(body, title, 'inp');
  const geometry = stream ? readPageGeometry(stream) : null;
  if (geometry) {
    const setup = pageSetupFromGeometry(geometry);
    const dx = setup.margins.left - project.pageSetup.margins.left;
    const dy = setup.margins.top - project.pageSetup.margins.top;
    const contentWidth = setup.widthMm - setup.margins.left - setup.margins.right;
    for (const page of project.pages) {
      for (const el of page.elements) {
        el.x += dx;
        el.y += dy;
        el.width = contentWidth;
      }
    }
    project.pageSetup = { ...setup, direction: project.pageSetup.direction };
  }
  return {
    project,
    unreadable: parsed.unreadable,
    paragraphs: parsed.stories.reduce((n, s) => n + s.filter((p) => p.trim()).length, 0),
    layout: false,
  };
}
