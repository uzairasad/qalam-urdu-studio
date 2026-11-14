import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { SPECIAL_SYMBOLS } from '../utils/phoneticKeyboard';

interface SymbolPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSymbol: (symbol: string) => void;
}

export const SymbolPickerModal: React.FC<SymbolPickerModalProps> = ({
  isOpen,
  onClose,
  onInsertSymbol,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredSymbols = SPECIAL_SYMBOLS.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.label.includes(search) ||
      s.char.includes(search)
  );

  return (
    <div className="fixed inset-0 z-50 safe-overlay flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4 select-none">
      <div
        className="max-w-lg w-full text-slate-800 shadow-2xl bg-white border border-slate-200 rounded-xl overflow-hidden font-modern"
        dir="ltr"
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between text-xs font-semibold bg-slate-900 text-white px-3.5 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="font-arabic-sans leading-normal">﷽</span>
            <span className="font-arabic-sans leading-normal">Insert Urdu & Islamic Symbols (رموز و علامات)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-6 h-6 hover:bg-red-600 rounded text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5">
          {/* Search bar */}
          <div className="relative mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="علامت یا نام تلاش کریں (Search symbol or name)..."
              className="w-full bg-white border pl-7 pr-2.5 py-1.5 text-xs font-nastaliq text-right border-slate-300 rounded-md focus:outline-none focus:border-blue-500"
              dir="rtl"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
          </div>

          {/* Grid of symbols */}
          <div className="p-2 grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto bg-slate-100 border border-slate-200 rounded-lg">
            {filteredSymbols.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onInsertSymbol(item.char);
                  onClose();
                }}
                title={`${item.label} (${item.name})`}
                className="p-2 min-h-[68px] overflow-hidden flex flex-col items-center justify-center group modern-btn bg-white hover:bg-blue-50 rounded-md"
              >
                <span className="font-arabic-sans text-lg leading-normal text-blue-950 group-hover:scale-105 transition-transform max-w-full truncate">
                  {item.char}
                </span>
                <span className="text-[10px] text-slate-600 truncate w-full text-center font-arabic-sans leading-normal mt-0.5">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <p className="mt-2.5 text-[11px] text-slate-600">
            Clicking a symbol inserts it into the active text box at current position.
          </p>
        </div>

        {/* Footer */}
        <div className="px-3.5 py-2 flex justify-end bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold modern-btn text-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
