import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inPageBytesToProject, looksLikeInPageText, parseInPage100, parseInPageFile } from './importInpage.ts';
import { decodeInPageBytes, encodeInPageText, normalizeInPageText } from './inpageText.ts';
import { isOleFile, OleFile } from './ole.ts';
import { buildOle } from './inpageTestFiles.ts';

// --- Synthetic InPage data (made for these tests; no real documents in the repository) -------

/** Unicode → InPage bytes, through the exporter (itself tested below against hand-made bytes). */
const ip = (text: string) => encodeInPageText(text).bytes;

const u32 = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff];

/** One paragraph record: [u32 length][text][0x0D], then `attrs` bytes of paragraph attributes. */
function para(text: Uint8Array, attrs = 5): number[] {
  return [...u32(text.length + 1), ...text, 0x0d, ...new Array(attrs).fill(0)];
}

/** An "InPage100" stream: some header bytes, then stories separated by non-text data. */
function inpage100(stories: string[][]): Uint8Array {
  const out: number[] = [0x00, 0x00, 0x02, 0x00, 0x01, 0x00, 0xff, 0xfe, 0x80, 0x00]; // binary noise
  for (const story of stories) {
    for (const p of story) out.push(...para(ip(p)));
    out.push(0xff, 0x7f, 0x00, 0x13, 0x88, 0x01, 0x02, 0x03, 0x99, 0xab, 0xcd); // frame data between stories
  }
  return new Uint8Array(out);
}

// --- Tests ------------------------------------------------------------------------------------

test('decodes InPage character codes (bytes as InPage itself writes them)', () => {
  // اسلامی written as InPage 2000 stores it, plus an English word and a CR LF line break.
  const bytes = new Uint8Array([
    0x04, 0x81, 0x04, 0x92, 0x04, 0x9e, 0x04, 0x81, 0x04, 0x9f, 0x04, 0xa4, 0x04, 0x20,
    0x49, 0x6e, 0x50, 0x61, 0x67, 0x65, 0x0d, 0x0a, 0x04, 0xd1,
  ]);
  const { text, unreadable } = decodeInPageBytes(bytes);
  assert.equal(text, 'اسلامی InPage\n۱');
  assert.equal(unreadable, 0);
  assert.equal(decodeInPageBytes(new Uint8Array([0x04, 0x7c, 0x04, 0x81])).unreadable, 1);
});

test('normalises InPage storage conventions to standard Unicode Urdu', () => {
  assert.equal(normalizeInPageText('\u0627\u0653\u067E'), 'آپ'); // alif + madda
  assert.equal(normalizeInPageText('\u0648\u0654'), 'ؤ');
  assert.equal(normalizeInPageText('\u06C1\u0654'), 'ۂ');
  assert.equal(normalizeInPageText('\u0627\u0655\u0646\u06CC'), 'إنی');
  assert.equal(normalizeInPageText('\u0639\u0638\u06D2\u0645'), 'عظیم'); // medial bari ye
  assert.equal(normalizeInPageText('\u06A9\u06D2 \u0644\u06CC\u06D2'), 'کے لیے'); // final stays
  assert.equal(normalizeInPageText('\u06F2\u06F1 \u06F0\u06F2 \u06F7'), '۱۲ ۲۰ ۷'); // numbers stored reversed
  assert.equal(normalizeInPageText('\u06F0\u060C\u06F3 \u06F7\u06F4\u06F9\u06F1/\u06F8/\u06F4\u06F1'), '۳،۰ ۱۴/۸/۱۹۴۷'); // with separators
  assert.equal(normalizeInPageText('\u0644 \u0650'), 'لِ'); // vowel mark after a space
  assert.equal(normalizeInPageText('\u0628\u064E\u064E'), 'بً'); // two zabars → tanween
});

test('export and import round-trip Urdu, Arabic marks, numbers and English', () => {
  const text = 'آپ کیسے ہیں؟ پایۂ تکمیل\nسال ۱۹۴۷ء — Lahore 1947\nمؤمن إنّی';
  const { bytes, unmappable } = encodeInPageText(text);
  assert.equal(unmappable, 1); // the em dash has no InPage code
  assert.equal(normalizeInPageText(decodeInPageBytes(bytes).text), text.replace('—', ''));
});

