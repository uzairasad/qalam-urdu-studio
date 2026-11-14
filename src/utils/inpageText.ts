/**
 * Classic InPage text encoding (InPage 1.x, 2.x, 2000, XP 2004 and 2005; the "InPage100"
 * stream of a .inp file, and the .txt files InPage's File → Export writes).
 *
 * Every Urdu/Arabic character is two bytes, 0x04 then a code below. English text and digits
 * are plain single ASCII bytes. Paragraphs end with 0x0D (0x0D 0x0A in exported .txt).
 *
 * The code table follows umer0586/unicode-inpage-converter (GPL-3.0, like this project), checked
 * against real InPage 2000–2005 documents and text exports, which also use آ أ إ ؤ as single
 * codes (0xC8, 0xC9, 0xCA, 0xB6), hamza-below (0x08) and the ornate brackets ﴿ ﴾ (0xDC, 0xDB).
 * Older files store composite letters as base letter + mark (ا + ٓ for آ…); `normalizeInPageText`
 * recombines them.
 */

export const INPAGE_TO_UNICODE: Readonly<Record<number, string>> = {
  0x08: '\u0655', // hamza below
  0x20: ' ',
  0x81: '\u0627', // alef
  0x82: '\u0628', // beh
  0x83: '\u067E', // peh
  0x84: '\u062A', // teh
  0x85: '\u0679', // tteh
  0x86: '\u062B', // theh
  0x87: '\u062C', // jeem
  0x88: '\u0686', // tcheh
  0x89: '\u062D', // hah
  0x8a: '\u062E', // khah
  0x8b: '\u062F', // dal
  0x8c: '\u0688', // ddal
  0x8d: '\u0630', // thal
  0x8e: '\u0631', // reh
  0x8f: '\u0691', // rreh
  0x90: '\u0632', // zain
  0x91: '\u0698', // jeh
  0x92: '\u0633', // seen
  0x93: '\u0634', // sheen
  0x94: '\u0635', // sad
  0x95: '\u0636', // dad
  0x96: '\u0637', // tah
  0x97: '\u0638', // zah
  0x98: '\u0639', // ain
  0x99: '\u063A', // ghain
  0x9a: '\u0641', // feh
  0x9b: '\u0642', // qaf
  0x9c: '\u06A9', // keheh (Urdu kaf)
  0x9d: '\u06AF', // gaf
  0x9e: '\u0644', // lam
  0x9f: '\u0645', // meem
  0xa0: '\u0646', // noon
  0xa1: '\u06BA', // noon ghunna
  0xa2: '\u0648', // waw
  0xa3: '\u0626', // yeh with hamza (also a lone hamza; see normalizeInPageText)
  0xa4: '\u06CC', // farsi yeh (choti ye)
  0xa5: '\u06D2', // yeh barree (bari ye; also medial ye)
  0xa6: '\u06C1', // heh goal
  0xa7: '\u06BE', // heh doachashmee
  0xa8: '\u064D', // kasratan
  0xa9: ' ',
  0xaa: '\u0650', // kasra (zer)
  0xab: '\u064E', // fatha (zabar)
  0xac: '\u064F', // damma (pesh)
  0xad: '\u0651', // shadda
  0xae: '\u0611', // alayhe assallam sign
  0xb0: '\u0656', // subscript alef
  0xb1: '\u0652', // sukun
  0xb3: '\u0653', // madda
  0xb4: '', // join control
  0xb5: '\u064C', // dammatan
  0xb6: '\u0624', // waw with hamza
  0xb8: '\u064A', // Arabic yeh
  0xb9: '\u06C3', // teh marbuta goal
  0xbd: '\u0670', // superscript alef
  0xbe: '\u0657', // inverted damma
  0xbf: '\u0654', // hamza above
  0xc7: '\u064B', // fathatan
  0xc8: '\u0622', // alef with madda
  0xc9: '\u0623', // alef with hamza above
  0xca: '\u0625', // alef with hamza below
  0xcf: '\u0614', // takhallus sign
  0xd0: '\u06F0',
  0xd1: '\u06F1',
  0xd2: '\u06F2',
  0xd3: '\u06F3',
  0xd4: '\u06F4',
  0xd5: '\u06F5',
  0xd6: '\u06F6',
  0xd7: '\u06F7',
  0xd8: '\u06F8',
  0xd9: '\u06F9',
  0xda: '!',
  0xdb: '\uFD3E', // ornate left parenthesis (closing, in right-to-left text)
  0xdc: '\uFD3F', // ornate right parenthesis (opening)
  0xe1: ')',
  0xe2: '(',
  0xe6: '\u0613', // radi allahu anhu sign
  0xe7: '\u0612', // rahmatullah alayhe sign
  0xe9: ':',
  0xea: '\u061B', // Arabic semicolon
  0xed: '\u060C', // Arabic comma
  0xee: '\u061F', // Arabic question mark
  0xf1: '/',
  0xf2: '\u060E', // poetic verse sign
  0xf3: '\u06D4', // full stop (khatma)
  0xf6: '\uFDFA', // sallallahou alayhe wasallam
  0xf7: '\u0601', // sanah sign
  0xf8: '\u0610', // sallallahou alayhe wassallam sign
  0xf9: ',',
  0xfa: '[',
  0xfb: ']',
  0xfc: '.',
  0xfd: '\u2018',
  0xfe: '\u2019',
};

