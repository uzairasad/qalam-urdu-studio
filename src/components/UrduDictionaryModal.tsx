import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, BookOpen, Copy, CornerDownLeft, Keyboard } from 'lucide-react';
import {
  URDU_DICTIONARY_ENTRIES,
  DICTIONARY_CATEGORIES,
  DictionaryCategory,
  UrduDictionaryEntry,
  normalizeUrduForSearch,
} from '../utils/urduDictionary';
import { translateUrduKey } from '../utils/phoneticKeyboard';
import { KeyboardLayout } from '../types/inpage';

interface UrduDictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertWord: (word: string) => void;
  onCopyWord: (word: string) => void;
  canInsertIntoText: boolean;
  keyboardLayout: KeyboardLayout;
  initialQuery?: string;
}

const URDU_ALPHABET_FILTERS = [
  'ا', 'ب', 'پ', 'ت', 'ث', 'ج', 'چ', 'ح', 'خ',
  'د', 'ڈ', 'ذ', 'ر', 'ز', 'ژ', 'س', 'ش',
  'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق',
  'ک', 'گ', 'ل', 'م', 'ن', 'و', 'ہ', 'ی',
] as const;

function getEntryInitialLetter(word: string): string {
  const first = normalizeUrduForSearch(word).charAt(0);
  if (first === 'ھ' || first === 'ۂ' || first === 'ۃ') return 'ہ';
  if (first === 'ے' || first === 'ئ') return 'ی';
  return first;
}

const PAGE_SIZE = 150;

