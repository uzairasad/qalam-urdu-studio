import React from 'react';
import { APP_VERSION } from '../appInfo';
import { isNativeApp } from '../platform/native';
import {
  Minus,
  X,
  Printer,
  Save,
  FolderOpen,
  FilePlus,
  Download,
  Maximize2,
  Undo2,
  Redo2,
  Pencil,
  BookOpen,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { QalamBrandEmblem } from './DtpIcons';

interface TitleBarProps {
  fileName: string;
  isModified: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onPrintPreview: () => void;
  onPrint: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onRenameDocument: () => void;
  onOpenDictionary: () => void;
  language: 'urdu' | 'english';
  onToggleLanguage: () => void;
  onCloseApp: () => void;
  onOpenDownload: () => void;
  /** Set when a newer version was found: shows an "Update" button that opens the About box. */
  update?: { version: string | null } | null;
  onOpenUpdate?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  fileName,
  isModified,
  canUndo,
  canRedo,
  onNew,
  onOpen,
  onSave,
  onPrintPreview,
  onPrint,
  onUndo,
  onRedo,
  onRenameDocument,
  onOpenDictionary,
  language,
  onToggleLanguage,
  onCloseApp,
  onOpenDownload,
  update,
  onOpenUpdate,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen denial inside restricted iframes
    }
  };

  const quickBtnClass =
    'w-8 h-7 md:w-7 md:h-6 flex items-center justify-center hover:bg-slate-700/80 active:bg-slate-700 rounded text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors touch-manipulation';

  return (
    <header
      className="h-11 md:h-10 px-2 md:px-2.5 grid grid-cols-[auto_minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 md:gap-2 select-none no-print shrink-0 bg-slate-900 text-slate-100 border-b border-slate-800 font-modern text-xs"
      dir="ltr"
    >
      {/* Left Zone: Brand + Quick Access Toolbar */}
      <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <div className="w-6 h-6 flex items-center justify-center shrink-0 overflow-hidden bg-blue-600 text-white rounded-md shadow-xs">
            <QalamBrandEmblem className="w-5 h-5" />
          </div>
          <span className="font-semibold tracking-tight whitespace-nowrap text-white sm:hidden">
            Qalam
          </span>
          <span className="font-semibold tracking-tight whitespace-nowrap text-white hidden sm:inline">
            Qalam Urdu Studio
          </span>
          <span className="text-slate-500 text-[11px] font-mono hidden xl:inline">
            v{APP_VERSION}
          </span>
        </div>

        <div className="hidden md:block w-px h-4 bg-slate-700/80 mx-0.5 shrink-0" />

        {/* Mobile Quick Actions (Undo / Redo / Save) */}
        <div className="flex md:hidden items-center gap-0.5 px-0.5 py-0.5 bg-slate-800/75 rounded-md border border-slate-700/70 shrink-0">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
            aria-label="Undo"
            className={quickBtnClass}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
            aria-label="Redo"
            className={quickBtnClass}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onSave}
            title="Save Document (.qlm)"
            aria-label="Save Document"
            className={quickBtnClass}
          >
            <Save className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Desktop Quick Access Toolbar */}
        <div className="hidden md:flex items-center gap-0.5 px-1 py-0.5 bg-slate-800/75 rounded-md border border-slate-700/70 shrink-0">
          <button
            type="button"
            onClick={onNew}
            title="New Blank Document Tab (Ctrl+N)"
            aria-label="New Document Tab"
            className={quickBtnClass}
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onOpen}
            title="Open Document in New Tab (.qlm / .inp / .docx / .pdf / .txt) (Ctrl+O)"
            aria-label="Open Document"
            className={quickBtnClass}
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onSave}
            title="Save Document (.qlm) (Ctrl+S)"
            aria-label="Save Document"
            className={quickBtnClass}
          >
            <Save className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3.5 bg-slate-700 mx-0.5" />
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
            className={quickBtnClass}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
            className={quickBtnClass}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3.5 bg-slate-700 mx-0.5" />
          <button
            type="button"
            onClick={onPrintPreview}
            title="Print Preview"
            aria-label="Print Preview"
            className={quickBtnClass}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onPrint}
            title="Print Document (Ctrl+P)"
            aria-label="Print Document"
            className={quickBtnClass}
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center Zone: Active Document Title */}
      <div className="flex items-center justify-center min-w-0">
        <button
          type="button"
          onClick={onRenameDocument}
          title="Click to rename document or configure page setup"
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-md bg-slate-800/75 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white text-[11px] max-w-full sm:max-w-[240px] lg:max-w-[340px] transition-colors touch-manipulation"
        >
          <span className="truncate font-medium">
            {fileName}
            {isModified ? ' *' : ''}
          </span>
          <Pencil className="w-3 h-3 text-slate-400 shrink-0 hidden sm:inline" />
        </button>
      </div>

      {/* Right Zone: Dictionary, Language, Download & Window Controls */}
      <div className="flex items-center justify-end gap-1 sm:gap-1.5 min-w-0">
        <button
          type="button"
          onClick={onOpenDictionary}
          title="Urdu Dictionary & Thesaurus (F10)"
          className="px-2 sm:px-2.5 h-7 text-[11px] font-medium flex items-center gap-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition-colors whitespace-nowrap shrink-0 touch-manipulation"
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="hidden lg:inline">Dictionary</span>
          <span className="font-arabic-sans text-[12px] text-emerald-300 leading-normal hidden sm:inline">
            لغت
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleLanguage}
          title="Toggle Urdu / English typing (Ctrl + Space)"
          className={`px-2 sm:px-2.5 h-7 text-[11px] font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap rounded-md shrink-0 touch-manipulation ${
            language === 'urdu'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          <span className="font-arabic-sans text-[12px] leading-normal">
            {language === 'urdu' ? 'اردو' : 'EN'}
          </span>
          <span className="text-[10px] opacity-85 hidden sm:inline">
            {language.toUpperCase()}
          </span>
        </button>

        {update && onOpenUpdate && (
          <button
            type="button"
            onClick={onOpenUpdate}
            title={update.version ? `Qalam Urdu Studio ${update.version} is available` : 'A new version is available'}
            className="px-2 sm:px-2.5 h-7 font-semibold text-[11px] flex items-center gap-1.5 transition-colors whitespace-nowrap bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-md shadow-xs shrink-0 touch-manipulation"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Update{update.version ? ` ${update.version}` : ''}</span>
          </button>
        )}

        {!isNativeApp() && (
        <button
          type="button"
          onClick={onOpenDownload}
          title="Add as Web App or Download Portable Single HTML"
          className="px-2 sm:px-2.5 h-7 font-semibold text-[11px] flex items-center gap-1.5 transition-colors whitespace-nowrap bg-blue-600 hover:bg-blue-500 text-white rounded-md shadow-xs shrink-0 touch-manipulation"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">Get App</span>
        </button>
        )}

        <div className="w-px h-4 bg-slate-700/80 mx-0.5 hidden sm:block shrink-0" />

        <button
          type="button"
          onClick={handleToggleFullscreen}
          title="Toggle Fullscreen Window"
          aria-label="Toggle Fullscreen"
          className="hidden sm:flex w-7 h-7 hover:bg-slate-800 text-slate-300 hover:text-white items-center justify-center rounded transition-colors shrink-0"
        >
          {isFullscreen ? <Minus className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onClick={onCloseApp}
          title="Reset / Reload Workspace"
          aria-label="Reset Workspace"
          className="w-7 h-7 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center rounded transition-colors shrink-0 touch-manipulation"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