const URDU_LETTER = '[\\u0621-\\u063A\\u0641-\\u064A\\u066E-\\u06D3\\u06FA-\\u06FF]';
const MARK = '[\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]';
/** Letters that don't join to the next letter. */
const NON_JOINING = '[\\u0621-\\u0625\\u0627\\u062F\\u0630\\u0631\\u0632\\u0648\\u0688\\u0691\\u0698\\u06D2\\u06D3]';

/**
 * An Urdu number as InPage stored it: digits, maybe with separators between them (۳٫۰,
 * ۱۴/۸/۱۹۴۷). InPage kept the whole thing in reverse (visual) order.
 */
const URDU_NUMBER = /[\u06F0-\u06F9\u0660-\u0669]+(?:[\u060C\u066B\u066C.,/:-][\u06F0-\u06F9\u0660-\u0669]+)*/g;
const reverseNumber = (n: string) => (n.length > 1 ? [...n].reverse().join('') : n);

export interface DecodedRun {
  text: string;
  /** Characters whose InPage code isn't known (left out of `text`). */
  unreadable: number;
}

/** Decodes InPage-encoded bytes (no paragraph structure) into raw Unicode. */
export function decodeInPageBytes(bytes: Uint8Array): DecodedRun {
  let text = '';
  let unreadable = 0;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 0x04 && i + 1 < bytes.length) {
      const ch = INPAGE_TO_UNICODE[bytes[i + 1]];
      if (ch === undefined) unreadable++;
      else text += ch;
      i++;
    } else if (b === 0x0d) {
      text += '\n';
      if (bytes[i + 1] === 0x0a) i++;
    } else if (b === 0x09) {
      text += '\t';
    } else if (b >= 0x20 && b < 0x7f) {
      text += String.fromCharCode(b);
    } else if (b !== 0x0a) {
      unreadable++;
    }
  }
  return { text, unreadable };
}

/**
 * Turns InPage's storage conventions into normal Unicode Urdu (the corrections the classic
 * InPage-to-Unicode converters apply):
 * - letter + hamza/madda marks become the composed letters (آ أ إ ؤ ئ ۂ ۓ);
 * - a vowel mark typed after a space is joined back to its letter;
 * - two zabars become tanween;
 * - ے in the middle of a word is a medial ی (InPage used one code for both shapes);
 * - InPage's one hamza code is ئ when joined and ء when standing alone;
 * - Urdu numbers, which InPage stored in reverse order, are put back the right way round.
 */
export function normalizeInPageText(raw: string): string {
  let t = raw;
  t = t.replace(/ +(?=[\u064B-\u065F\u0670])/g, '');
  t = t.replace(/\u064E\u064E/g, '\u064B');
  t = t
    .replace(/\u0627\u0653/g, '\u0622')
    .replace(/\u0627\u0654/g, '\u0623')
    .replace(/\u0627\u0655/g, '\u0625')
    .replace(/\u0648\u0654/g, '\u0624')
    .replace(/\u06CC\u0654/g, '\u0626')
    .replace(/\u06C1\u0654/g, '\u06C2')
    .replace(/\u06D2\u0654/g, '\u06D3');
  t = t.replace(new RegExp(`\\u06D2(?=${MARK}*${URDU_LETTER})`, 'g'), '\u06CC');
  t = t.replace(
    new RegExp(`(^|[^\\u0600-\\u06FF]|[\\u06F0-\\u06F9]|${NON_JOINING}${MARK}*)\\u0626(?!${MARK}*${URDU_LETTER})`, 'g'),
    '$1\u0621'
  );
  t = t.replace(URDU_NUMBER, reverseNumber);
  return t;
}

