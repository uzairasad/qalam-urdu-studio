import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clearRunStyle, editRuns, mergeRuns, runsOf } from './richText.ts';

const runs = [{ text: 'اردو ' }, { text: 'بولڈ', bold: true }, { text: ' متن' }];
const text = 'اردو بولڈ متن';

test('runs follow edits: typing inside, before and after a formatted word', () => {
  assert.deepEqual(editRuns(runs, text, 'اردو بولڈا متن'), [{ text: 'اردو ' }, { text: 'بولڈا', bold: true }, { text: ' متن' }]);
  assert.deepEqual(editRuns(runs, text, 'نیا اردو بولڈ متن'), [{ text: 'نیا اردو ' }, { text: 'بولڈ', bold: true }, { text: ' متن' }]);
  assert.deepEqual(editRuns(runs, text, text + '۔'), [{ text: 'اردو ' }, { text: 'بولڈ', bold: true }, { text: ' متن۔' }]);
  // Deleting the formatted word leaves plain text: no runs needed.
  assert.equal(editRuns(runs, text, 'اردو  متن'), undefined);
});

test('frame-wide settings clear run overrides; runs merge and must match the text', () => {
  assert.equal(clearRunStyle(runs, ['bold']), undefined);
  assert.deepEqual(mergeRuns([{ text: 'a' }, { text: 'b' }, { text: '', bold: true }]), [{ text: 'ab' }]);
  assert.deepEqual(runsOf({ text: 'other', runs }), [{ text: 'other' }]);
  assert.equal(runsOf({ text, runs }), runs);
});
