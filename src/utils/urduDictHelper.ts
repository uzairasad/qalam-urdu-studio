import type { UrduDictionaryEntry } from './urduDictionary';

export type CompactDictRow = [
  word: string,
  roman: string,
  pos: string,
  category: UrduDictionaryEntry['category'],
  meaningUrdu: string,
  meaningEn: string,
  synonyms: string[],
  antonyms?: string[],
  example?: string
];

export function expandDictRows(rows: CompactDictRow[]): UrduDictionaryEntry[] {
  return rows.map(
    ([word, roman, pos, category, meaningUrdu, meaningEn, synonyms, antonyms, example]) => ({
      word,
      roman,
      pos,
      category,
      meaningUrdu,
      meaningEn,
      synonyms,
      ...(antonyms && antonyms.length > 0 ? { antonyms } : {}),
      example: example || `${word} کا برمحل استعمال تحریر کو مؤثر اور بامعنی بناتا ہے۔`,
    })
  );
}
