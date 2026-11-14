import React, { useState } from 'react';
import { X, FileSpreadsheet } from 'lucide-react';
import { DocElement, Page, TextElement } from '../types/inpage';

interface WordCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: DocElement[];
  allPages: Page[];
}

export const WordCountModal: React.FC<WordCountModalProps> = ({
  isOpen,
  onClose,
  elements,
  allPages,
}) => {
  const [scope, setScope] = useState<'page' | 'document'>('page');

  if (!isOpen) return null;

  const targetElements =
    scope === 'page' ? elements : allPages.flatMap((p) => p.elements);

  const textElements = targetElements.filter((e) => e.type === 'text') as TextElement[];
  const fullText = textElements.map((e) => e.text).join('\n');

  const words = fullText.trim() ? fullText.trim().split(/\s+/).length : 0;
  const charsWithSpaces = fullText.length;
  const charsWithoutSpaces = fullText.replace(/\s+/g, '').length;
  const paragraphs = fullText.split(/\n+/).filter(Boolean).length;
  const lines = fullText.trim() ? fullText.split('\n').length : 0;
  const textFramesCount = textElements.length;

  return (
    <div className="fixed inset-0 z-50 safe-overlay flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4 select-none">
      <div
        className="max-w-md w-full text-slate-800 shadow-2xl bg-white border border-slate-200 rounded-xl overflow-hidden font-modern"
        dir="ltr"
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between text-xs font-semibold bg-slate-900 text-white px-3.5 py-2.5">
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span className="font-arabic-sans leading-normal">Word Count Statistics (الفاظ و حروف کا شمار)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-6 h-6 hover:bg-red-600 rounded text-slate-300 hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scope Selector + Content Table */}
        <div className="p-4 text-xs space-y-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setScope('page')}
              className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                scope === 'page'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Current Page
            </button>
            <button
              type="button"
              onClick={() => setScope('document')}
              className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                scope === 'document'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Whole Document ({allPages.length} {allPages.length === 1 ? 'Page' : 'Pages'})
            </button>
          </div>

          <div className="p-3 space-y-2 font-mono tabular-nums border bg-slate-50 border-slate-200 rounded-lg">
            <div className="flex justify-between items-center gap-3 border-b border-slate-200 pb-1.5">
              <span className="font-arabic-sans leading-normal text-slate-600">کل الفاظ (Total Words):</span>
              <strong className="text-blue-700 shrink-0">{words.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between items-center gap-3 border-b border-slate-200 pb-1.5">
              <span className="font-arabic-sans leading-normal text-slate-600">
                حروف بلحاظِ فاصلہ (Characters with spaces):
              </span>
              <strong className="shrink-0">{charsWithSpaces.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between items-center gap-3 border-b border-slate-200 pb-1.5">
              <span className="font-arabic-sans leading-normal text-slate-600">
                خالص حروف (Characters without spaces):
              </span>
              <strong className="shrink-0">{charsWithoutSpaces.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between items-center gap-3 border-b border-slate-200 pb-1.5">
              <span className="font-arabic-sans leading-normal text-slate-600">پیراگراف (Paragraphs):</span>
              <strong className="shrink-0">{paragraphs}</strong>
            </div>
            <div className="flex justify-between items-center gap-3 border-b border-slate-200 pb-1.5">
              <span className="font-arabic-sans leading-normal text-slate-600">سطور (Lines):</span>
              <strong className="shrink-0">{lines}</strong>
            </div>
            <div className="flex justify-between items-center gap-3">
              <span className="font-arabic-sans leading-normal text-slate-600">متن کے خانے (Text Boxes):</span>
              <strong className="shrink-0">{textFramesCount}</strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3.5 py-2 flex justify-end bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
