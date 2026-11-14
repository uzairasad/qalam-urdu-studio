import React, { useState } from 'react';
import { X, CornerDownLeft, Space } from 'lucide-react';
import {
  KEYBOARD_LAYOUTS,
  getVisualKeyboardRows,
  SPECIAL_SYMBOLS,
} from '../utils/phoneticKeyboard';
import { KeyboardLayout } from '../types/inpage';

interface VirtualKeyboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertChar: (char: string) => void;
  keyboardLayout: KeyboardLayout;
  onChangeKeyboardLayout: (layout: KeyboardLayout) => void;
}

export const VirtualKeyboardModal: React.FC<VirtualKeyboardModalProps> = ({
  isOpen,
  onClose,
  onInsertChar,
  keyboardLayout,
  onChangeKeyboardLayout,
}) => {
  const [isShift, setIsShift] = useState(false);

  if (!isOpen) return null;

  const activeLayoutMeta =
    KEYBOARD_LAYOUTS.find((l) => l.id === keyboardLayout) || KEYBOARD_LAYOUTS[0];
  const rows = getVisualKeyboardRows(keyboardLayout);

  return (
    <div className="fixed inset-0 z-50 safe-overlay flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-2 sm:p-4 select-none">
      <div
        className="max-w-2xl w-full max-h-[90dvh] flex flex-col text-slate-800 shadow-2xl bg-white border border-slate-200 rounded-xl overflow-hidden font-modern"
        dir="ltr"
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between text-xs font-semibold bg-slate-900 text-white px-3.5 py-2.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-arabic-sans text-sm leading-normal shrink-0">کی بورڈ</span>
            <span className="font-arabic-sans leading-normal truncate">
              Qalam Urdu Keyboard ({activeLayoutMeta.name} — {activeLayoutMeta.urduName})
            </span>
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

        {/* Content */}
        <div className="p-2.5 sm:p-3.5 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-1">
              {KEYBOARD_LAYOUTS.map((layout) => {
                const isSelected = layout.id === keyboardLayout;
                return (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => onChangeKeyboardLayout(layout.id)}
                    className={`px-2.5 py-1 text-[11px] font-semibold border transition-colors rounded-md ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'modern-btn text-slate-700'
                    }`}
                  >
                    {layout.name} ({layout.urduName})
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setIsShift(!isShift)}
              className={`px-3 py-1 font-bold text-xs border transition-colors rounded-md ${
                isShift
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'modern-btn text-slate-800'
              }`}
            >
              SHIFT: {isShift ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Virtual Keyboard Grid */}
          <div className="p-1.5 sm:p-2.5 flex flex-col gap-1 sm:gap-1.5 bg-slate-100 border border-slate-200 rounded-lg">
            {rows.map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-0.5 sm:gap-1">
                {row.map((item, kIdx) => {
                  const displayUrdu = isShift ? item.shiftUrdu : item.urdu;
                  const displayLatin = isShift ? item.shiftKey : item.key;
                  return (
                    <button
                      key={kIdx}
                      type="button"
                      onClick={() => onInsertChar(displayUrdu)}
                      className="flex flex-col items-center justify-between py-1 px-0.5 sm:px-1 flex-1 min-w-0 max-w-[44px] h-10 sm:h-12 overflow-hidden modern-btn bg-white hover:bg-blue-50 active:bg-blue-100 rounded-md"
                    >
                      <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono leading-none">
                        {displayLatin}
                      </span>
                      <span className="font-arabic-sans font-bold text-sm sm:text-base text-blue-900 leading-normal">
                        {displayUrdu}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Bottom Row: Spacebar & Special keys */}
            <div className="flex justify-center gap-1 sm:gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => setIsShift(!isShift)}
                className={`px-2.5 sm:px-4 h-9 font-bold text-xs border rounded-md shrink-0 ${
                  isShift
                    ? 'bg-blue-600 text-white border-blue-700'
                    : 'modern-btn bg-white'
                }`}
              >
                Shift
              </button>
              <button
                type="button"
                onClick={() => onInsertChar(' ')}
                className="flex-1 max-w-[280px] h-9 flex items-center justify-center gap-1.5 sm:gap-2 text-xs overflow-hidden modern-btn bg-white rounded-md"
              >
                <Space className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="font-arabic-sans leading-normal truncate">فاصلہ (Space)</span>
              </button>
              <button
                type="button"
                onClick={() => onInsertChar('\n')}
                className="px-2.5 sm:px-4 h-9 flex items-center justify-center gap-1 sm:gap-1.5 text-xs overflow-hidden modern-btn bg-white rounded-md shrink-0"
              >
                <CornerDownLeft className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="font-arabic-sans leading-normal">سطر (Enter)</span>
              </button>
            </div>
          </div>

          {/* Quick Ligatures Strip */}
          <div className="mt-3 pt-2.5 border-t border-slate-200">
            <span className="text-[11px] font-semibold font-arabic-sans leading-normal text-slate-700 block mb-1.5">
              خصوصی اسلامی و ادبی علامات (Special Ligatures):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SPECIAL_SYMBOLS.slice(0, 12).map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onInsertChar(s.char)}
                  title={s.label}
                  className="px-2.5 py-1 min-h-[30px] overflow-hidden font-arabic-sans text-xs text-blue-950 flex items-center gap-1.5 leading-normal modern-btn rounded-md"
                >
                  <span className="text-sm leading-normal">{s.char}</span>
                  <span className="text-[10px] text-slate-500 leading-normal font-modern">
                    {s.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3.5 py-2 flex justify-end bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold font-arabic-sans leading-normal overflow-hidden modern-btn text-slate-700"
          >
            بند کریں (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
