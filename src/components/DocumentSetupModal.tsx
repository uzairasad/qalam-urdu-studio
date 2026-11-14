import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { PageSetup, PaperSize, Orientation } from '../types/inpage';

interface DocumentSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileName: string;
  pageSetup: PageSetup;
  onApply: (newSetup: PageSetup, newTitle: string, newFileName: string) => void;
}

export const DocumentSetupModal: React.FC<DocumentSetupModalProps> = ({
  isOpen,
  onClose,
  title,
  fileName,
  pageSetup,
  onApply,
}) => {
  const [docTitle, setDocTitle] = useState(title);
  const [docFileName, setDocFileName] = useState(fileName);
  const [paperSize, setPaperSize] = useState<PaperSize>(pageSetup.paperSize);
  const [orientation, setOrientation] = useState<Orientation>(pageSetup.orientation);
  const [widthMm, setWidthMm] = useState(pageSetup.widthMm);
  const [heightMm, setHeightMm] = useState(pageSetup.heightMm);
  const [margins, setMargins] = useState(pageSetup.margins);
  const [columns, setColumns] = useState(pageSetup.columns);
  const [columnGutter, setColumnGutter] = useState(pageSetup.columnGutter);
  const [direction, setDirection] = useState<'rtl' | 'ltr'>(pageSetup.direction);

  useEffect(() => {
    if (isOpen) {
      setDocTitle(title);
      setDocFileName(fileName);
      setPaperSize(pageSetup.paperSize);
      setOrientation(pageSetup.orientation);
      setWidthMm(pageSetup.widthMm);
      setHeightMm(pageSetup.heightMm);
      setMargins(pageSetup.margins);
      setColumns(pageSetup.columns);
      setColumnGutter(pageSetup.columnGutter);
      setDirection(pageSetup.direction);
    }
  }, [isOpen, title, fileName, pageSetup]);

  if (!isOpen) return null;

  const handlePaperSizeChange = (sz: PaperSize) => {
    setPaperSize(sz);
    if (sz === 'A4') {
      setWidthMm(orientation === 'portrait' ? 210 : 297);
      setHeightMm(orientation === 'portrait' ? 297 : 210);
    } else if (sz === 'Letter') {
      setWidthMm(orientation === 'portrait' ? 215.9 : 279.4);
      setHeightMm(orientation === 'portrait' ? 279.4 : 215.9);
    } else if (sz === 'Legal') {
      setWidthMm(orientation === 'portrait' ? 215.9 : 355.6);
      setHeightMm(orientation === 'portrait' ? 355.6 : 215.9);
    } else if (sz === 'Tabloid') {
      setWidthMm(orientation === 'portrait' ? 279.4 : 431.8);
      setHeightMm(orientation === 'portrait' ? 431.8 : 279.4);
    }
  };

  const handleOrientationChange = (ori: Orientation) => {
    setOrientation(ori);
    if (ori !== orientation) {
      const temp = widthMm;
      setWidthMm(heightMm);
      setHeightMm(temp);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = docTitle.trim() || 'Untitled-1';
    const rawFile = docFileName.trim() || `${cleanTitle}.qlm`;
    const normalizedFile = rawFile.replace(/\.qpg$/i, '.qlm');
    const cleanFileName =
      normalizedFile.endsWith('.qlm') || normalizedFile.endsWith('.inp')
        ? normalizedFile
        : `${normalizedFile}.qlm`;

    onApply(
      {
        paperSize,
        widthMm,
        heightMm,
        orientation,
        margins,
        columns,
        columnGutter,
        direction,
      },
      cleanTitle,
      cleanFileName
    );
    onClose();
  };

  const groupClass = 'border border-slate-200 p-3 rounded-lg bg-slate-50 relative';
  const groupTitleClass = 'text-[11px] font-semibold text-blue-700 block mb-1.5';
  const inputClass =
    'w-full bg-white border border-slate-300 px-2 py-1 rounded-md font-mono tabular-nums focus:outline-none focus:border-blue-500';

  return (
    <div className="fixed inset-0 z-50 safe-overlay flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-2 sm:p-4 select-none">
      <div
        className="max-w-md w-full text-slate-800 shadow-2xl bg-white border border-slate-200 rounded-xl overflow-hidden font-modern"
        dir="ltr"
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between text-xs font-semibold bg-slate-900 text-white px-3.5 py-2.5">
          <span>Document Setup (دستاویز سیٹ اپ)</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-5 h-5 hover:bg-red-600 rounded text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3 text-xs max-h-[82vh] overflow-y-auto">
          {/* Document Identity */}
          <div className={groupClass}>
            <span className={groupTitleClass}>Document Identity</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <div>
                <label className="block text-slate-700 mb-0.5">Document Title:</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 px-2 py-1 rounded-md focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-0.5">File Name (.qlm):</label>
                <input
                  type="text"
                  value={docFileName}
                  onChange={(e) => setDocFileName(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Paper Size & Dimensions */}
          <div className={groupClass}>
            <span className={groupTitleClass}>Page Dimensions</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <div>
                <label className="block text-slate-700 mb-0.5">Paper Size:</label>
                <select
                  value={paperSize}
                  onChange={(e) => handlePaperSizeChange(e.target.value as PaperSize)}
                  className="w-full bg-white border border-slate-300 rounded-md p-1"
                >
                  <option value="A4">A4 (210 × 297 mm)</option>
                  <option value="Letter">Letter (8.5 × 11 in)</option>
                  <option value="Legal">Legal (8.5 × 14 in)</option>
                  <option value="Tabloid">Tabloid / Newspaper</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-0.5">Orientation:</label>
                <div className="flex gap-2 mt-1">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="orientation"
                      checked={orientation === 'portrait'}
                      onChange={() => handleOrientationChange('portrait')}
                      className="accent-blue-600"
                    />
                    <span>Portrait</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="orientation"
                      checked={orientation === 'landscape'}
                      onChange={() => handleOrientationChange('landscape')}
                      className="accent-blue-600"
                    />
                    <span>Landscape</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="block text-slate-700 mb-0.5">Width (mm):</label>
                <input
                  type="number"
                  value={widthMm}
                  onChange={(e) => setWidthMm(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-0.5">Height (mm):</label>
                <input
                  type="number"
                  value={heightMm}
                  onChange={(e) => setHeightMm(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Margins */}
          <div className={groupClass}>
            <span className={groupTitleClass}>Margins (حاشیے - mm)</span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Top:</label>
                <input
                  type="number"
                  value={margins.top}
                  onChange={(e) => setMargins({ ...margins, top: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Bottom:</label>
                <input
                  type="number"
                  value={margins.bottom}
                  onChange={(e) => setMargins({ ...margins, bottom: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Left:</label>
                <input
                  type="number"
                  value={margins.left}
                  onChange={(e) => setMargins({ ...margins, left: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Right:</label>
                <input
                  type="number"
                  value={margins.right}
                  onChange={(e) => setMargins({ ...margins, right: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Columns & Direction */}
          <div className={groupClass}>
            <span className={groupTitleClass}>Columns & Direction (کالم اور سمت)</span>

            <div className="grid grid-cols-2 gap-3 mt-1">
              <div>
                <label className="block text-slate-700 mb-0.5">Columns (1–6):</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={columns}
                  onChange={(e) => setColumns(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-0.5">Gutter (mm):</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={columnGutter}
                  onChange={(e) => setColumnGutter(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-2">
              <label className="block text-slate-700 mb-0.5">Document Flow Direction:</label>
              <div className="flex flex-wrap gap-4 mt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="direction"
                    checked={direction === 'rtl'}
                    onChange={() => setDirection('rtl')}
                    className="accent-blue-600"
                  />
                  <span className="font-arabic-sans leading-normal">دائیں سے بائیں (Right to Left - Urdu)</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="direction"
                    checked={direction === 'ltr'}
                    onChange={() => setDirection('ltr')}
                    className="accent-blue-600"
                  />
                  <span>Left to Right (English)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 mt-1 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold modern-btn text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>OK (لاگو کریں)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
