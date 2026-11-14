import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  FileDown,
  FileText,
  ZoomIn,
  ZoomOut,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { DocumentProject } from '../types/inpage';
import { PrintablePageView } from './PrintablePageView';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: DocumentProject;
  initialPageIndex?: number;
  onPrint: () => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  project,
  initialPageIndex = 0,
  onPrint,
  onExportPdf,
  onExportDocx,
}) => {
  const [previewZoom, setPreviewZoom] = useState<number>(0.65);
  const [showMarginGuides, setShowMarginGuides] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all');
  const [focusedPageIdx, setFocusedPageIdx] = useState<number>(initialPageIndex);

  useEffect(() => {
    if (isOpen) {
      setFocusedPageIdx(Math.min(initialPageIndex, project.pages.length - 1));
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        const fit = (window.innerWidth - 36) / (project.pageSetup.widthMm * 3.7795);
        setPreviewZoom(Math.max(0.3, Math.min(0.65, Number(fit.toFixed(2)))));
      } else {
        setPreviewZoom(0.65);
      }
    }
  }, [isOpen, initialPageIndex, project.pages.length, project.pageSetup.widthMm]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const { pageSetup, pages, masterElements, fileName } = project;
  // 1mm = 3.7795px
  const pageWidthPx = pageSetup.widthMm * 3.7795 * previewZoom;
  const pageHeightPx = pageSetup.heightMm * 3.7795 * previewZoom;

  const visiblePages = viewMode === 'single' ? [pages[focusedPageIdx] || pages[0]] : pages;

  return (
    <div
      className="fixed inset-0 z-50 safe-overlay keep-colors flex flex-col bg-slate-900/80 backdrop-blur-[2px] select-none no-print font-modern"
      dir="ltr"
    >
      {/* Top Preview Control Bar */}
      <div className="bg-slate-900 text-white border-b border-slate-700 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Eye className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-sm font-semibold whitespace-nowrap">Print Preview</span>
            <span className="hidden sm:inline text-xs text-slate-400 font-mono truncate max-w-[200px]">
              — {fileName}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="tabular-nums">
              1:1 Scale Locked · {pageSetup.paperSize} ({pageSetup.widthMm}×{pageSetup.heightMm}mm) ·{' '}
              {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
            </span>
          </div>
        </div>

        {/* Center View & Zoom Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar max-w-full">
          <div className="flex items-center bg-slate-800 rounded-md border border-slate-700 p-0.5 text-[11px] shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                viewMode === 'all'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                viewMode === 'single'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Single
            </button>
          </div>

          {viewMode === 'single' && (
            <div className="flex items-center gap-1 bg-slate-800 rounded-md border border-slate-700 px-1.5 py-0.5 text-[11px] shrink-0">
              <button
                type="button"
                disabled={focusedPageIdx <= 0}
                onClick={() => setFocusedPageIdx((p) => Math.max(0, p - 1))}
                className="p-0.5 hover:bg-slate-700 rounded disabled:opacity-35"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono tabular-nums whitespace-nowrap">
                {focusedPageIdx + 1} / {pages.length}
              </span>
              <button
                type="button"
                disabled={focusedPageIdx >= pages.length - 1}
                onClick={() => setFocusedPageIdx((p) => Math.min(pages.length - 1, p + 1))}
                className="p-0.5 hover:bg-slate-700 rounded disabled:opacity-35"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-800 rounded-md border border-slate-700 px-1.5 py-0.5 text-[11px] shrink-0">
            <button
              type="button"
              onClick={() => setPreviewZoom((z) => Math.max(0.3, Number((z - 0.1).toFixed(2))))}
              className="p-1 hover:bg-slate-700 rounded"
              title="Zoom Out Preview"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            {[0.35, 0.5, 0.75, 1.0].map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setPreviewZoom(z)}
                className={`px-1.5 py-0.5 rounded tabular-nums ${
                  Math.abs(previewZoom - z) < 0.03
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                {Math.round(z * 100)}%
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPreviewZoom((z) => Math.min(1.25, Number((z + 0.1).toFixed(2))))}
              className="p-1 hover:bg-slate-700 rounded"
              title="Zoom In Preview"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowMarginGuides((v) => !v)}
            className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors whitespace-nowrap shrink-0 ${
              showMarginGuides
                ? 'bg-pink-600/90 border-pink-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            Guides
          </button>
        </div>

        {/* Right Primary Actions */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onExportDocx}
            className="px-2.5 sm:px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Export Word (.docx)</span>
            <span className="sm:hidden">Word</span>
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            className="px-2.5 sm:px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export PDF (.pdf)</span>
            <span className="sm:hidden">PDF</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              setTimeout(() => onPrint(), 80);
            }}
            className="px-3 sm:px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print (100% Scale)</span>
            <span className="sm:hidden">Print</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Print Preview"
            className="w-8 h-8 rounded-md hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors ml-auto sm:ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Paper Scroll Area */}
      <div className="flex-1 overflow-auto p-3 sm:p-6 md:p-8 flex flex-col items-center gap-6 sm:gap-8">
        {visiblePages.map((pg) => (
          <div key={pg.id} className="flex flex-col items-center gap-2">
            <div className="text-[11px] font-mono text-slate-300 tabular-nums">
              Page {pg.pageNumber} of {pages.length}
            </div>
            <div
              className="shadow-[0_18px_45px_rgba(0,0,0,0.45)] ring-1 ring-white/20 bg-white overflow-hidden"
              style={{
                width: `${pageWidthPx}px`,
                height: `${pageHeightPx}px`,
              }}
            >
              <div
                style={{
                  transform: `scale(${previewZoom})`,
                  transformOrigin: 'top left',
                }}
              >
                <PrintablePageView
                  page={pg}
                  pageSetup={pageSetup}
                  masterElements={masterElements}
                  showGuides={showMarginGuides}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
