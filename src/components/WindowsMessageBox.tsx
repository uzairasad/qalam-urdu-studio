import React, { useRef } from 'react';
import { X, AlertTriangle, Info, HelpCircle, Upload } from 'lucide-react';
import { OFFLINE_SAMPLE_IMAGES } from '../utils/sampleImages';

export interface DialogOptions {
  isOpen: boolean;
  type: 'info' | 'warning' | 'confirm' | 'prompt-picture';
  title: string;
  message: string;
  onConfirm: (extraData?: any) => void;
  onCancel?: () => void;
  defaultValue?: string;
  defaultCaption?: string;
}

interface WindowsMessageBoxProps {
  dialog: DialogOptions | null;
  onClose: () => void;
}

export const WindowsMessageBox: React.FC<WindowsMessageBoxProps> = ({
  dialog,
  onClose,
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const [captionValue, setCaptionValue] = React.useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (dialog?.type === 'prompt-picture') {
      setInputValue(dialog.defaultValue || '');
      setCaptionValue(dialog.defaultCaption || '');
    }
  }, [dialog]);

  if (!dialog || !dialog.isOpen) return null;

  const handleConfirm = () => {
    if (dialog.type === 'prompt-picture') {
      dialog.onConfirm({ imageSrc: inputValue, caption: captionValue });
    } else {
      dialog.onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    dialog.onCancel?.();
    onClose();
  };

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') {
        setInputValue(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 safe-overlay flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4 select-none">
      <div
        className="max-w-md w-full text-slate-800 shadow-2xl bg-white border border-slate-200 rounded-xl overflow-hidden font-modern"
        dir="ltr"
      >
        {/* Title Bar */}
        <div className="px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold bg-slate-900 text-white">
          <span>{dialog.title || 'Qalam Urdu Studio'}</span>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Close"
            className="w-6 h-6 hover:bg-red-600 rounded text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 text-xs">
          <div className="flex gap-3">
            <div className="shrink-0 mt-0.5">
              {dialog.type === 'warning' && <AlertTriangle className="w-8 h-8 text-amber-600" />}
              {dialog.type === 'confirm' && <HelpCircle className="w-8 h-8 text-blue-600" />}
              {(dialog.type === 'info' || dialog.type === 'prompt-picture') && (
                <Info className="w-8 h-8 text-blue-600" />
              )}
            </div>

            <div className="space-y-2 flex-1 min-w-0">
              <p className="text-slate-800 leading-normal whitespace-pre-line">{dialog.message}</p>

              {dialog.type === 'prompt-picture' && (
                <div className="space-y-2.5 mt-2 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">
                      Upload Image from PC (کمپیوٹر سے تصویر منتخب کریں):
                    </label>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLocalImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="px-3 py-1.5 font-semibold flex items-center gap-1.5 text-xs modern-btn text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Browse Image File...</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-0.5 font-semibold">
                      Or Image URL / Data URI:
                    </label>
                    <input
                      type="text"
                      value={inputValue.startsWith('data:image/') ? '[Embedded Image Data]' : inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-white p-1.5 font-mono text-[11px] border border-slate-300 rounded-md focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-0.5 font-semibold">
                      Caption (تصویر کا عنوان):
                    </label>
                    <input
                      type="text"
                      value={captionValue}
                      onChange={(e) => setCaptionValue(e.target.value)}
                      dir="rtl"
                      placeholder="تصویر کا عنوان یا تفصیل..."
                      className="w-full bg-white p-1.5 font-nastaliq text-[11px] border border-slate-300 rounded-md focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-600 block mb-1">
                      Offline Sample Illustrations (آف لائن نمونہ تصاویر):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {OFFLINE_SAMPLE_IMAGES.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setInputValue(s.url)}
                          className="px-2 py-1 text-[10px] modern-btn text-slate-700"
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="px-4 py-2.5 flex justify-end gap-2 bg-slate-50 border-t border-slate-200">
          {dialog.type !== 'info' && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-1.5 text-xs font-semibold modern-btn text-slate-700"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-1.5 text-xs font-semibold shadow-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
