import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ZoomIn,
  ZoomOut,
  Globe,
  Plus,
} from 'lucide-react';
import { ToolType, KeyboardLayout, PageSetup } from '../types/inpage';
import { MasterPageToolIcon } from './DtpIcons';

interface StatusBarProps {
  currentPage: number;
  totalPages: number;
  pageSetup: PageSetup;
  onPageChange: (newPage: number) => void;
  onAddPage: () => void;
  isMasterPage: boolean;
  onToggleMasterPage: () => void;
  activeTool: ToolType;
  cursorX: number;
  cursorY: number;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onFitZoom?: () => void;
  language: 'urdu' | 'english';
  keyboardLayout: KeyboardLayout;
  onCycleKeyboardLayout: () => void;
  onToggleLanguage: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  currentPage,
  totalPages,
  pageSetup,
  onPageChange,
  onAddPage,
  isMasterPage,
  onToggleMasterPage,
  activeTool,
  cursorX,
  cursorY,
  zoom,
  onZoomChange,
  onFitZoom,
  language,
  keyboardLayout,
  onCycleKeyboardLayout,
  onToggleLanguage,
}) => {
  const toolNames: Record<ToolType, string> = {
    pick: 'Arrow Tool (Pick)',
    text: 'I-Beam Text Tool',
    rotate: 'Rotation Tool',
    link: 'Link Text Frames',
    delink: 'Delink Text Frames',
    textBox: 'Standard Text Box',
    titleBox: 'Title Box Tool',
    picRect: 'Rect Picture Box',
    picOval: 'Oval Picture Box',
    picRound: 'Rounded Picture Box',
    graphic: 'Graphic Shape Tool',
    line: 'Line Tool',
    table: 'Table Tool',
  };

  const zoomLevels = [0.35, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  const navBtnClass =
    'w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none modern-icon-btn text-slate-700';

  return (
    <div
      className="min-h-8 py-0.5 px-2 sm:px-2.5 flex items-center justify-between gap-2 text-[11px] select-none shrink-0 z-30 no-print bg-white border-t border-slate-200 text-slate-700 font-modern overflow-x-auto no-scrollbar pb-safe"
      dir="ltr"
    >
      {/* Left: Page Navigator & Master Page */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onToggleMasterPage}
          title="Master Page (F12)"
          className={`px-2 h-6 sm:h-5 font-bold text-[10px] flex items-center gap-1 whitespace-nowrap rounded ${
            isMasterPage ? 'bg-amber-600 text-white shadow-xs' : 'modern-btn text-slate-700'
          }`}
        >
          <MasterPageToolIcon className="w-3 h-3 shrink-0" />
          <span className="hidden sm:inline">{isMasterPage ? 'Master Mode' : 'M'}</span>
          <span className="sm:hidden">{isMasterPage ? 'Master' : 'M'}</span>
        </button>

        <div className="flex items-center gap-0.5 px-1 py-0.5 border border-slate-200 rounded-md bg-slate-50">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1 || isMasterPage}
            title="First Page"
            aria-label="First Page"
            className={`hidden sm:flex ${navBtnClass}`}
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isMasterPage}
            title="Previous Page"
            aria-label="Previous Page"
            className={navBtnClass}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono tabular-nums px-1.5 sm:px-2 whitespace-nowrap text-[11px]">
            <span className="hidden sm:inline">Page </span>
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isMasterPage}
            title="Next Page"
            aria-label="Next Page"
            className={navBtnClass}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages || isMasterPage}
            title="Last Page"
            aria-label="Last Page"
            className={`hidden sm:flex ${navBtnClass}`}
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onAddPage}
            disabled={isMasterPage}
            title="Add New Page"
            aria-label="Add New Page"
            className="w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center text-blue-600 disabled:opacity-30 ml-0.5 modern-icon-btn"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="hidden lg:inline text-[10px] text-slate-400 font-mono tabular-nums pl-1 whitespace-nowrap">
          {pageSetup.paperSize} · {pageSetup.widthMm}×{pageSetup.heightMm}mm
        </span>
      </div>

      {/* Center: Active Tool & Coordinates */}
      <div className="hidden md:flex items-center gap-3 shrink-0">
        <span className="text-slate-500 truncate max-w-[180px]">
          Tool: <strong className="text-slate-900">{toolNames[activeTool]}</strong>
        </span>

        <span className="font-mono tabular-nums text-[10px] px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-slate-600">
          X: {cursorX.toFixed(1)}mm &nbsp; Y: {cursorY.toFixed(1)}mm
        </span>
      </div>

      {/* Right: Language Indicator, Layout Cycle & Zoom */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {language === 'urdu' && (
          <button
            type="button"
            onClick={onCycleKeyboardLayout}
            title="Switch Urdu Keyboard Layout (Phonetic / Monotype / Muqtadira)"
            className="hidden sm:inline-flex px-1.5 h-5 text-[9px] font-mono uppercase tracking-wide modern-btn text-slate-600 items-center"
          >
            {keyboardLayout}
          </button>
        )}

        <button
          type="button"
          onClick={onToggleLanguage}
          title="Toggle Urdu / English Keyboard (Ctrl + Space)"
          className={`flex items-center gap-1 px-2 h-6 sm:h-5 border text-[10px] font-bold whitespace-nowrap overflow-hidden transition-colors rounded-md ${
            language === 'urdu'
              ? 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-800'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
          }`}
        >
          <Globe className="w-3 h-3 shrink-0" />
          <span className="font-arabic-sans text-[11px] leading-normal">
            {language === 'urdu' ? 'اردو' : 'EN'}
          </span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              onZoomChange(
                Math.max(0.35, Number((zoom - (zoom <= 0.75 ? 0.15 : 0.25)).toFixed(2)))
              )
            }
            title="Zoom Out"
            aria-label="Zoom Out"
            className="w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center text-slate-700 modern-icon-btn"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <select
            value={zoomLevels.includes(zoom) ? zoom : ''}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="bg-white text-[10px] px-1 sm:px-1.5 h-6 sm:h-5 tabular-nums font-mono border border-slate-300 rounded-md"
            title="Canvas Zoom (or Ctrl + Mouse Wheel)"
          >
            {!zoomLevels.includes(zoom) && (
              <option value="">{Math.round(zoom * 100)}%</option>
            )}
            {zoomLevels.map((z) => (
              <option key={z} value={z}>
                {Math.round(z * 100)}%
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() =>
              onZoomChange(
                Math.min(2.5, Number((zoom + (zoom < 0.75 ? 0.15 : 0.25)).toFixed(2)))
              )
            }
            title="Zoom In"
            aria-label="Zoom In"
            className="w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center text-slate-700 modern-icon-btn"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => (onFitZoom ? onFitZoom() : onZoomChange(0.75))}
            title="Fit Page Width in Screen (F5)"
            className="inline-flex px-2 sm:px-1.5 h-6 sm:h-5 items-center text-[10px] font-medium modern-btn text-slate-700"
          >
            Fit
          </button>
        </div>

        <span className="hidden xl:inline font-mono text-[10px] tracking-wide text-slate-400 pl-1">
          v1.0
        </span>
      </div>
    </div>
  );
};
