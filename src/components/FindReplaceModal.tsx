import React, { useState } from 'react';
import { X, Replace, Search } from 'lucide-react';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplaceAll: (findText: string, replaceText: string, matchCase: boolean) => number;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  isOpen,
  onClose,
  onReplaceAll,
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecuteReplace = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!findText) {
      setMessage('براہ کرم تلاش کرنے والا لفظ تحریر کریں۔');
      return;
    }
    const count = onReplaceAll(findText, replaceText, matchCase);
    if (count > 0) {
      setMessage(`${count} جگہ تبدیلی مکمل ہو گئی۔ (${count} replacements made)`);
    } else {
      setMessage('کوئی نتیجہ نہیں ملا۔ (No matching text found)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4 select-none">
      <div
        className="max-w-md w-full text-slate-800 shadow-2xl bg-white border border-slate-200 rounded-xl overflow-hidden font-modern"
        dir="ltr"
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between text-xs font-semibold bg-slate-900 text-white px-3.5 py-2.5">
          <div className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span>Find & Replace (تلاش اور تبدیلی)</span>
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
        <form onSubmit={handleExecuteReplace} className="p-4 flex flex-col gap-3 text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-semibold">تلاش کریں (Find What):</label>
            <input
              type="text"
              autoFocus
              value={findText}
              onChange={(e) => {
                setFindText(e.target.value);
                setMessage(null);
              }}
              dir="rtl"
              placeholder="تلاش کے لیے لفظ لکھیں..."
              className="w-full bg-white p-1.5 font-nastaliq text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-semibold">
              تبدیل کریں (Replace With):
            </label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => {
                setReplaceText(e.target.value);
                setMessage(null);
              }}
              dir="rtl"
              placeholder="تبدیل کرنے والا لفظ لکھیں..."
              className="w-full bg-white p-1.5 font-nastaliq text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 mt-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="accent-blue-600"
              />
              <span>Match Case / یکساں حروف</span>
            </label>
          </div>

          {message && (
            <div className="bg-blue-50 border border-blue-200 p-2 text-[11px] text-blue-900 font-nastaliq text-center rounded-md">
              {message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-1 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold modern-btn text-slate-700"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              <Replace className="w-3.5 h-3.5" />
              <span>Replace All (سب تبدیل کریں)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
