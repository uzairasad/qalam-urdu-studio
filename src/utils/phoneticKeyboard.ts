import { KeyboardLayout } from '../types/inpage';

/**
 * Standard Urdu Phonetic, Monotype (Press), and Muqtadira Keyboard Layouts
 * for Qalam Urdu Studio.
 */

export const KEYBOARD_LAYOUTS: { id: KeyboardLayout; name: string; urduName: string }[] = [
  { id: 'phonetic', name: 'Phonetic', urduName: 'فونیٹک' },
  { id: 'monotype', name: 'Monotype (Press)', urduName: 'مونو ٹائپ' },
  { id: 'muqtadira', name: 'Muqtadira (CRULP)', urduName: 'مقتدرہ' },
];

export const PHONETIC_MAP: Record<string, string> = {
  // Lowercase keys
  'a': 'ا',
  'b': 'ب',
  'c': 'چ',
  'd': 'د',
  'e': 'ع',
  'f': 'ف',
  'g': 'گ',
  'h': 'ح',
  'i': 'ِ',
  'j': 'ج',
  'k': 'ک',
  'l': 'ل',
  'm': 'م',
  'n': 'ن',
  'o': 'ہ',
  'p': 'پ',
  'q': 'ق',
  'r': 'ر',
  's': 'س',
  't': 'ت',
  'u': 'ء',
  'v': 'ط',
  'w': 'و',
  'x': 'ش',
  'y': 'ی',
  'z': 'ز',

  // Uppercase / Shift keys
  'A': 'آ',
  'B': 'ؓ',
  'C': 'ث',
  'D': 'ڈ',
  'E': 'ؑ',
  'F': 'ً',
  'G': 'غ',
  'H': 'ھ',
  'I': 'ٰ',
  'J': 'ض',
  'K': 'خ',
  'L': 'ؒ',
  'M': 'ّ',
  'N': 'ں',
  'O': 'ۃ',
  'P': 'ُ',
  'Q': 'ْ',
  'R': 'ڑ',
  'S': 'ص',
  'T': 'ٹ',
  'U': 'ئ',
  'V': 'ظ',
  'W': 'ؐ',
  'X': 'ژ',
  'Y': 'ے',
  'Z': 'ذ',

  // Punctuation and symbols
  ',': '،',
  ';': '؛',
  '?': '؟',
  '.': '۔',
  '%': '٪',
  '<': '«',
  '>': '»',
  '/': '/',
  '~': 'ّ',
  '`': 'َ',
  '@': '؎',
  '#': '؏',
  '$': '؀',
  '^': 'ﷺ',
  '&': 'ﷻ',
  '*': '٭',
};

// Traditional Monotype Urdu Press Keyboard Layout
export const MONOTYPE_MAP: Record<string, string> = {
  'q': 'ط', 'w': 'ص', 'e': 'ھ', 'r': 'د', 't': 'ٹ', 'y': 'پ', 'u': 'ت', 'i': 'ب', 'o': 'ج', 'p': 'ح',
  'a': 'م', 's': 'و', 'd': 'ر', 'f': 'ن', 'g': 'ل', 'h': 'ہ', 'j': 'ا', 'k': 'ک', 'l': 'ی', ';': '؛',
  'z': 'ق', 'x': 'ف', 'c': 'ے', 'v': 'س', 'b': 'ش', 'n': 'غ', 'm': 'ع', ',': '،', '.': '۔', '/': '؟',
  'Q': 'ظ', 'W': 'ض', 'E': 'ذ', 'R': 'ڈ', 'T': 'ث', 'Y': 'ّ', 'U': 'ۃ', 'I': 'ْ', 'O': 'چ', 'P': 'خ',
  'A': 'ژ', 'S': 'ز', 'D': 'ڑ', 'F': 'ں', 'G': 'ؒ', 'H': 'ء', 'J': 'آ', 'K': 'گ', 'L': 'ئ',
  'Z': 'ٰ', 'X': 'ً', 'C': 'ِ', 'V': 'َ', 'B': 'ُ', 'N': 'ؑ', 'M': 'ﷺ',
  '<': '«', '>': '»', '?': '؟', '%': '٪', '`': 'َ', '~': 'ّ',
};

// Muqtadira National Language Authority (CRULP) Urdu Keyboard Layout
export const MUQTADIRA_MAP: Record<string, string> = {
  'q': 'ض', 'w': 'ص', 'e': 'غ', 'r': 'ر', 't': 'ٹ', 'y': 'ط', 'u': 'ظ', 'i': 'ع', 'o': 'خ', 'p': 'ح',
  'a': 'ا', 's': 'س', 'd': 'د', 'f': 'ف', 'g': 'گ', 'h': 'ہ', 'j': 'ج', 'k': 'ک', 'l': 'ل', ';': '؛',
  'z': 'ز', 'x': 'ش', 'c': 'چ', 'v': 'ب', 'b': 'پ', 'n': 'ن', 'm': 'م', ',': '،', '.': '۔', '/': '؟',
  'Q': 'ق', 'W': 'و', 'E': 'ء', 'R': 'ڑ', 'T': 'ت', 'Y': 'ی', 'U': 'ے', 'I': 'ِ', 'O': 'ۃ', 'P': 'ُ',
  'A': 'آ', 'S': 'ث', 'D': 'ڈ', 'F': 'ً', 'G': 'ھ', 'H': 'ھ', 'J': 'ذ', 'K': 'خ', 'L': 'ؒ',
  'Z': 'ژ', 'X': 'ّ', 'C': 'ث', 'V': 'ْ', 'B': 'ؓ', 'N': 'ں', 'M': 'َ',
  '<': '«', '>': '»', '?': '؟', '%': '٪', '`': 'َ', '~': 'ّ',
};