export const UrduDictionaryModal: React.FC<UrduDictionaryModalProps> = ({
  isOpen,
  onClose,
  onInsertWord,
  onCopyWord,
  canInsertIntoText,
  keyboardLayout,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<DictionaryCategory>('all');
  const [letterFilter, setLetterFilter] = useState<string>('all');
  const [displayLimit, setDisplayLimit] = useState<number>(PAGE_SIZE);
  const [phoneticInput, setPhoneticInput] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<UrduDictionaryEntry>(
    URDU_DICTIONARY_ENTRIES[0]
  );

  useEffect(() => {
    if (isOpen && initialQuery) {
      setQuery(initialQuery);
      setLetterFilter('all');
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    setDisplayLimit(PAGE_SIZE);
  }, [query, category, letterFilter]);

  const filteredEntries = useMemo(() => {
    const qRaw = query.trim();
    const qNorm = normalizeUrduForSearch(qRaw);
    const qLower = qRaw.toLowerCase();

    const baseFiltered = URDU_DICTIONARY_ENTRIES.filter((entry) => {
      if (category !== 'all' && entry.category !== category) return false;
      if (letterFilter !== 'all' && getEntryInitialLetter(entry.word) !== letterFilter) {
        return false;
      }
      if (!qRaw) return true;

      return (
        normalizeUrduForSearch(entry.word).includes(qNorm) ||
        entry.roman.toLowerCase().includes(qLower) ||
        entry.meaningEn.toLowerCase().includes(qLower) ||
        normalizeUrduForSearch(entry.meaningUrdu).includes(qNorm) ||
        entry.synonyms.some((s) => normalizeUrduForSearch(s).includes(qNorm))
      );
    });

    if (!qRaw) return baseFiltered;

    const scoreEntry = (entry: UrduDictionaryEntry): number => {
      const wNorm = normalizeUrduForSearch(entry.word);
      const rLower = entry.roman.toLowerCase();
      const enGlosses = entry.meaningEn
        .toLowerCase()
        .split(/[,;()]/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (wNorm === qNorm || rLower === qLower || enGlosses.some((g) => g === qLower)) {
        return 100;
      }
      if (
        wNorm.startsWith(qNorm) ||
        rLower.startsWith(qLower) ||
        enGlosses.some((g) => g.startsWith(qLower))
      ) {
        return 60;
      }
      if (
        wNorm.includes(qNorm) ||
        rLower.includes(qLower) ||
        enGlosses.some((g) => g.includes(qLower))
      ) {
        return 30;
      }
      return 10;
    };

    return [...baseFiltered].sort((a, b) => scoreEntry(b) - scoreEntry(a));
  }, [query, category, letterFilter]);

  const visibleEntries = useMemo(
    () => filteredEntries.slice(0, displayLimit),
    [filteredEntries, displayLimit]
  );

  useEffect(() => {
    if (filteredEntries.length > 0) {
      setSelectedEntry(filteredEntries[0]);
    }
  }, [filteredEntries]);

  if (!isOpen) return null;

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!phoneticInput) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (
      ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab', 'Escape'].includes(
        e.key
      )
    ) {
      return;
    }
    const translated = translateUrduKey(e.key, keyboardLayout);
    if (translated) {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart ?? query.length;
      const end = target.selectionEnd ?? query.length;
      const next = query.substring(0, start) + translated + query.substring(end);
      setQuery(next);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + translated.length;
      }, 0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-2 sm:p-4 select-none">
      <div
        className="max-w-4xl w-full h-[90dvh] md:h-[84vh] max-h-[720px] flex flex-col text-slate-800 shadow-2xl bg-white border border-slate-200 rounded-xl overflow-hidden font-modern"
        dir="ltr"
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between text-xs font-semibold bg-slate-900 text-white px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Urdu Dictionary & Thesaurus</span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span className="font-arabic-sans text-slate-200">اردو لغت و مترادفات</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Dictionary"
            className="w-6 h-6 hover:bg-red-600 rounded text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-2.5 sm:p-3 bg-slate-50 border-b border-slate-200 space-y-2 shrink-0">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                dir={phoneticInput || /[\u0600-\u06FF]/.test(query) ? 'rtl' : 'ltr'}
                placeholder="Search Urdu word, Roman (e.g. 'istehkam'), or English meaning..."
                className="w-full bg-white border border-slate-300 rounded-md pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-arabic-sans"
              />
            </div>

            <button
              type="button"
              onClick={() => setPhoneticInput((prev) => !prev)}
              title="Toggle Phonetic Urdu typing inside search box"
              className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                phoneticInput
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'modern-btn text-slate-700'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>{phoneticInput ? 'اردو ان پٹ' : 'English / Phonetic'}</span>
            </button>

            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="px-2.5 py-1.5 text-xs font-medium modern-btn text-slate-600 whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
              {DICTIONARY_CATEGORIES.map((cat) => {
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="text-slate-400 mx-1" aria-hidden="true">·</span>
                    <span className="font-arabic-sans">{cat.urdu}</span>
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] text-slate-500 font-mono tabular-nums whitespace-nowrap">
              {filteredEntries.length} / {URDU_DICTIONARY_ENTRIES.length} entries
            </span>
          </div>

          {/* Urdu Alphabet Quick Filter (حروفِ تہجی) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" dir="rtl">
            <button
              type="button"
              onClick={() => setLetterFilter('all')}
              className={`px-2 py-0.5 text-[11px] font-medium rounded border whitespace-nowrap shrink-0 transition-colors ${
                letterFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              تمام
            </button>
            {URDU_ALPHABET_FILTERS.map((letter) => {
              const active = letterFilter === letter;
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => setLetterFilter(active ? 'all' : letter)}
                  className={`min-w-[24px] h-6 px-1.5 text-xs font-arabic-sans rounded border flex items-center justify-center whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-blue-600 text-white border-blue-700 font-semibold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={`Filter words starting with ${letter}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Two-Pane Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Left / Top: Word List */}
          <div className="w-full h-44 sm:h-48 md:h-auto md:w-64 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto bg-white divide-y divide-slate-100 shrink-0">
            {filteredEntries.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">No matching Urdu word found</p>
                <p className="text-[11px]">Try searching in Roman Urdu, English, or clear filters.</p>
              </div>
            ) : (
              <>
                {visibleEntries.map((entry) => {
                  const isSelected =
                    entry.word === selectedEntry.word && entry.roman === selectedEntry.roman;
                  return (
                    <button
                      key={`${entry.word}-${entry.roman}`}
                      type="button"
                      onClick={() => setSelectedEntry(entry)}
                      className={`w-full px-3 py-2.5 text-left flex items-center justify-between gap-2 transition-colors ${
                        isSelected
                          ? 'bg-blue-50 text-blue-900'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-700 truncate">
                          {entry.roman}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {entry.meaningEn}
                        </div>
                      </div>
                      <span
                        dir="rtl"
                        className="font-nastaliq text-base text-slate-900 leading-[2.1] shrink-0"
                      >
                        {entry.word}
                      </span>
                    </button>
                  );
                })}
                {filteredEntries.length > visibleEntries.length && (
                  <div className="p-2.5 bg-slate-50 text-center space-y-1.5">
                    <div className="text-[11px] text-slate-500 tabular-nums">
                      Showing {visibleEntries.length} of {filteredEntries.length}
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDisplayLimit((prev) => prev + PAGE_SIZE)}
                        className="px-2.5 py-1 text-[11px] font-semibold modern-btn text-slate-700 whitespace-nowrap"
                      >
                        Load +{Math.min(PAGE_SIZE, filteredEntries.length - visibleEntries.length)}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisplayLimit(filteredEntries.length)}
                        className="px-2.5 py-1 text-[11px] font-semibold modern-btn text-blue-700 whitespace-nowrap"
                      >
                        Show All
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right / Bottom: Entry Details */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 bg-slate-50/40 min-h-0">
            {selectedEntry ? (
              <div className="space-y-4">
                {/* Word Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{selectedEntry.roman}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-arabic-sans">{selectedEntry.pos}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{selectedEntry.category}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedEntry.meaningEn}
                    </p>
                  </div>

                  <div dir="rtl" className="text-right">
                    <h2 className="font-nastaliq text-3xl text-blue-950 leading-[2.2]">
                      {selectedEntry.word}
                    </h2>
                  </div>
                </div>

                {/* Urdu Meaning */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-semibold text-slate-600">
                    Urdu Definition · اردو مفہوم
                  </h3>
                  <div
                    dir="rtl"
                    className="bg-white border border-slate-200 rounded-lg px-4 py-3 font-nastaliq text-base text-slate-800 leading-[2.3]"
                  >
                    {selectedEntry.meaningUrdu}
                  </div>
                </div>

                {/* Usage Example */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-semibold text-slate-600">
                    Usage Example · جملے میں استعمال
                  </h3>
                  <div
                    dir="rtl"
                    className="bg-white border border-slate-200 rounded-lg px-4 py-3 font-nastaliq text-sm text-slate-700 leading-[2.3]"
                  >
                    {selectedEntry.example}
                  </div>
                </div>

                {/* Synonyms & Antonyms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-semibold text-slate-600">
                      Synonyms · مترادفات
                    </h3>
                    <div className="flex flex-wrap gap-1.5" dir="rtl">
                      {selectedEntry.synonyms.map((syn) => {
                        const linked = URDU_DICTIONARY_ENTRIES.find((e) => e.word === syn);
                        return (
                          <button
                            key={syn}
                            type="button"
                            onClick={() => {
                              if (linked) setSelectedEntry(linked);
                              else onCopyWord(syn);
                            }}
                            title={linked ? `Open "${syn}" entry` : `Copy "${syn}"`}
                            className="px-2.5 py-1 modern-btn text-xs font-arabic-sans text-blue-900 hover:bg-blue-50"
                          >
                            {syn}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedEntry.antonyms && selectedEntry.antonyms.length > 0 && (
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-semibold text-slate-600">
                        Antonyms · متضاد الفاظ
                      </h3>
                      <div className="flex flex-wrap gap-1.5" dir="rtl">
                        {selectedEntry.antonyms.map((ant) => {
                          const linked = URDU_DICTIONARY_ENTRIES.find((e) => e.word === ant);
                          return (
                            <button
                              key={ant}
                              type="button"
                              onClick={() => {
                                if (linked) setSelectedEntry(linked);
                                else onCopyWord(ant);
                              }}
                              title={linked ? `Open "${ant}" entry` : `Copy "${ant}"`}
                              className="px-2.5 py-1 modern-btn text-xs font-arabic-sans text-slate-700 hover:bg-slate-100"
                            >
                              {ant}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-slate-500">
            {canInsertIntoText
              ? 'Click "Insert into Text Box" to append this Urdu word to the selected frame.'
              : 'Select any Text Box on the page to insert words directly, or copy to clipboard.'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCopyWord(selectedEntry.word)}
              className="px-3.5 py-1.5 text-xs font-semibold modern-btn text-slate-700 flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Word</span>
            </button>
            <button
              type="button"
              disabled={!canInsertIntoText}
              onClick={() => {
                onInsertWord(selectedEntry.word);
                onClose();
              }}
              className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
              <span>Insert into Text Box</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