/** Tidies one paragraph for layout: alignment spaces and padding go, tabs stay. */
export function tidyParagraph(p: string): string {
  return p.replace(/ {2,}/g, ' ').replace(/^[ \t]+|[ \t]+$/g, '');
}

/** InPage codes for Unicode characters, as InPage 2000–2005 itself writes them. */
const UNICODE_TO_INPAGE: ReadonlyMap<string, number> = (() => {
  const m = new Map<string, number>();
  for (const [code, ch] of Object.entries(INPAGE_TO_UNICODE)) {
    const c = Number(code);
    if (ch.length === 1 && ch.charCodeAt(0) > 0x7f && !m.has(ch)) m.set(ch, c);
  }
  m.set('\u0621', 0xa3); // ء shares the ئ code
  return m;
})();

/** ASCII punctuation that InPage writes with its Urdu codes inside Urdu text. */
const URDU_PUNCTUATION: Readonly<Record<string, number>> = {
  '!': 0xda,
  ')': 0xe1,
  '(': 0xe2,
  ':': 0xe9,
  '/': 0xf1,
  ',': 0xf9,
  '[': 0xfa,
  ']': 0xfb,
  '.': 0xfc,
};

/** Spellings with no InPage code of their own, rewritten to ones that have one. */
const SUBSTITUTES: Readonly<Record<string, string>> = {
  '\u06C2': '\u06C1\u0654', // ۂ → ہ + hamza
  '\u06D3': '\u06D2\u0654', // ۓ → ے + hamza
  '\u0643': '\u06A9', // Arabic kaf → keheh
  '\u0647': '\u06C1', // Arabic heh → heh goal
  '\u0649': '\u06CC', // alef maksura → farsi yeh
  '\u06D5': '\u06C1',
  '\u0660': '\u06F0', '\u0661': '\u06F1', '\u0662': '\u06F2', '\u0663': '\u06F3', '\u0664': '\u06F4',
  '\u0665': '\u06F5', '\u0666': '\u06F6', '\u0667': '\u06F7', '\u0668': '\u06F8', '\u0669': '\u06F9',
};

/**
 * Unicode → classic InPage bytes, for text that old InPage versions can import (File → Import,
 * like the .txt files its own File → Export writes). Follows InPage's conventions: Urdu numbers
 * reversed, spaces and punctuation next to Urdu
 * written as Urdu, English left as plain ASCII. Lines end in CR LF.
 */
export function encodeInPageText(text: string): { bytes: Uint8Array; unmappable: number } {
  const prepared = [
    ...text
      .replace(/\r\n?/g, '\n')
      .replace(/[\u06C2\u06D3\u0643\u0647\u0649\u06D5\u0660-\u0669]/g, (c) => SUBSTITUTES[c] ?? c)
      .replace(URDU_NUMBER, reverseNumber)
  ];
  const isUrdu = (ch: string | undefined) => ch !== undefined && UNICODE_TO_INPAGE.has(ch);
  /** The nearest character on each side that isn't a space or ASCII punctuation. */
  const neighbourIsUrdu = (i: number) => {
    for (let j = i - 1; j >= 0 && prepared[j] !== '\n'; j--) {
      if (prepared[j] === ' ' || prepared[j] in URDU_PUNCTUATION) continue;
      if (isUrdu(prepared[j])) return true;
      break;
    }
    for (let j = i + 1; j < prepared.length && prepared[j] !== '\n'; j++) {
      if (prepared[j] === ' ' || prepared[j] in URDU_PUNCTUATION) continue;
      return isUrdu(prepared[j]);
    }
    return false;
  };

  const out: number[] = [];
  let unmappable = 0;
  prepared.forEach((ch, i) => {
    if (ch === '\n') out.push(0x0d, 0x0a);
    else if (ch === '\t') out.push(0x09);
    else if (ch === ' ') out.push(...(neighbourIsUrdu(i) ? [0x04, 0x20] : [0x20]));
    else if (UNICODE_TO_INPAGE.has(ch)) out.push(0x04, UNICODE_TO_INPAGE.get(ch)!);
    else if (ch in URDU_PUNCTUATION && neighbourIsUrdu(i)) out.push(0x04, URDU_PUNCTUATION[ch]);
    else {
      const code = ch.codePointAt(0)!;
      if (code >= 0x20 && code < 0x7f) out.push(code);
      else unmappable++;
    }
  });
  return { bytes: new Uint8Array(out), unmappable };
}