// Urdu Numerals Map
export const URDU_NUMERALS: Record<string, string> = {
  '0': '۰',
  '1': '۱',
  '2': '۲',
  '3': '۳',
  '4': '۴',
  '5': '۵',
  '6': '۶',
  '7': '۷',
  '8': '۸',
  '9': '۹',
};

// Popular Urdu & Islamic Calligraphic Ligatures & Symbols
export const SPECIAL_SYMBOLS = [
  { char: '﷽', name: 'Bismillah', label: 'بسم اللہ شریف' },
  { char: 'ﷺ', name: 'Sallallahu Alaihi Wasallam', label: 'درود شریف' },
  { char: 'ﷻ', name: 'Jalla Jalaluhu', label: 'جل جلالہ' },
  { char: 'ؑ', name: 'Alaihis Salaam', label: 'علیہ السلام' },
  { char: 'ؒ', name: 'Rahmatullah Alaih', label: 'رحمۃ اللہ علیہ' },
  { char: 'ؓ', name: 'Razi Allahu Anhu', label: 'رضی اللہ عنہ' },
  { char: '؎', name: 'Alamat-e-Sher', label: 'علامتِ شعر' },
  { char: '؏', name: 'Alamat-e-Misra', label: 'علامتِ مصرع' },
  { char: '؀', name: 'Alamat-e-Sanah', label: 'علامتِ سنہ' },
  { char: '؁', name: 'Alamat-e-Safha', label: 'علامتِ صفحہ' },
  { char: '؂', name: 'Alamat-e-Number', label: 'علامتِ نمبر' },
  { char: 'ؔ', name: 'Alamat-e-Takhallus', label: 'علامتِ تخلص' },
  { char: '۔', name: 'Khatma', label: 'ختمہ (فل اسٹاپ)' },
  { char: '،', name: 'Waqfa', label: 'وقفہ (کوما)' },
  { char: '؛', name: 'Rabta', label: 'رابطہ (سیمی کولن)' },
  { char: '؟', name: 'Istifhaam', label: 'استفہام (سوالیہ)' },
  { char: '«', name: 'Qausain Open', label: 'قوسین شروع' },
  { char: '»', name: 'Qausain Close', label: 'قوسین ختم' },
  { char: '٪', name: 'Fee Sad', label: 'فیصد' },
  { char: '٭', name: 'Sitara', label: 'ستارہ' },
  { char: 'َ', name: 'Zabar', label: 'زبر' },
  { char: 'ِ', name: 'Zer', label: 'زیر' },
  { char: 'ُ', name: 'Pesh', label: 'پیش' },
  { char: 'ً', name: 'Do Zabar', label: 'دو زبر (تنوین)' },
  { char: 'ٍ', name: 'Do Zer', label: 'دو زیر (تنوین)' },
  { char: 'ٌ', name: 'Do Pesh', label: 'دو پیش (تنوین)' },
  { char: 'ّ', name: 'Tashdeed', label: 'تشدید' },
  { char: 'ْ', name: 'Jazm', label: 'جزم / سکون' },
  { char: 'ٰ', name: 'Khari Zabar', label: 'کھڑی زبر' },
];

export interface VisualKeyCell {
  key: string;
  shiftKey: string;
  urdu: string;
  shiftUrdu: string;
}

const ROW_BASE: [string, string][][] = [
  [
    ['`', '~'], ['1', '!'], ['2', '@'], ['3', '#'], ['4', '$'], ['5', '%'],
    ['6', '^'], ['7', '&'], ['8', '*'], ['9', '('], ['0', ')'], ['-', '_'], ['=', '+'],
  ],
  [
    ['q', 'Q'], ['w', 'W'], ['e', 'E'], ['r', 'R'], ['t', 'T'], ['y', 'Y'],
    ['u', 'U'], ['i', 'I'], ['o', 'O'], ['p', 'P'], ['[', '{'], [']', '}'],
  ],
  [
    ['a', 'A'], ['s', 'S'], ['d', 'D'], ['f', 'F'], ['g', 'G'], ['h', 'H'],
    ['j', 'J'], ['k', 'K'], ['l', 'L'], [';', ':'], ["'", '"'],
  ],
  [
    ['z', 'Z'], ['x', 'X'], ['c', 'C'], ['v', 'V'], ['b', 'B'], ['n', 'N'],
    ['m', 'M'], [',', '<'], ['.', '>'], ['/', '?'],
  ],
];

export function getLayoutMap(layout: KeyboardLayout): Record<string, string> {
  if (layout === 'monotype') return MONOTYPE_MAP;
  if (layout === 'muqtadira') return MUQTADIRA_MAP;
  return PHONETIC_MAP;
}

export function getVisualKeyboardRows(layout: KeyboardLayout): VisualKeyCell[][] {
  const map = getLayoutMap(layout);
  return ROW_BASE.map((row) =>
    row.map(([k, sk]) => ({
      key: k,
      shiftKey: sk,
      urdu: URDU_NUMERALS[k] ?? map[k] ?? k,
      shiftUrdu: map[sk] ?? sk,
    }))
  );
}

export const KEYBOARD_ROWS = getVisualKeyboardRows('phonetic');

export function translatePhoneticKey(key: string, useUrduNumerals = false): string | null {
  return translateUrduKey(key, 'phonetic', useUrduNumerals);
}

export function translateUrduKey(
  key: string,
  layout: KeyboardLayout = 'phonetic',
  useUrduNumerals = false
): string | null {
  if (useUrduNumerals && URDU_NUMERALS[key]) {
    return URDU_NUMERALS[key];
  }
  const map = getLayoutMap(layout);
  if (map[key] !== undefined) {
    return map[key];
  }
  return null;
}

export function stripUrduDiacritics(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
}
