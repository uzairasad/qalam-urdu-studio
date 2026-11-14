/**
 * InPage's Sindhi character set: bytes after a 0x05 prefix (Urdu uses 0x04).
 * The assignments come from the urdu-page project's research (MIT,
 * https://github.com/mubashir2k17/urdu-page, sindhi-map.ts), identified from InPage's ZoharSindhi
 * font and checked against the Unicode Arabic chart.
 */
const LETTERS = [
  'ا', 'ب', 'ٻ', 'ڀ', 'ت', 'ٺ', 'ٽ', 'ٿ', 'ث', 'پ', 'ج', 'ڄ', 'ڃ', 'چ', 'ڇ', 'ح',
  'خ', 'د', 'ڌ', 'ڏ', 'ڊ', 'ڍ', 'ذ', 'ر', 'ڙ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ',
  'ع', 'غ', 'ف', 'ڦ', 'ق', 'ڪ', 'ک', 'گ', 'ڳ', 'ڱ', 'ء', '۾', 'ي', 'ل', 'م', 'ن',
  'ڻ', 'و', 'ه', 'ھ',
];

export const INPAGE_SINDHI_TO_UNICODE: Readonly<Record<number, string>> = {
  ...Object.fromEntries(LETTERS.map((letter, index) => [0x81 + index, letter])),
  0x20: ' ', 0xb5: '!', 0xb6: '«', 0xb7: '+', 0xb8: '−', 0xb9: '×', 0xba: '=', 0xbb: '»',
  0xbc: '(', 0xbd: ')', 0xbe: '/', 0xbf: '%', 0xc0: '‘', 0xc1: '-', 0xc2: '.', 0xc3: '،',
  0xc4: '٠', 0xc5: '١', 0xc6: '٢', 0xc7: '٣', 0xc8: '٤', 0xc9: '٥', 0xca: '٦', 0xcb: '٧',
  0xcc: '٨', 0xcd: '٩', 0xce: ':', 0xcf: '؛', 0xd0: 'ّ', 0xd1: 'ْ', 0xd2: 'ٰ',
  0xd3: '؟', 0xd4: '۽', 0xd5: 'ٓ', 0xd6: 'ٌ', 0xd7: 'ُ', 0xd8: 'ً',
  0xd9: 'َ', 0xda: 'ٍ', 0xdb: 'ِ', 0xdc: 'ٔ', 0xdd: 'ٕ',
};
