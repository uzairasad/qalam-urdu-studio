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
  0x08: 'ٕ', // hamza below
  0x20: ' ',
  0x81: 'ا', // alef
  0x82: 'ب', // beh
  0x83: 'پ', // peh
  0x84: 'ت', // teh
  0x85: 'ٹ', // tteh
  0x86: 'ث', // theh
  0x87: 'ج', // jeem
  0x88: 'چ', // tcheh
  0x89: 'ح', // hah
  0x8a: 'خ', // khah
  0x8b: 'د', // dal
  0x8c: 'ڈ', // ddal
  0x8d: 'ذ', // thal
  0x8e: 'ر', // reh
  0x8f: 'ڑ', // rreh
  0x90: 'ز', // zain
  0x91: 'ژ', // jeh
  0x92: 'س', // seen
  0x93: 'ش', // sheen
  0x94: 'ص', // sad
  0x95: 'ض', // dad
  0x96: 'ط', // tah
  0x97: 'ظ', // zah
  0x98: 'ع', // ain
  0x99: 'غ', // ghain
  0x9a: 'ف', // feh
  0x9b: 'ق', // qaf
  0x9c: 'ک', // keheh (Urdu kaf)
  0x9d: 'گ', // gaf
  0x9e: 'ل', // lam
  0x9f: 'م', // meem
  0xa0: 'ن', // noon
  0xa1: 'ں', // noon ghunna
  0xa2: 'و', // waw
  0xa3: 'ئ', // yeh with hamza (also a lone hamza; see normalizeInPageText)
  0xa4: 'ی', // farsi yeh (choti ye)
  0xa5: 'ے', // yeh barree (bari ye; also medial ye)
  0xa6: 'ہ', // heh goal
  0xa7: 'ھ', // heh doachashmee
  0xa8: 'ٍ', // kasratan
  0xa9: ' ',
  0xaa: 'ِ', // kasra (zer)
  0xab: 'َ', // fatha (zabar)
  0xac: 'ُ', // damma (pesh)
  0xad: 'ّ', // shadda
  0xae: 'ؑ', // alayhe assallam sign
  0xb0: 'ٖ', // subscript alef
  0xb1: 'ْ', // sukun
  0xb3: 'ٓ', // madda
  0xb4: '', // join control
  0xb5: 'ٌ', // dammatan
  0xb6: 'ؤ', // waw with hamza
  0xb8: 'ي', // Arabic yeh
  0xb9: 'ۃ', // teh marbuta goal
  0xbd: 'ٰ', // superscript alef
  0xbe: 'ٗ', // inverted damma
  0xbf: 'ٔ', // hamza above
  0xc7: 'ً', // fathatan
  0xc8: 'آ', // alef with madda
  0xc9: 'أ', // alef with hamza above
  0xca: 'إ', // alef with hamza below
  0xcf: 'ؔ', // takhallus sign
  0xd0: '۰',
  0xd1: '۱',
  0xd2: '۲',
  0xd3: '۳',
  0xd4: '۴',
  0xd5: '۵',
  0xd6: '۶',
  0xd7: '۷',
  0xd8: '۸',
  0xd9: '۹',
  0xda: '!',
  0xdb: '﴾', // ornate left parenthesis (closing, in right-to-left text)
  0xdc: '﴿', // ornate right parenthesis (opening)
  0xe1: ')',
  0xe2: '(',
  0xe6: 'ؓ', // radi allahu anhu sign
  0xe7: 'ؒ', // rahmatullah alayhe sign
  0xe9: ':',
  0xea: '؛', // Arabic semicolon
  0xed: '،', // Arabic comma
  0xee: '؟', // Arabic question mark
  0xf1: '/',
  0xf2: '؎', // poetic verse sign
  0xf3: '۔', // full stop (khatma)
  0xf6: 'ﷺ', // sallallahou alayhe wasallam
  0xf7: '؁', // sanah sign
  0xf8: 'ؐ', // sallallahou alayhe wassallam sign
  0xf9: ',',
  0xfa: '[',
  0xfb: ']',
  0xfc: '.',
  0xfd: '‘',
  0xfe: '’',
};

const URDU_LETTER = '[\\u0621-\\u063A\\u0641-\\u064A\\u066E-\\u06D3\\u06FA-\\u06FF]';
const MARK = '[\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]';
/** Letters that don't join to the next letter. */
const NON_JOINING = '[\\u0621-\\u0625\\u0627\\u062F\\u0630\\u0631\\u0632\\u0648\\u0688\\u0691\\u0698\\u06D2\\u06D3]';

/**
 * An Urdu number as InPage stored it: digits, maybe with separators between them (۳٫۰,
 * ۱۴/۸/۱۹۴۷). InPage kept the whole thing in reverse (visual) order.
 */
const URDU_NUMBER = /[۰-۹٠-٩]+(?:[،٫٬.,/:-][۰-۹٠-٩]+)*/g;
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
  t = t.replace(/ +(?=[ً-ٰٟ])/g, '');
  t = t.replace(/ََ/g, 'ً');
  t = t
    .replace(/آ/g, 'آ')
    .replace(/أ/g, 'أ')
    .replace(/إ/g, 'إ')
    .replace(/ؤ/g, 'ؤ')
    .replace(/یٔ/g, 'ئ')
    .replace(/ۂ/g, 'ۂ')
    .replace(/ۓ/g, 'ۓ');
  t = t.replace(new RegExp(`\\u06D2(?=${MARK}*${URDU_LETTER})`, 'g'), 'ی');
  t = t.replace(
    new RegExp(`(^|[^\\u0600-\\u06FF]|[\\u06F0-\\u06F9]|${NON_JOINING}${MARK}*)\\u0626(?!${MARK}*${URDU_LETTER})`, 'g'),
    '$1ء'
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
  m.set('ء', 0xa3); // ء shares the ئ code
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
  'ۂ': 'ۂ', // ۂ → ہ + hamza
  'ۓ': 'ۓ', // ۓ → ے + hamza
  'ك': 'ک', // Arabic kaf → keheh
  'ه': 'ہ', // Arabic heh → heh goal
  'ى': 'ی', // alef maksura → farsi yeh
  'ە': 'ہ',
  '٠': '۰', '١': '۱', '٢': '۲', '٣': '۳', '٤': '۴',
  '٥': '۵', '٦': '۶', '٧': '۷', '٨': '۸', '٩': '۹',
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
      .replace(/[ۂۓكهىە٠-٩]/g, (c) => SUBSTITUTES[c] ?? c)
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
