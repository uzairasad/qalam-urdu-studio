import assert from 'node:assert/strict';
import { test } from 'node:test';
import { strFromU8, unzipSync } from 'fflate';
import type { DocumentProject, PictureElement } from '../types/inpage.ts';
import { decodeQlm, encodeQlm, QLM_MIME, QLM_VERSION } from './qlmFormat.ts';
import { blankProject } from './templates.ts';

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function withPictures(): DocumentProject {
  const p = blankProject();
  const pic = (id: string): PictureElement => ({ id, type: 'picture', x: 10, y: 10, width: 50, height: 40, imageSrc: PNG, shape: 'rect', objectFit: 'contain' });
  p.pages[0].elements.push(pic('a'), pic('b'));
  p.masterElements.push(pic('m'));
  p.pages[0].elements.push({ id: 't', type: 'text', x: 0, y: 0, width: 50, height: 20, text: 'اردو متن', fontFamily: 'Noto Nastaliq Urdu', fontSize: 14, lineHeight: 1.9, letterSpacing: 0, color: '#000', bold: false, italic: false, underline: false, align: 'right', direction: 'rtl' });
  return p;
}

test('.qlm is a ZIP package: mimetype first, document.json, pictures as files', () => {
  const bytes = encodeQlm(withPictures(), 'test');
  assert.deepEqual([...bytes.subarray(0, 4)], [0x50, 0x4b, 3, 4]);
  // The mimetype entry is first and stored uncompressed, readable at a fixed offset.
  assert.equal(strFromU8(bytes.subarray(38, 38 + QLM_MIME.length)), QLM_MIME);
  const files = unzipSync(bytes);
  assert.deepEqual(Object.keys(files).sort(), ['document.json', 'media/image1.png', 'mimetype']);
  const doc = JSON.parse(strFromU8(files['document.json']));
  assert.equal(doc.version, QLM_VERSION);
  assert.equal(doc.document.pages[0].elements[0].imageSrc, 'media/image1.png'); // stored once, shared
  assert.ok(!strFromU8(files['document.json']).includes('base64'));
});

test('.qlm round-trips the document, pictures included', () => {
  const original = withPictures();
  const back = decodeQlm(encodeQlm(original));
  assert.deepEqual(back, original);
});

test('opens version 1 (plain JSON) documents and legacy .qpg names', () => {
  const legacy = { ...withPictures(), fileName: 'old.qpg' };
  const back = decodeQlm(new TextEncoder().encode(JSON.stringify(legacy, null, 2)));
  assert.equal(back.fileName, 'old.qlm');
  assert.equal((back.pages[0].elements[0] as PictureElement).imageSrc, PNG);
  // Missing pieces are filled in.
  const minimal = { pageSetup: blankProject().pageSetup, pages: [{ elements: [] }] };
  const filled = decodeQlm(new TextEncoder().encode(JSON.stringify(minimal)));
  assert.deepEqual(filled.masterElements, []);
  assert.equal(filled.pages[0].id, 'page-1');
});

test('rejects files that are not Qalam documents', () => {
  assert.throws(() => decodeQlm(new TextEncoder().encode('hello')), /not a Qalam Urdu Studio document/);
  assert.throws(() => decodeQlm(new TextEncoder().encode('{"pages": 3}')), /not a Qalam Urdu Studio document/);
});
