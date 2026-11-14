import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import type { DocumentProject, TextElement } from '../types/inpage.ts';
import { decodeDib } from './dibToPng.ts';
import { readObjects, readPageGeometry, readTextV1, readTextV3 } from './inpageFormat.ts';
import { mapInPageFont } from './inpageLayout.ts';
import { inPageBytesToProject, parseInPageFile } from './importInpage.ts';
import { encodeInPageText } from './inpageText.ts';
import { buildOle, inpageDocument, type TestStory } from './inpageTestFiles.ts';

const encode = (t: string) => encodeInPageText(t).bytes;
const texts = (project: DocumentProject, page: number) =>
  project.pages[page].elements.filter((e): e is TextElement => e.type === 'text');
const ptToMm = (pt: number) => (pt * 25.4) / 72;

// An A5 page with a heading frame and a story that runs on from page 1 to page 2.
const stories: TestStory[] = [
  { paragraphs: ['باب اول'], frames: [{ id: 5, page: 2, box: [60, 50, 300, 60], lines: 1 }], sizePt: 20, align: 2 },
  {
    paragraphs: ['پہلا پیراگراف', 'دوسرا پیراگراف', 'تیسرا پیراگراف', 'چوتھا پیراگراف'],
    frames: [
      { id: 6, page: 2, box: [60, 150, 300, 300], lines: 3 },
      { id: 6, page: 3, box: [60, 60, 300, 300], lines: 1 },
    ],
    sizePt: 12,
    align: 3,
  },
];
const page = { width: 420, height: 595, margin: 36, pages: 2 };

for (const version of [1, 3] as const) {
  const name = version === 3 ? 'InPage 2009 (InPage300)' : 'InPage 2000–2005 (InPage100)';
  const stream = inpageDocument(version, page, stories, encode);
  const file = buildOle(stream, new Uint8Array(200), version === 3 ? 'InPage300' : 'InPage100');

  test(`${name}: reads page size, layout records, text tables and saved layout`, () => {
    assert.deepEqual(readPageGeometry(stream), { widthPt: 420, heightPt: 595, leftPt: 36, topPt: 36, rightPt: 36, bottomPt: 36 });
    const text = (version === 3 ? readTextV3 : readTextV1)(stream)!;
    assert.ok(text);
    assert.equal(text.storyCount, 2);
    assert.deepEqual(text.fonts, ['Noori Nastaliq', 'Arial']);
    assert.equal(text.paragraphs.length, 5);
    assert.deepEqual(text.storyFrames!.map((g) => g.map((f) => `${f.id}:${f.page}`)), [['5:2'], ['6:2', '6:3']]);
    assert.equal(text.lines!.length, 5);
    const objects = readObjects(stream.subarray(0, text.tableStart));
    assert.deepEqual(objects.map((o) => `${o.kind}/${o.id}/${o.page}`), ['1/0/0', '1/0/1', '1/0/2', '3/5/2', '3/6/2', '1/0/3', '3/6/3']);
  });

  test(`${name}: rebuilds the pages with frames in place and the story split as InPage set it`, () => {
    const { project, layout, version: v, paragraphs } = inPageBytesToProject(file, 'kitab.inp');
    assert.equal(layout, true);
    assert.equal(v, version);
    assert.equal(paragraphs, 5);
    assert.equal(project.pageSetup.paperSize, 'Custom');
    assert.ok(Math.abs(project.pageSetup.widthMm - 148.17) < 0.1);
    assert.ok(Math.abs(project.pageSetup.margins.left - 12.7) < 0.05);
    assert.equal(project.pages.length, 2);

    const [heading, body] = texts(project, 0);
    assert.equal(heading.text, 'باب اول');
    assert.equal(heading.align, 'center');
    assert.equal(heading.fontFamily, 'Noto Nastaliq Urdu');
    assert.ok(heading.x <= ptToMm(66) && heading.x + heading.width >= ptToMm(354), 'heading spans its frame');
    assert.ok(heading.y < ptToMm(56) && heading.y > ptToMm(30));

    // Three lines fit on page 1, the fourth paragraph continues on page 2.
    assert.equal(body.text, 'پہلا پیراگراف\nدوسرا پیراگراف\nتیسرا پیراگراف');
    assert.equal(body.align, 'justify');
    assert.ok(Math.abs(body.fontSize * body.lineHeight - 24) < 0.01, 'keeps InPage line spacing');
    const [rest] = texts(project, 1);
    assert.equal(rest.text, 'چوتھا پیراگراف');
  });
}

