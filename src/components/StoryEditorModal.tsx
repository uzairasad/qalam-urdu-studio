import React, { useState, useEffect } from 'react';
import { X, Check, FileText, Globe } from 'lucide-react';
import { TextElement, KeyboardLayout } from '../types/inpage';
import { translateUrduKey, KEYBOARD_LAYOUTS } from '../utils/phoneticKeyboard';
import { URDU_FONT_OPTIONS, resolveFontStack } from '../utils/fonts';

interface StoryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTextElement: TextElement | null;
  onSaveStory: (newText: string, fontFamily: string) => void;
  language: 'urdu' | 'english';
  keyboardLayout: KeyboardLayout;
  onToggleLanguage: () => void;
}

export const StoryEditorModal: React.FC<StoryEditorModalProps> = ({
  isOpen,
  onClose,
  selectedTextElement,
  onSaveStory,
  language,
  keyboardLayout,
  onToggleLanguage,
}) => {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Noto Nastaliq Urdu');

  useEffect(() => {
    if (selectedTextElement) {
      setText(selectedTextElement.text);
      setFontFamily(selectedTextElement.fontFamily || 'Noto Nastaliq Urdu');
    }
  }, [selectedTextElement, isOpen]);

  if (!isOpen) return null;

  const activeLayoutName =
    KEYBOARD_LAYOUTS.find((l) => l.id === keyboardLayout)?.name || 'Phonetic';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (language !== 'urdu') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (
      ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'Escape'].includes(
        e.key
      )
    ) {
      return;
    }

    const translated = translateUrduKey(e.key, keyboardLayout);
    if (translated) {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart ?? 0;
      const end = target.selectionEnd ?? 0;
      const newText = text.substring(0, start) + translated + text.substring(end);
      setText(newText);

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + translated.length;
      }, 0);
    }
  };

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const categories = Array.from(new Set(URDU_FONT_OPTIONS.map((f) => f.category)));

  return (
    <div className="fixed inset-0 z-50 safe-overlay flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-2 sm:p-4 select-none">
      <div
        className="max-w-3xl w-full h-[90dvh] md:h-[80vh] flex flex-col text-slate-800 shadow-2xl bg-white border border-slate-200 rounded-xl overflow-hidden font-modern"
        dir="ltr"
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between text-xs font-semibold shrink-0 bg-slate-900 text-white px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Story Editor — [اسٹوری ایڈیٹر قلم]</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-5 h-5 hover:bg-red-600 rounded text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 border-b bg-slate-50 border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onToggleLanguage}
              className={`px-2.5 py-1 border text-xs font-bold flex items-center gap-1.5 overflow-hidden rounded-md ${
                language === 'urdu'
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-white text-slate-800 border-slate-300'
              }`}
            >
              <Globe className="w-3 h-3 shrink-0" />
              <span className="font-arabic-sans leading-normal">
                {language === 'urdu' ? `اردو (${activeLayoutName})` : 'English'}
              </span>
            </button>

            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="bg-white px-2 py-1 text-xs text-slate-800 border border-slate-300 rounded-md"
            >
              {categories.map((cat) => (
                <optgroup key={cat} label={cat}>
                  {URDU_FONT_OPTIONS.filter((f) => f.category === cat).map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <span>Preview:</span>
              <input
                type="range"
                min="12"
                max="36"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-24 accent-blue-600"
              />
              <span className="w-8 text-right font-mono tabular-nums">{fontSize}pt</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono tabular-nums">
            <span>الفاظ (Words): {words}</span>
            <span>حروف (Chars): {chars}</span>
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 p-3 overflow-hidden flex flex-col bg-slate-100">
          {!selectedTextElement ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg p-6 text-center text-slate-500">
              <FileText className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700">No text box selected</p>
              <p className="text-[11px] mt-1">
                Select a Text Box on the page first, or type below to prepare text.
              </p>
            </div>
          ) : null}
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            dir={language === 'urdu' ? 'rtl' : 'ltr'}
            className={`flex-1 w-full px-5 py-6 bg-white outline-none resize-none select-text border border-slate-200 rounded-lg shadow-xs focus:border-blue-500 ${
              !selectedTextElement ? 'hidden' : ''
            }`}
            style={{
              fontFamily: resolveFontStack(fontFamily),
              fontSize: `${fontSize}pt`,
              lineHeight: 2.1,
              textAlign: language === 'urdu' ? 'right' : 'left',
              textRendering: 'optimizeLegibility',
            }}
            placeholder="یہاں براہ راست اردو یا انگریزی متن تحریر کیجئے..."
          />
        </div>

        {/* Footer Actions */}
        <div className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0 border-t bg-slate-50 border-slate-200">
          <span className="hidden sm:inline text-[11px] text-slate-600">
            Tip: Press <strong>Ctrl + Space</strong> to toggle between Urdu and English.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold modern-btn text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedTextElement}
              onClick={() => {
                onSaveStory(text, fontFamily);
                onClose();
              }}
              className="px-5 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-md transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply to Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
