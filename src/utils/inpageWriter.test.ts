import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { DocumentProject, TextElement } from '../types/inpage.ts';
import { inPageBytesToProject } from './importInpage.ts';
import { readTextV1 } from './inpageFormat.ts';
import { writeInPage } from './inpageWriter.ts';
import { isOleFile, OleFile } from './ole.ts';
import { blankProject } from './templates.ts';

const frame = (id: string, y: number, text: string, extra: Partial<TextElement> = {}): TextElement => ({
  id, type: 'text', x: 15, y, width: 180, height: 40, text, fontFamily: 'Noto Nastaliq Urdu', fontSize: 16,
  lineHeight: 1.9, letterSpacing: 0, color: '#000000', bold: false, italic: false, underline: false,
  align: 'right', direction: 'rtl', ...extra,
});

function document(): DocumentProject {
  const p = blankProject();
  p.pageSetup = { ...p.pageSetup, paperSize: 'Letter', widthMm: 215.9, heightMm: 279.4, margins: { top: 20, bottom: 20, left: 15, right: 15 } };
  p.pages[0].elements.push(
    frame('a', 20, 'پہلا پیراگراف\nدوسرا پیراگراف', { runs: [{ text: 'پہلا ' }, { text: 'پیراگراف', bold: true }, { text: '\nدوسرا پیراگراف' }] }),
    frame('b', 80, 'صفحہ {{PAGE}}')
  );
  p.pages.push({ id: 'page-2', pageNumber: 2, elements: [frame('c', 20, 'دوسرے صفحے کا متن')] });
  return p;
}

test('saves an InPage 2000–2005 file that reads back: pages, page size, text, formatting', () => {
  const { bytes, unmappable, pages } = writeInPage(document());
  assert.equal(unmappable, 0);
  assert.equal(pages, 2);
  assert.ok(isOleFile(bytes));
  const ole = new OleFile(bytes);
  assert.deepEqual(ole.streamNames().sort(), ['DocumentInfo', 'InPage100']);
  const stream = ole.stream('InPage100')!;

  const text = readTextV1(stream)!;
  assert.ok(text, 'text table, style runs and saved layout read back');
  assert.equal(text.storyCount, 2);
  assert.ok(text.lines, 'saved lines cover the text');
  assert.deepEqual(text.storyFrames!.map((g) => g.map((f) => `${f.id}:${f.page}`)), [['5:1'], ['5:2', '5:3']]);

  const { project, layout } = inPageBytesToProject(bytes, 'saved.inp');
  assert.equal(layout, true);
  assert.equal(project.pages.length, 2);
  assert.equal(project.pageSetup.paperSize, 'Letter');
  assert.ok(Math.abs(project.pageSetup.margins.top - 20) < 0.05);
  const all = project.pages.map((pg) => pg.elements.filter((e): e is TextElement => e.type === 'text').map((e) => e.text).join('\n'));
  assert.equal(all[0], 'پہلا پیراگراف\nدوسرا پیراگراف\nصفحہ {{PAGE}}');
  assert.equal(all[1], 'دوسرے صفحے کا متن');
  const first = project.pages[0].elements.find((e): e is TextElement => e.type === 'text' && e.text.startsWith('پہلا'))!;
  // Effective weight of each word (run setting, else the frame's): only پیراگراف is bold.
  const bold = (word: string) => {
    const r = first.runs?.find((run) => run.text.includes(word));
    return r?.bold ?? first.bold;
  };
  assert.equal(bold('پیراگراف'), true);
  assert.equal(bold('پہلا'), false);
});