test('a page-number marker becomes {{PAGE}}; table rows keep their cells side by side', () => {
  const table: TestStory[] = [
    { paragraphs: ['\u0002'], frames: [{ id: 5, page: 2, box: [190, 20, 40, 20], lines: 1 }], sizePt: 10, align: 2 },
    { paragraphs: ['ایک', 'دو', 'تین'], frames: [{ id: 6, page: 2, box: [60, 100, 300, 200], lines: 1 }], sizePt: 12, align: 1, table: true },
  ];
  const stream = inpageDocument(3, { ...page, pages: 1 }, table, encode);
  const { project } = inPageBytesToProject(buildOle(stream, new Uint8Array(200), 'InPage300'), 'x.inp');
  const [number, rows] = texts(project, 0);
  assert.equal(number.text, '{{PAGE}}');
  assert.equal(number.direction, 'rtl'); // so the number shows in Urdu digits
  assert.equal(rows.text, 'ایک\tدو\tتین');
});

test('InPage 2009 text also comes in on its own (text-only reading)', () => {
  const stream = inpageDocument(3, page, stories, encode);
  const { stories: read } = parseInPageFile(buildOle(stream, new Uint8Array(200), 'InPage300'));
  assert.deepEqual(read, [['باب اول'], ['پہلا پیراگراف', 'دوسرا پیراگراف', 'تیسرا پیراگراف', 'چوتھا پیراگراف']]);
});

test('maps InPage fonts to the bundled ones', () => {
  assert.equal(mapInPageFont('Noori Nastaliq', true), 'Noto Nastaliq Urdu');
  assert.equal(mapInPageFont('Faiz Nastaliq', true), 'Noto Nastaliq Urdu');
  assert.equal(mapInPageFont('Nafees Pakistani Naskh', true), 'Scheherazade New');
  assert.equal(mapInPageFont('Al Majeed Quranic Font', true), 'Amiri Quran');
  assert.equal(mapInPageFont('Times New Roman', false), 'Times New Roman');
  assert.equal(mapInPageFont('Arial', false), 'Arial');
});

test('decodes the bitmaps InPage keeps for pictures', () => {
  // 2×1, 24-bit, bottom-up, rows padded to 4 bytes: a red and a blue pixel.
  const dib = new Uint8Array(40 + 8);
  const dv = new DataView(dib.buffer);
  dv.setUint32(0, 40, true);
  dv.setInt32(4, 2, true);
  dv.setInt32(8, 1, true);
  dv.setUint16(12, 1, true);
  dv.setUint16(14, 24, true);
  dib.set([0, 0, 255, 255, 0, 0], 40);
  const img = decodeDib(dib)!;
  assert.deepEqual([img.width, img.height], [2, 1]);
  assert.deepEqual([...img.rgba], [255, 0, 0, 255, 0, 0, 255, 255]);
});

// Real documents stay on the developer's machine: INPAGE_SAMPLES=/path/to/folder npm test
const samples = process.env.INPAGE_SAMPLES;
test('opens every InPage document in $INPAGE_SAMPLES with its layout', { skip: !samples || !existsSync(samples) }, () => {
  for (const f of readdirSync(samples!).filter((n) => /\.(inp|b0\d)$/i.test(n))) {
    const r = inPageBytesToProject(new Uint8Array(readFileSync(join(samples!, f))), f);
    assert.ok(r.layout, `${f}: layout`);
    assert.ok(r.project.pages.length > 0 && r.paragraphs > 0, `${f}: content`);
  }
});