test('a lone hamza reads as ء, a joined one as ئ', () => {
  assert.equal(normalizeInPageText('\u062B\u0646\u0627\u0626 \u0645\u062D\u0645\u062F'), 'ثناء محمد');
  assert.equal(normalizeInPageText('\u0637\u0627\u0626\u0648\u0633'), 'طائوس');
  assert.equal(normalizeInPageText('\u06AF\u0626\u06CC'), 'گئی');
});

test('finds paragraphs and stories in an InPage100 stream', () => {
  const stream = inpage100([
    ['اسلامی دنیا کا عظیم شاعر', 'علامہ اقبال'],
    ['Price: 500 per month', '', 'ختم شد'],
  ]);
  const { stories, unreadable } = parseInPage100(stream);
  assert.equal(unreadable, 0);
  assert.deepEqual(stories, [
    ['اسلامی دنیا کا عظیم شاعر', 'علامہ اقبال'],
    ['Price: 500 per month', '', 'ختم شد'],
  ]);
});

test('paragraphs that follow each other with no attribute bytes stay in one story', () => {
  const out = [...para(ip('پہلی سطر'), 0), ...para(ip('دوسری سطر'), 5), ...para(ip('تیسری'), 0)];
  assert.deepEqual(parseInPage100(new Uint8Array(out)).stories, [['پہلی سطر', 'دوسری سطر', 'تیسری']]);
});

test('reads a whole .inp compound file, from regular and mini streams', () => {
  const stream = inpage100([['قاری محمد فصیح الدین', '۱۔ مجھ میں ان کی ثنا کا']]);
  const info = new Uint8Array(300).map((_, i) => i & 0xff);
  const file = buildOle(stream, info);
  assert.ok(isOleFile(file));
  const ole = new OleFile(file);
  assert.deepEqual(ole.streamNames().sort(), ['DocumentInfo', 'InPage100']);
  assert.deepEqual(ole.stream('documentinfo'), info);
  assert.deepEqual(ole.stream('InPage100')!.subarray(0, stream.length), stream);
  assert.deepEqual(parseInPageFile(file).stories, [['قاری محمد فصیح الدین', '۱۔ مجھ میں ان کی ثنا کا']]);

  const { project, paragraphs, unreadable } = inPageBytesToProject(file, 'naat.inp');
  assert.equal(paragraphs, 2);
  assert.equal(unreadable, 0);
  assert.equal(project.fileName, 'naat.qlm');
  assert.equal(project.pageSetup.direction, 'rtl');
  const texts = project.pages.flatMap((p) => p.elements.map((e) => ('text' in e ? e.text : '')));
  assert.ok(texts.join('\n').includes('قاری محمد فصیح الدین'));
});

test('recognises InPage-exported text files but not ordinary text', () => {
  assert.ok(looksLikeInPageText(ip('یہ اِن پیج سے نکالی گئی تحریر ہے')));
  assert.ok(!looksLikeInPageText(new TextEncoder().encode('Plain English text, nothing special here.')));
  assert.ok(!looksLikeInPageText(new TextEncoder().encode('یونیکوڈ اردو متن')));
});

test('rejects files that are not InPage documents', () => {
  assert.throws(() => parseInPageFile(new TextEncoder().encode('{"pages": []}')), /not an InPage document/);
});

test('decodes Sindhi (05 prefix) and InPage’s Arabic set (07 prefix)', () => {
  // سنڌي: س ن ڌ ي in the Sindhi set; then سڏائڻ, whose hamza code becomes ئ inside the word.
  const sindhi = new Uint8Array([0x05, 0x9b, 0x05, 0xb0, 0x05, 0x93, 0x05, 0xad, 0x05, 0x20,
    0x05, 0x9b, 0x05, 0x94, 0x05, 0x81, 0x05, 0xab, 0x05, 0xb1]);
  const decoded = decodeInPageBytes(sindhi);
  assert.equal(decoded.unreadable, 0);
  assert.equal(normalizeInPageText(decoded.text), 'سنڌي سڏائڻ');
  // 07 uses the Urdu codes: عربی
  assert.equal(decodeInPageBytes(new Uint8Array([0x07, 0x98, 0x07, 0x8e, 0x07, 0x82, 0x07, 0xa4])).text, 'عربی');
});
