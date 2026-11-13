import React, { useState, useRef, useEffect } from 'react';
import { isNativeApp } from '../platform/native';
import {
  Bold,
  Italic,
  Underline,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  Keyboard,
  Trash2,
  Copy,
  CopyPlus,
  Scissors,
  FileText,
  FilePlus,
  FileOutput,
  FileDown,
  FolderOpen,
  Save,
  Download,
  Printer,
  Sliders,
  Image as ImageIcon,
  FileCode,
  Info,
  LogOut,
  Lock,
  Unlock,
  RotateCw,
  ArrowUpToLine,
  ArrowDownToLine,
  PaintBucket,
  Palette,
  Check,
  Columns,
  AlignHorizontalSpaceAround,
  Maximize2,
  Search,
  Type,
  Layers,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Grid,
  Ruler,
  Eye,
  ZoomIn,
  ZoomOut,
  Scan,
  Home,
  PlusSquare,
  LayoutTemplate,
  Languages,
  Square,
} from 'lucide-react';
import {
  DocElement,
  TextElement,
  GraphicElement,
  TableElement,
  PictureElement,
  LineElement,
  PageSetup,
  KeyboardLayout,
} from '../types/inpage';
import { URDU_FONT_OPTIONS } from '../utils/fonts';
import { TEMPLATES } from '../utils/templates';
import {
  CalligraphyNibIcon,
  TransparentSwatchIcon,
  RtlDirectionIcon,
  LtrDirectionIcon,
  TextBoxToolIcon,
  TitleBoxToolIcon,
  PicRectToolIcon,
  PicRoundToolIcon,
  PicOvalToolIcon,
  GraphicShapeToolIcon,
  LineToolIcon,
  TableToolIcon,
  MasterPageToolIcon,
  PasteRibbonIcon,
  StoryEditorRibbonIcon,
  UrduDictionaryRibbonIcon,
  AddPageRibbonIcon,
  PageSetupRibbonIcon,
  PageNumberRibbonIcon,
  LineSpacingRibbonIcon,
  CharScaleRibbonIcon,
  FitBoxHeightRibbonIcon,
  UrduDigitsRibbonIcon,
  StripAraabRibbonIcon,
  WordCountRibbonIcon,
  TableAddRowIcon,
  TableDelRowIcon,
  TableAddColIcon,
  TableDelColIcon,
  TableHeaderShadeIcon,
  BorderWidthIcon,
  BorderStyleIcon,
} from './DtpIcons';

export type RibbonTabId = 'home' | 'insert' | 'layout' | 'urdu' | 'view' | 'context';

interface RibbonToolbarProps {
  selectedElement: DocElement | null;
  onUpdateElement: (updated: Partial<DocElement>) => void;
  pageSetup: PageSetup;
  zoom: number;
  onSetZoom: (zoom: number) => void;
  showGuides: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  showRibbon: boolean;
  isMasterPage: boolean;
  onToggleGuides: () => void;
  onToggleRulers: () => void;
  onToggleSnapGrid: () => void;
  onToggleRibbon: () => void;
  onToggleMasterPage: () => void;
  language: 'urdu' | 'english';
  keyboardLayout: KeyboardLayout;
  onToggleLanguage: () => void;
  onChangeKeyboardLayout: (layout: KeyboardLayout) => void;
  hasClipboard: boolean;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onCenterHorizontal: () => void;
  onFitTextBox: () => void;
  onTableAction: (action: 'addRow' | 'delRow' | 'addCol' | 'delCol' | 'toggleHeader') => void;
  onInsertElement: (type: string) => void;
  onInsertPageNumberToken: () => void;
  onAddPage: () => void;
  onDuplicatePage: () => void;
  onDeletePage: () => void;
  onConvertNumbersToUrdu: () => void;
  onStripDiacritics: () => void;
  onApplyDefaultFont: (fontFamily: string) => void;
  // File & Dialog actions
  onNewBlankTab: () => void;
  onNewTemplateTab: (templateId: string) => void;
  onOpen: () => void;
  onOpenWord: () => void;
  onOpenPdf: () => void;
  onOpenTxt: () => void;
  onSave: () => void;
  onSaveAsInp: () => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
  onExportTxt: () => void;
  onExportHtml: () => void;
  onExportImage: () => void;
  onPrintPreview: () => void;
  onPrint: () => void;
  onOpenDocSetup: () => void;
  onOpenKeyboard: () => void;
  onOpenSymbols: () => void;
  onOpenStoryEditor: () => void;
  onOpenFindReplace: () => void;
  onOpenWordCount: () => void;
  onOpenDictionary: () => void;
  onOpenDownload: () => void;
  onOpenAbout: () => void;
  onExit: () => void;
}

export const RibbonToolbar: React.FC<RibbonToolbarProps> = ({
  selectedElement,
  onUpdateElement,
  pageSetup,
  zoom,
  onSetZoom,
  showGuides,
  showRulers,
  snapToGrid,
  showRibbon,
  isMasterPage,
  onToggleGuides,
  onToggleRulers,
  onToggleSnapGrid,
  onToggleRibbon,
  onToggleMasterPage,
  language,
  keyboardLayout,
  onToggleLanguage,
  onChangeKeyboardLayout,
  hasClipboard,
  onCut,
  onCopy,
  onPaste,
  onDuplicateSelected,
  onDeleteSelected,
  onBringToFront,
  onSendToBack,
  onCenterHorizontal,
  onFitTextBox,
  onTableAction,
  onInsertElement,
  onInsertPageNumberToken,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onConvertNumbersToUrdu,
  onStripDiacritics,
  onApplyDefaultFont,
  onNewBlankTab,
  onNewTemplateTab,
  onOpen,
  onOpenWord,
  onOpenPdf,
  onOpenTxt,
  onSave,
  onSaveAsInp,
  onExportPdf,
  onExportDocx,
  onExportTxt,
  onExportHtml,
  onExportImage,
  onPrintPreview,
  onPrint,
  onOpenDocSetup,
  onOpenKeyboard,
  onOpenSymbols,
  onOpenStoryEditor,
  onOpenFindReplace,
  onOpenWordCount,
  onOpenDictionary,
  onOpenDownload,
  onOpenAbout,
  onExit,
}) => {
  const [activeTab, setActiveTab] = useState<RibbonTabId>('home');
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [activeFileSubmenu, setActiveFileSubmenu] = useState<
    'templates' | 'openFrom' | 'exportAs' | null
  >(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);

  const isText = selectedElement?.type === 'text';
  const isTable = selectedElement?.type === 'table';
  const isPicture = selectedElement?.type === 'picture';
  const isGraphic = selectedElement?.type === 'graphic';
  const isLine = selectedElement?.type === 'line';

  const textElem = isText ? (selectedElement as TextElement) : null;
  const tableElem = isTable ? (selectedElement as TableElement) : null;
  const picElem = isPicture ? (selectedElement as PictureElement) : null;
  const graphicElem = isGraphic ? (selectedElement as GraphicElement) : null;
  const lineElem = isLine ? (selectedElement as LineElement) : null;
  const typableElem = textElem || tableElem;

  const hasContextTab = isTable || isPicture || isGraphic || isLine;
  const contextTabLabel = isTable
    ? 'Table Format'
    : isPicture
    ? 'Picture Format'
    : isGraphic
    ? 'Shape Format'
    : isLine
    ? 'Line Format'
    : '';

  useEffect(() => {
    if (!hasContextTab && activeTab === 'context') {
      setActiveTab('home');
    }
  }, [hasContextTab, activeTab]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setFileMenuOpen(false);
        setActiveFileSubmenu(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFileMenuOpen(false);
        setActiveFileSubmenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const fontSizeOptions = [
    7.5, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28, 32, 36, 42, 48, 60, 72,
  ];
  const fontCategories = [
    'Nastaliq',
    'Naskh & Quranic',
    'Calligraphy & Display',
    'Sans & Modern',
    'Latin',
  ] as const;

  const presetColors = [
    '#000000',
    '#0f2942',
    '#8b0000',
    '#047857',
    '#b45309',
    '#4c1d95',
    '#4b5563',
    '#ffffff',
  ];

  const selectClass =
    'bg-white border border-slate-200 hover:border-slate-300 px-2 h-6.5 text-xs rounded-md text-slate-800 disabled:opacity-40 focus:outline-none focus:border-blue-500 transition-colors shadow-2xs';

  const groupBoxClass =
    'flex items-center border border-slate-200 rounded-md bg-white p-0.5 gap-0.5 shadow-2xs';

  const iconBtnClass = (active: boolean) =>
    `w-6.5 h-6 flex items-center justify-center shrink-0 disabled:opacity-35 disabled:pointer-events-none ${
      active ? 'modern-icon-btn-active rounded' : 'modern-icon-btn text-slate-700'
    }`;

  const ribbonBtnClass = (active = false) =>
    `px-2 h-7 text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-35 disabled:pointer-events-none ${
      active ? 'modern-btn-active' : 'modern-btn text-slate-700'
    }`;

  const tallBtnClass = (active = false) =>
    `px-2.5 py-1 min-w-[58px] h-[54px] flex flex-col items-center justify-center gap-1 text-[11px] font-medium whitespace-nowrap shrink-0 rounded-md border transition-colors disabled:opacity-35 disabled:pointer-events-none ${
      active
        ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs'
        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 shadow-2xs'
    }`;

  const activeColor =
    textElem?.color || tableElem?.color || lineElem?.color || selectedElement?.borderColor;

  const tabs: { id: RibbonTabId; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-3.5 h-3.5" /> },
    { id: 'insert', label: 'Insert', icon: <PlusSquare className="w-3.5 h-3.5" /> },
    { id: 'layout', label: 'Layout', icon: <LayoutTemplate className="w-3.5 h-3.5" /> },
    { id: 'urdu', label: 'Urdu & Tools', icon: <Languages className="w-3.5 h-3.5" /> },
    { id: 'view', label: 'View', icon: <Eye className="w-3.5 h-3.5" /> },
  ];

  const handleTabClick = (tabId: RibbonTabId) => {
    setActiveTab(tabId);
    if (!showRibbon) onToggleRibbon();
  };

  const renderGroup = (label: string, children: React.ReactNode) => (
    <div className="flex flex-col justify-between shrink-0 px-1">
      <div className="flex items-center gap-1.5 min-h-[50px]">{children}</div>
      <div className="text-[10px] text-slate-400 font-medium text-center leading-none pt-1 tracking-tight">
        {label}
      </div>
    </div>
  );

  const groupDivider = <div className="w-px self-stretch bg-slate-200 my-1 shrink-0" />;

  const fileItemClass =
    'w-full text-left px-2.5 py-2 md:py-1.5 flex items-center justify-between text-xs group rounded-md text-slate-700 hover:bg-blue-600 hover:text-white transition-colors touch-manipulation';

  const handleDesktopSubmenuHover = (
    submenu: 'templates' | 'openFrom' | 'exportAs' | null
  ) => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches
    ) {
      setActiveFileSubmenu(submenu);
    }
  };

  return (
    <div className="select-none no-print shrink-0 font-modern relative z-40" dir="ltr">
      {/* 1. Microsoft Word-style Top Tab Strip (File pinned outside scroll so dropdown never clips) */}
      <div className="h-9 md:h-8 px-2 bg-slate-100 border-b border-slate-200 flex items-end justify-between gap-1.5">
        <div className="flex items-end gap-0.5 pt-1 flex-1 min-w-0">
          {/* Blue File Accent Button + Clean Categorized Dropdown */}
          <div className="relative mr-1 shrink-0" ref={fileMenuRef}>
            <button
              type="button"
              onClick={() => {
                setFileMenuOpen((prev) => {
                  if (prev) setActiveFileSubmenu(null);
                  return !prev;
                });
              }}
              className={`h-7 px-3 text-xs font-semibold rounded-t-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                fileMenuOpen
                  ? 'bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 opacity-90" />
              <span>File</span>
              <ChevronDown className="w-3 h-3 opacity-85" />
            </button>

            {fileMenuOpen && (
              <div
                onMouseLeave={() => handleDesktopSubmenuHover(null)}
                className="absolute left-0 top-full mt-0.5 w-[min(280px,calc(100vw-16px))] md:w-64 max-h-[75dvh] overflow-y-auto md:overflow-visible z-50 bg-white border border-slate-200 rounded-lg shadow-xl p-1.5 text-slate-700"
              >
                {/* Document Actions */}
                <button
                  type="button"
                  onMouseEnter={() => handleDesktopSubmenuHover(null)}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onNewBlankTab();
                  }}
                  className={fileItemClass}
                >
                  <span className="flex items-center gap-2">
                    <FilePlus className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors" />
                    <span>New Blank Tab</span>
                  </span>
                  <span className="hidden sm:inline text-[10px] text-slate-400 group-hover:text-white/90 font-mono">
                    Ctrl+N
                  </span>
                </button>

                {/* Flyout / Mobile Accordion: New from Template */}
                <div
                  className="relative"
                  onMouseEnter={() => handleDesktopSubmenuHover('templates')}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setActiveFileSubmenu((prev) =>
                        prev === 'templates' ? null : 'templates'
                      )
                    }
                    className={`${fileItemClass} ${
                      activeFileSubmenu === 'templates' ? 'bg-blue-600 text-white' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <LayoutTemplate
                        className={`w-4 h-4 transition-colors ${
                          activeFileSubmenu === 'templates'
                            ? 'text-white'
                            : 'text-indigo-600 group-hover:text-white'
                        }`}
                      />
                      <span>New from Template</span>
                    </span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        activeFileSubmenu === 'templates'
                          ? 'rotate-90 md:rotate-0 text-white'
                          : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                  </button>

                  {activeFileSubmenu === 'templates' && (
                    <div className="mt-1 mb-1 pl-2 border-l border-slate-200 md:mt-0 md:mb-0 md:border-l-0 md:absolute md:left-full md:top-0 md:pl-1 z-50">
                      <div className="bg-slate-50/90 md:bg-white md:w-56 md:border md:border-slate-200 rounded-lg md:shadow-xl p-1 md:p-1.5">
                        <div className="hidden md:block px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Document Templates
                        </div>
                        {TEMPLATES.map((tpl) => (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => {
                              setFileMenuOpen(false);
                              setActiveFileSubmenu(null);
                              onNewTemplateTab(tpl.id);
                            }}
                            className={fileItemClass}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <LayoutTemplate className="w-3.5 h-3.5 text-blue-500 group-hover:text-white shrink-0 transition-colors" />
                              <span className="truncate">{tpl.name}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onMouseEnter={() => handleDesktopSubmenuHover(null)}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onOpen();
                  }}
                  className={fileItemClass}
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-amber-600 group-hover:text-white transition-colors" />
                    <span>Open File...</span>
                  </span>
                  <span className="hidden sm:inline text-[10px] text-slate-400 group-hover:text-white/90 font-mono">
                    Ctrl+O
                  </span>
                </button>

                {/* Flyout / Mobile Accordion: Open From */}
                <div
                  className="relative"
                  onMouseEnter={() => handleDesktopSubmenuHover('openFrom')}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setActiveFileSubmenu((prev) =>
                        prev === 'openFrom' ? null : 'openFrom'
                      )
                    }
                    className={`${fileItemClass} ${
                      activeFileSubmenu === 'openFrom' ? 'bg-blue-600 text-white' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FileText
                        className={`w-4 h-4 transition-colors ${
                          activeFileSubmenu === 'openFrom'
                            ? 'text-white'
                            : 'text-sky-600 group-hover:text-white'
                        }`}
                      />
                      <span>Open From</span>
                    </span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        activeFileSubmenu === 'openFrom'
                          ? 'rotate-90 md:rotate-0 text-white'
                          : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                  </button>

                  {activeFileSubmenu === 'openFrom' && (
                    <div className="mt-1 mb-1 pl-2 border-l border-slate-200 md:mt-0 md:mb-0 md:border-l-0 md:absolute md:left-full md:top-0 md:pl-1 z-50">
                      <div className="bg-slate-50/90 md:bg-white md:w-60 md:border md:border-slate-200 rounded-lg md:shadow-xl p-1 md:p-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setFileMenuOpen(false);
                            setActiveFileSubmenu(null);
                            onOpenWord();
                          }}
                          className={fileItemClass}
                        >
                          <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors" />
                            <span>Word Document (.docx)...</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFileMenuOpen(false);
                            setActiveFileSubmenu(null);
                            onOpenPdf();
                          }}
                          className={fileItemClass}
                        >
                          <span className="flex items-center gap-2">
                            <FileDown className="w-4 h-4 text-rose-600 group-hover:text-white transition-colors" />
                            <span>PDF Document (.pdf)...</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFileMenuOpen(false);
                            setActiveFileSubmenu(null);
                            onOpenTxt();
                          }}
                          className={fileItemClass}
                        >
                          <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                            <span>Plain Text (.txt)...</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFileMenuOpen(false);
                            setActiveFileSubmenu(null);
                            onOpen();
                          }}
                          className={fileItemClass}
                        >
                          <span className="flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-amber-600 group-hover:text-white transition-colors" />
                            <span>Qalam / InPage (.qlm / .inp)...</span>
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="my-1 border-t border-slate-100" />

                {/* Save & Export */}
                <button
                  type="button"
                  onMouseEnter={() => handleDesktopSubmenuHover(null)}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onSave();
                  }}
                  className={fileItemClass}
                >
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4 text-emerald-600 group-hover:text-white transition-colors" />
                    <span>Save Project (.qlm)</span>
                  </span>
                  <span className="hidden sm:inline text-[10px] text-slate-400 group-hover:text-white/90 font-mono">
                    Ctrl+S
                  </span>
                </button>

                <button
                  type="button"
                  onMouseEnter={() => handleDesktopSubmenuHover(null)}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onSaveAsInp();
                  }}
                  className={fileItemClass}
                >
                  <span className="flex items-center gap-2">
                    <FileOutput className="w-4 h-4 text-indigo-600 group-hover:text-white transition-colors" />
                    <span>Save As InPage (.inp)...</span>
                  </span>
                </button>

                {/* Flyout / Mobile Accordion: Export As */}
                <div
                  className="relative"
                  onMouseEnter={() => handleDesktopSubmenuHover('exportAs')}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setActiveFileSubmenu((prev) =>
                        prev === 'exportAs' ? null : 'exportAs'
                      )
                    }
                    className={`${fileItemClass} ${
                      activeFileSubmenu === 'exportAs' ? 'bg-blue-600 text-white' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FileDown
                        className={`w-4 h-4 transition-colors ${
                          activeFileSubmenu === 'exportAs'
                            ? 'text-white'
                            : 'text-rose-600 group-hover:text-white'
                        }`}
                      />
                      <span>Export As</span>
                    </span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        activeFileSubmenu === 'exportAs'
                          ? 'rotate-90 md:rotate-0 text-white'
                          : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                  </button>

                  {activeFileSubmenu === 'exportAs' && (
                    <div className="mt-1 mb-1 pl-2 border-l border-slate-200 md:mt-0 md:mb-0 md:border-l-0 md:absolute md:left-full md:top-0 md:pl-1 z-50">
                      <div className="bg-slate-50/90 md:bg-white md:w-60 md:border md:border-slate-200 rounded-lg md:shadow-xl p-1 md:p-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setFileMenuOpen(false);
                            setActiveFileSubmenu(null);
                            onExportPdf();
                          }}
                          className={fileItemClass}
                        >
                          <span className="flex items-center gap-2">
                            <FileDown className="w-4 h-4 text-rose-600 group-hover:text-white transition-colors" />
                            <span>PDF Document (.pdf)</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFileMenuOpen(false);
                            setActiveFileSubmenu(null);
                            onExportDocx();
                          }}
                          className={fileItemClass}
                        >
                          <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors" />
                            <span>Word Document (.docx)</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFileMenuOpen(false);
                            setActiveFileSubmenu(null);
                            onExportTxt();
                          }}
                          className={fileItemClass}
                        >
                          <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                            <span>Plain Text (.txt)</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFileMenuOpen(false);
                            setActiveFileSubmenu(null);
                            onExportHtml();
                          }}
                          className={fileItemClass}
                        >
                          <span className="flex items-center gap-2">
                            <FileCode className="w-4 h-4 text-violet-600 group-hover:text-white transition-colors" />
                            <span>Unicode Web Page (.html)</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFileMenuOpen(false);
                            setActiveFileSubmenu(null);
                            onExportImage();
                          }}
                          className={fileItemClass}
                        >
                          <span className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-emerald-600 group-hover:text-white transition-colors" />
                            <span>Page Image (.png)</span>
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="my-1 border-t border-slate-100" />

                {/* Print & Page Setup */}
                <button
                  type="button"
                  onMouseEnter={() => handleDesktopSubmenuHover(null)}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onOpenDocSetup();
                  }}
                  className={fileItemClass}
                >
                  <span className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                    <span>Document Setup...</span>
                  </span>
                </button>
                <button
                  type="button"
                  onMouseEnter={() => handleDesktopSubmenuHover(null)}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onPrintPreview();
                  }}
                  className={fileItemClass}
                >
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-600 group-hover:text-white transition-colors" />
                    <span>Print Preview...</span>
                  </span>
                </button>
                <button
                  type="button"
                  onMouseEnter={() => handleDesktopSubmenuHover(null)}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onPrint();
                  }}
                  className={fileItemClass}
                >
                  <span className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-slate-700 group-hover:text-white transition-colors" />
                    <span>Print...</span>
                  </span>
                  <span className="hidden sm:inline text-[10px] text-slate-400 group-hover:text-white/90 font-mono">
                    Ctrl+P
                  </span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                {/* App & Workspace (web only: the desktop app is already installed) */}
                {!isNativeApp() && (
                <button
                  type="button"
                  onMouseEnter={() => handleDesktopSubmenuHover(null)}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onOpenDownload();
                  }}
                  className={fileItemClass}
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors" />
                    <span>Add Web App / Single HTML...</span>
                  </span>
                </button>
                )}
                <button
                  type="button"
                  onMouseEnter={() => handleDesktopSubmenuHover(null)}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onOpenAbout();
                  }}
                  className={fileItemClass}
                >
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-sky-600 group-hover:text-white transition-colors" />
                    <span>About Qalam Urdu Studio</span>
                  </span>
                </button>
                <button
                  type="button"
                  onMouseEnter={() => handleDesktopSubmenuHover(null)}
                  onClick={() => {
                    setFileMenuOpen(false);
                    onExit();
                  }}
                  className={fileItemClass}
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-rose-600 group-hover:text-white transition-colors" />
                    <span>Reset Workspace</span>
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Standard Word-style Tabs (horizontally scrollable on narrow screens) */}
          <div className="flex-1 min-w-0 flex items-end gap-0.5 overflow-x-auto no-scrollbar touch-pan-x">
            {tabs.map((tab) => {
              const isActive = showRibbon && activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={`h-7 px-2.5 text-xs rounded-t-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 touch-manipulation ${
                    isActive
                      ? 'bg-white text-blue-700 font-semibold border border-b-0 border-slate-200 relative -mb-px pb-px'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 font-medium'
                  }`}
                >
                  <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* Contextual Format Tab (Word-style) */}
            {hasContextTab && (
              <button
                type="button"
                onClick={() => handleTabClick('context')}
                className={`h-7 px-2.5 text-xs rounded-t-md flex items-center gap-1.5 transition-colors whitespace-nowrap ml-1 shrink-0 touch-manipulation ${
                  showRibbon && activeTab === 'context'
                    ? 'bg-white text-emerald-700 font-semibold border border-b-0 border-emerald-300 relative -mb-px pb-px'
                    : 'text-emerald-700 bg-emerald-50/90 hover:bg-emerald-100 border border-b-0 border-emerald-200 font-semibold'
                }`}
              >
                {isTable ? (
                  <TableToolIcon className="w-3.5 h-3.5" />
                ) : isPicture ? (
                  <PicRectToolIcon className="w-3.5 h-3.5" />
                ) : isGraphic ? (
                  <GraphicShapeToolIcon className="w-3.5 h-3.5" />
                ) : (
                  <LineToolIcon className="w-3.5 h-3.5" />
                )}
                <span>{contextTabLabel}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Controls: Quick Selection Label + Collapse Ribbon */}
        <div className="flex items-center gap-2 pb-1 shrink-0">
          <span className="hidden md:inline text-[10px] font-mono text-slate-500 tabular-nums whitespace-nowrap">
            {selectedElement
              ? `${selectedElement.type.toUpperCase()} (${Math.round(selectedElement.width)}×${Math.round(
                  selectedElement.height
                )}mm)`
              : `${pageSetup.paperSize} ${pageSetup.orientation}`}
          </span>

          <button
            type="button"
            onClick={onToggleRibbon}
            title={showRibbon ? 'Collapse Ribbon' : 'Expand Ribbon'}
            aria-label={showRibbon ? 'Collapse Ribbon' : 'Expand Ribbon'}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            {showRibbon ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Microsoft Word-style Ribbon Body */}
      {showRibbon && (
        <div className="bg-white border-b border-slate-200 px-2 sm:px-2.5 py-1.5 flex items-stretch overflow-x-auto no-scrollbar touch-pan-x gap-0.5 text-slate-800">
          {/* ================= HOME TAB ================= */}
          {activeTab === 'home' && (
            <>
              {renderGroup(
                'Clipboard',
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={!hasClipboard}
                    onClick={onPaste}
                    title="Paste Object (Ctrl+V)"
                    className={tallBtnClass(false)}
                  >
                    <span className="w-7 h-7 rounded-md bg-amber-50/90 border border-amber-200/60 flex items-center justify-center">
                      <PasteRibbonIcon className="w-5 h-5" />
                    </span>
                    <span className="text-[10px]">Paste</span>
                  </button>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={!selectedElement || selectedElement.locked}
                        onClick={onCut}
                        title="Cut (Ctrl+X)"
                        className={iconBtnClass(false)}
                      >
                        <Scissors className="w-3.5 h-3.5 text-slate-700" />
                      </button>
                      <button
                        type="button"
                        disabled={!selectedElement}
                        onClick={onCopy}
                        title="Copy (Ctrl+C)"
                        className={iconBtnClass(false)}
                      >
                        <Copy className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={!selectedElement}
                        onClick={onDuplicateSelected}
                        title="Duplicate (Ctrl+D)"
                        className={iconBtnClass(false)}
                      >
                        <CopyPlus className="w-3.5 h-3.5 text-indigo-600" />
                      </button>
                      <button
                        type="button"
                        disabled={!selectedElement || selectedElement.locked}
                        onClick={onDeleteSelected}
                        title="Delete (Del)"
                        className="w-6.5 h-6 flex items-center justify-center rounded text-rose-600 hover:bg-rose-50 disabled:opacity-35 disabled:pointer-events-none transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {groupDivider}

              {renderGroup(
                'Font & Ink',
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1">
                      <Type className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <select
                        value={typableElem?.fontFamily || 'Noto Nastaliq Urdu'}
                        onChange={(e) => {
                          if (typableElem) onUpdateElement({ fontFamily: e.target.value });
                        }}
                        disabled={!typableElem}
                        className={`${selectClass} w-[176px]`}
                        title="Urdu / Arabic / Latin Font Family"
                      >
                        {fontCategories.map((cat) => (
                          <optgroup key={cat} label={cat}>
                            {URDU_FONT_OPTIONS.filter((f) => f.category === cat).map((f) => (
                              <option key={f.value} value={f.value}>
                                {f.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <select
                      value={typableElem?.fontSize || 12}
                      onChange={(e) => {
                        if (typableElem) onUpdateElement({ fontSize: Number(e.target.value) });
                      }}
                      disabled={!typableElem}
                      className={`${selectClass} w-[68px] tabular-nums`}
                      title="Font Size (pt)"
                    >
                      {fontSizeOptions.map((sz) => (
                        <option key={sz} value={sz}>
                          {sz} pt
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1" title="Character Horizontal Width Scaling (%)">
                      <CharScaleRibbonIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <select
                        value={textElem?.scaleX || 100}
                        onChange={(e) => textElem && onUpdateElement({ scaleX: Number(e.target.value) })}
                        disabled={!textElem}
                        className={`${selectClass} w-[70px] tabular-nums`}
                      >
                        <option value={80}>80% W</option>
                        <option value={90}>90% W</option>
                        <option value={100}>100% W</option>
                        <option value={110}>110% W</option>
                        <option value={125}>125% W</option>
                        <option value={140}>140% W</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className={groupBoxClass}>
                      <button
                        type="button"
                        onClick={() => textElem && onUpdateElement({ bold: !textElem.bold })}
                        disabled={!textElem}
                        title="Bold (Ctrl+B)"
                        aria-pressed={Boolean(textElem?.bold)}
                        className={iconBtnClass(Boolean(textElem?.bold))}
                      >
                        <Bold className="w-3.5 h-3.5" strokeWidth={2.4} />
                      </button>
                      <button
                        type="button"
                        onClick={() => textElem && onUpdateElement({ italic: !textElem.italic })}
                        disabled={!textElem}
                        title="Italic (Ctrl+I)"
                        aria-pressed={Boolean(textElem?.italic)}
                        className={iconBtnClass(Boolean(textElem?.italic))}
                      >
                        <Italic className="w-3.5 h-3.5" strokeWidth={2.2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => textElem && onUpdateElement({ underline: !textElem.underline })}
                        disabled={!textElem}
                        title="Underline (Ctrl+U)"
                        aria-pressed={Boolean(textElem?.underline)}
                        className={iconBtnClass(Boolean(textElem?.underline))}
                      >
                        <Underline className="w-3.5 h-3.5" strokeWidth={2.2} />
                      </button>
                    </div>

                    <div className={groupBoxClass} title="Ink / Stroke Color">
                      <Palette className="w-3.5 h-3.5 text-amber-600 mx-0.5 shrink-0" />
                      {presetColors.map((c) => {
                        const isSelected = activeColor?.toLowerCase() === c.toLowerCase();
                        const isDarkSwatch = c !== '#ffffff';
                        return (
                          <button
                            key={c}
                            type="button"
                            disabled={!selectedElement}
                            onClick={() => {
                              if (textElem || tableElem || lineElem) onUpdateElement({ color: c });
                              else if (selectedElement) onUpdateElement({ borderColor: c });
                            }}
                            style={{ backgroundColor: c }}
                            className={`w-4 h-4 border flex items-center justify-center rounded disabled:opacity-40 ${
                              isSelected
                                ? 'border-blue-600 ring-1 ring-blue-500'
                                : 'border-slate-300 hover:scale-105'
                            }`}
                            title={`Color ${c}`}
                          >
                            {isSelected && (
                              <Check
                                className={`w-2.5 h-2.5 ${isDarkSwatch ? 'text-white' : 'text-slate-800'}`}
                                strokeWidth={3}
                              />
                            )}
                          </button>
                        );
                      })}
                      <input
                        type="color"
                        disabled={!selectedElement}
                        value={
                          textElem?.color ||
                          tableElem?.color ||
                          lineElem?.color ||
                          selectedElement?.borderColor ||
                          '#000000'
                        }
                        onChange={(e) => {
                          if (textElem || tableElem || lineElem) onUpdateElement({ color: e.target.value });
                          else if (selectedElement) onUpdateElement({ borderColor: e.target.value });
                        }}
                        className="w-5 h-4 p-0 border border-slate-300 rounded cursor-pointer bg-white disabled:opacity-40"
                        title="Custom Ink Color"
                      />
                    </div>
                  </div>
                </div>
              )}

              {groupDivider}

              {renderGroup(
                'Paragraph',
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <div className={groupBoxClass}>
                      <button
                        type="button"
                        onClick={() => textElem && onUpdateElement({ align: 'right' })}
                        disabled={!textElem}
                        title="Align Right (راست)"
                        className={iconBtnClass(textElem?.align === 'right')}
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => textElem && onUpdateElement({ align: 'center' })}
                        disabled={!textElem}
                        title="Center (مرکز)"
                        className={iconBtnClass(textElem?.align === 'center')}
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => textElem && onUpdateElement({ align: 'left' })}
                        disabled={!textElem}
                        title="Align Left (چپ)"
                        className={iconBtnClass(textElem?.align === 'left')}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => textElem && onUpdateElement({ align: 'justify' })}
                        disabled={!textElem}
                        title="Justify (کشیدہ)"
                        className={iconBtnClass(textElem?.align === 'justify')}
                      >
                        <AlignJustify className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={!textElem}
                      onClick={() =>
                        textElem &&
                        onUpdateElement({ direction: textElem.direction === 'rtl' ? 'ltr' : 'rtl' })
                      }
                      title="Text Direction (RTL Urdu / LTR English)"
                      className={ribbonBtnClass(false)}
                    >
                      {textElem?.direction === 'ltr' ? (
                        <LtrDirectionIcon className="w-4 h-4 text-blue-600" />
                      ) : (
                        <RtlDirectionIcon className="w-4 h-4 text-emerald-700" />
                      )}
                      <span>{textElem?.direction === 'ltr' ? 'LTR' : 'RTL'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1" title="Line Spacing / Leading">
                      <LineSpacingRibbonIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <select
                        value={textElem?.lineHeight || 1.85}
                        onChange={(e) =>
                          textElem && onUpdateElement({ lineHeight: Number(e.target.value) })
                        }
                        disabled={!textElem}
                        className={`${selectClass} w-[104px] tabular-nums`}
                      >
                        <option value={1.4}>140% Line</option>
                        <option value={1.6}>160% Line</option>
                        <option value={1.85}>185% Urdu</option>
                        <option value={2.0}>200% Line</option>
                        <option value={2.4}>240% Line</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1" title="Text Frame Columns">
                      <Columns className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <select
                        value={textElem?.columns || 1}
                        onChange={(e) =>
                          textElem && onUpdateElement({ columns: Number(e.target.value) })
                        }
                        disabled={!textElem}
                        className={`${selectClass} w-[68px] tabular-nums`}
                      >
                        <option value={1}>1 Col</option>
                        <option value={2}>2 Col</option>
                        <option value={3}>3 Col</option>
                        <option value={4}>4 Col</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {groupDivider}

              {renderGroup(
                'Urdu & Editing',
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onOpenStoryEditor}
                    disabled={!isText}
                    title="Open Selected Text in Story Editor (Ctrl+T)"
                    className={tallBtnClass(false)}
                  >
                    <span className="w-7 h-7 rounded-md bg-blue-50/90 border border-blue-200/60 flex items-center justify-center">
                      <StoryEditorRibbonIcon className="w-5 h-5" />
                    </span>
                    <span className="text-[10px]">Story</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenDictionary}
                    title="Open Urdu Dictionary & Thesaurus (F10)"
                    className={tallBtnClass(false)}
                  >
                    <span className="w-7 h-7 rounded-md bg-emerald-50/90 border border-emerald-200/60 flex items-center justify-center">
                      <UrduDictionaryRibbonIcon className="w-5 h-5" />
                    </span>
                    <span className="text-[10px]">Dictionary</span>
                  </button>

                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={onOpenFindReplace}
                      title="Find & Replace (Ctrl+F)"
                      className={ribbonBtnClass(false)}
                    >
                      <Search className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Find / Replace</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={onOpenSymbols}
                        title="Islamic & Calligraphic Symbols (﷽)"
                        className={ribbonBtnClass(false)}
                      >
                        <CalligraphyNibIcon className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-arabic-sans">﷽</span>
                      </button>
                      <button
                        type="button"
                        onClick={onFitTextBox}
                        disabled={!isText}
                        title="Fit Text Box Height to Content"
                        className={ribbonBtnClass(false)}
                      >
                        <FitBoxHeightRibbonIcon className="w-3.5 h-3.5 text-slate-700" />
                        <span>Fit</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================= INSERT TAB ================= */}
          {activeTab === 'insert' && (
            <>
              {renderGroup(
                'Pages',
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onAddPage}
                    title="Add New Blank Page"
                    className={tallBtnClass(false)}
                  >
                    <span className="w-7 h-7 rounded-md bg-blue-50/90 border border-blue-200/60 flex items-center justify-center">
                      <AddPageRibbonIcon className="w-5 h-5" />
                    </span>
                    <span className="text-[10px]">Add Page</span>
                  </button>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={onDuplicatePage}
                      title="Duplicate Current Page"
                      className={ribbonBtnClass(false)}
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Duplicate Page</span>
                    </button>
                    <button
                      type="button"
                      onClick={onDeletePage}
                      title="Delete Current Page"
                      className="px-2 h-7 text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap modern-btn text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Page</span>
                    </button>
                  </div>
                </div>
              )}

              {groupDivider}

              {renderGroup(
                'Text & Picture Frames',
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onInsertElement('textBox')}
                    title="Select Text Box Drawing Tool"
                    className={tallBtnClass(false)}
                  >
                    <span className="w-7 h-7 rounded-md bg-blue-50/90 border border-blue-200/60 flex items-center justify-center text-slate-700">
                      <TextBoxToolIcon className="w-5 h-5" />
                    </span>
                    <span className="text-[10px]">Text Box</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onInsertElement('titleBox')}
                    title="Select Title Box Drawing Tool"
                    className={tallBtnClass(false)}
                  >
                    <span className="w-7 h-7 rounded-md bg-indigo-50/90 border border-indigo-200/60 flex items-center justify-center text-slate-700">
                      <TitleBoxToolIcon className="w-5 h-5" />
                    </span>
                    <span className="text-[10px]">Title Box</span>
                  </button>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => onInsertElement('picRect')}
                      className={ribbonBtnClass(false)}
                    >
                      <PicRectToolIcon className="w-4 h-4 text-slate-700" />
                      <span>Rect Picture</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onInsertElement('picRound')}
                        className={ribbonBtnClass(false)}
                      >
                        <PicRoundToolIcon className="w-4 h-4 text-slate-700" />
                        <span>Rounded Pic</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onInsertElement('picOval')}
                        className={ribbonBtnClass(false)}
                      >
                        <PicOvalToolIcon className="w-4 h-4 text-slate-700" />
                        <span>Oval Pic</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {groupDivider}

              {renderGroup(
                'Shapes & Tables',
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onInsertElement('table')}
                    title="Insert Urdu / RTL Table (جدول)"
                    className={tallBtnClass(false)}
                  >
                    <span className="w-7 h-7 rounded-md bg-blue-50/90 border border-blue-200/60 flex items-center justify-center text-slate-700">
                      <TableToolIcon className="w-5 h-5" />
                    </span>
                    <span className="text-[10px]">Table</span>
                  </button>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => onInsertElement('graphic')}
                      className={ribbonBtnClass(false)}
                    >
                      <GraphicShapeToolIcon className="w-4 h-4 text-slate-700" />
                      <span>Graphic Shape</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onInsertElement('line')}
                      className={ribbonBtnClass(false)}
                    >
                      <LineToolIcon className="w-4 h-4 text-slate-700" />
                      <span>Divider Line</span>
                    </button>
                  </div>
                </div>
              )}

              {groupDivider}

              {renderGroup(
                'Symbols & Tokens',
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onInsertPageNumberToken}
                    title="Insert Auto Page Number Footer ({{PAGE}})"
                    className={tallBtnClass(false)}
                  >
                    <span className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200/80 flex items-center justify-center">
                      <PageNumberRibbonIcon className="w-5 h-5" />
                    </span>
                    <span className="text-[10px]">Page #</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenSymbols}
                    title="Insert Islamic Ligatures & Calligraphic Symbols"
                    className={tallBtnClass(false)}
                  >
                    <span className="w-7 h-7 rounded-md bg-amber-50/90 border border-amber-200/70 flex items-center justify-center">
                      <CalligraphyNibIcon className="w-5 h-5 text-amber-600" />
                    </span>
                    <span className="text-[10px] font-arabic-sans">﷽ Symbols</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* ================= LAYOUT TAB ================= */}
          {activeTab === 'layout' && (
            <>
              {renderGroup(
                'Page Setup',
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenDocSetup}
                    className={tallBtnClass(false)}
                  >
                    <span className="w-7 h-7 rounded-md bg-blue-50/90 border border-blue-200/60 flex items-center justify-center">
                      <PageSetupRibbonIcon className="w-5 h-5" />
                    </span>
                    <span className="text-[10px]">Page Setup</span>
                  </button>
                  <div className="text-[11px] text-slate-600 leading-tight space-y-0.5 pr-1">
                    <div className="font-semibold text-slate-800">
                      {pageSetup.paperSize} · {pageSetup.orientation}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 tabular-nums">
                      {pageSetup.widthMm} × {pageSetup.heightMm} mm
                    </div>
                  </div>
                </div>
              )}

              {groupDivider}

              {renderGroup(
                'Fill & Borders',
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`${groupBoxClass} px-1.5`} title="Box Fill Color">
                      <PaintBucket className="w-3.5 h-3.5 text-amber-600 mr-0.5" />
                      <input
                        type="color"
                        disabled={!selectedElement || isLine}
                        value={
                          selectedElement?.type === 'graphic'
                            ? (selectedElement as GraphicElement).fillColor === 'transparent'
                              ? '#ffffff'
                              : (selectedElement as GraphicElement).fillColor
                            : selectedElement?.backgroundColor &&
                              selectedElement.backgroundColor !== 'transparent'
                            ? selectedElement.backgroundColor
                            : '#ffffff'
                        }
                        onChange={(e) => {
                          if (!selectedElement) return;
                          if (selectedElement.type === 'graphic') {
                            onUpdateElement({ fillColor: e.target.value });
                          } else {
                            onUpdateElement({ backgroundColor: e.target.value });
                          }
                        }}
                        className="w-5 h-4.5 p-0 border border-slate-300 rounded cursor-pointer bg-white disabled:opacity-40"
                      />
                      <button
                        type="button"
                        disabled={!selectedElement || isLine}
                        onClick={() => {
                          if (!selectedElement) return;
                          if (selectedElement.type === 'graphic') {
                            onUpdateElement({ fillColor: 'transparent' });
                          } else {
                            onUpdateElement({ backgroundColor: 'transparent' });
                          }
                        }}
                        title="Clear Fill (Transparent)"
                        className="w-5 h-5 flex items-center justify-center modern-icon-btn disabled:opacity-40"
                      >
                        <TransparentSwatchIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1" title="Border Color">
                      <Square className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[10px] text-slate-500">Border:</span>
                      <input
                        type="color"
                        disabled={!selectedElement}
                        value={selectedElement?.borderColor || '#000000'}
                        onChange={(e) => onUpdateElement({ borderColor: e.target.value })}
                        className="w-5 h-5 p-0 border border-slate-300 rounded cursor-pointer bg-white disabled:opacity-40"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1" title="Border Width">
                      <BorderWidthIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <select
                        value={selectedElement?.borderWidth || 0}
                        onChange={(e) =>
                          selectedElement && onUpdateElement({ borderWidth: Number(e.target.value) })
                        }
                        disabled={!selectedElement || isLine}
                        className={`${selectClass} w-[88px]`}
                      >
                        <option value={0}>No Border</option>
                        <option value={0.5}>0.5 pt</option>
                        <option value={1}>1.0 pt</option>
                        <option value={1.5}>1.5 pt</option>
                        <option value={2}>2.0 pt</option>
                        <option value={3}>3.0 pt</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1" title="Border Style">
                      <BorderStyleIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <select
                        value={selectedElement?.borderStyle || 'solid'}
                        onChange={(e) =>
                          selectedElement &&
                          onUpdateElement({
                            borderStyle: e.target.value as DocElement['borderStyle'],
                          })
                        }
                        disabled={!selectedElement || isLine}
                        className={`${selectClass} w-[82px]`}
                      >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                        <option value="double">Double</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {groupDivider}

              {renderGroup(
                'Arrange & Geometry',
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={!selectedElement || selectedElement.locked}
                      onClick={onCenterHorizontal}
                      className={ribbonBtnClass(false)}
                      title="Center Horizontally on Page"
                    >
                      <AlignHorizontalSpaceAround className="w-3.5 h-3.5 text-blue-600" />
                      <span>Center H</span>
                    </button>
                    <button
                      type="button"
                      disabled={!selectedElement}
                      onClick={onBringToFront}
                      className={ribbonBtnClass(false)}
                      title="Bring to Front"
                    >
                      <ArrowUpToLine className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Front</span>
                    </button>
                    <button
                      type="button"
                      disabled={!selectedElement}
                      onClick={onSendToBack}
                      className={ribbonBtnClass(false)}
                      title="Send to Back"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5 text-slate-600" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      disabled={!selectedElement}
                      onClick={() =>
                        selectedElement && onUpdateElement({ locked: !selectedElement.locked })
                      }
                      className={ribbonBtnClass(Boolean(selectedElement?.locked))}
                      title={selectedElement?.locked ? 'Unlock Object' : 'Lock Position'}
                    >
                      {selectedElement?.locked ? (
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>{selectedElement?.locked ? 'Locked' : 'Lock'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums px-2 h-6.5 bg-slate-50 border border-slate-200 rounded-md text-slate-600">
                      {selectedElement ? (
                        <>
                          <span>X:{Math.round(selectedElement.x)}</span>
                          <span>Y:{Math.round(selectedElement.y)}</span>
                          <span>W:{Math.round(selectedElement.width)}</span>
                          <span>H:{Math.round(selectedElement.height)}</span>
                        </>
                      ) : (
                        <span>Select an object to inspect coordinates</span>
                      )}
                    </div>

                    {selectedElement && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-600">
                        <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
                        <input
                          type="number"
                          min={-180}
                          max={180}
                          value={selectedElement.rotation || 0}
                          onChange={(e) => onUpdateElement({ rotation: Number(e.target.value) })}
                          className={`${selectClass} w-14 px-1.5 tabular-nums font-mono`}
                          title="Rotation Angle (degrees)"
                        />
                        <span>°</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================= URDU & TOOLS TAB ================= */}
          {activeTab === 'urdu' && (
            <>
              {renderGroup(
                'Urdu Input & Keyboard',
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onToggleLanguage}
                    title="Toggle Urdu / English typing (Ctrl+Space)"
                    className={tallBtnClass(language === 'urdu')}
                  >
                    <span
                      className={`w-7 h-7 rounded-md flex items-center justify-center font-arabic-sans text-xs font-bold leading-none border ${
                        language === 'urdu'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {language === 'urdu' ? 'اردو' : 'EN'}
                    </span>
                    <span className="text-[10px]">
                      {language === 'urdu' ? 'Urdu On' : 'English'}
                    </span>
                  </button>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <Languages className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <select
                        value={keyboardLayout}
                        onChange={(e) => onChangeKeyboardLayout(e.target.value as KeyboardLayout)}
                        className={`${selectClass} w-[160px]`}
                        title="Urdu Keyboard Layout"
                      >
                        <option value="phonetic">Phonetic (فونیٹک)</option>
                        <option value="monotype">Monotype Press (مونو ٹائپ)</option>
                        <option value="muqtadira">Muqtadira CRULP (مقتدرہ)</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenKeyboard}
                      title="Open On-Screen Urdu Keyboard (F9)"
                      className={ribbonBtnClass(false)}
                    >
                      <Keyboard className="w-3.5 h-3.5 text-blue-600" />
                      <span>On-Screen Keyboard (F9)</span>
                    </button>
                  </div>
                </div>
              )}

              {groupDivider}

              {renderGroup(
                'Dictionary & Proofing',
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onOpenDictionary}
                    title="Urdu Dictionary & Thesaurus (F10)"
                    className={tallBtnClass(false)}
                  >
                    <span className="w-7 h-7 rounded-md bg-emerald-50/90 border border-emerald-200/60 flex items-center justify-center">
                      <UrduDictionaryRibbonIcon className="w-5 h-5" />
                    </span>
                    <span className="text-[10px]">Urdu Dictionary</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenWordCount}
                    title="Document Word & Character Count"
                    className={tallBtnClass(false)}
                  >
                    <span className="w-7 h-7 rounded-md bg-blue-50/90 border border-blue-200/60 flex items-center justify-center">
                      <WordCountRibbonIcon className="w-5 h-5" />
                    </span>
                    <span className="text-[10px]">Word Count</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenFindReplace}
                    title="Find & Replace (Ctrl+F)"
                    className={tallBtnClass(false)}
                  >
                    <span className="w-7 h-7 rounded-md bg-indigo-50/90 border border-indigo-200/60 flex items-center justify-center">
                      <Search className="w-4.5 h-4.5 text-indigo-600" />
                    </span>
                    <span className="text-[10px]">Find/Replace</span>
                  </button>
                </div>
              )}

              {groupDivider}

              {renderGroup(
                'Text Utilities',
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={onConvertNumbersToUrdu}
                    className={ribbonBtnClass(false)}
                    title="Convert English digits (0-9) to Urdu numerals (۰-۹)"
                  >
                    <UrduDigitsRibbonIcon className="w-4 h-4" />
                    <span>Convert Digits (۰-۹)</span>
                  </button>
                  <button
                    type="button"
                    onClick={onStripDiacritics}
                    className={ribbonBtnClass(false)}
                    title="Strip Arabic/Urdu diacritics (اعراب صاف کریں)"
                  >
                    <StripAraabRibbonIcon className="w-4 h-4" />
                    <span>Strip Diacritics (اعراب)</span>
                  </button>
                </div>
              )}

              {groupDivider}

              {renderGroup(
                'Quick Page Fonts',
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onApplyDefaultFont('Noto Nastaliq Urdu')}
                      className={ribbonBtnClass(false)}
                    >
                      <CalligraphyNibIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-nastaliq text-[12px]">نوری نستعلیق</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onApplyDefaultFont('Gulzar')}
                      className={ribbonBtnClass(false)}
                    >
                      <CalligraphyNibIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-gulzar text-[12px]">گلزار</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onApplyDefaultFont('Amiri')}
                      className={ribbonBtnClass(false)}
                    >
                      <CalligraphyNibIcon className="w-3.5 h-3.5 text-amber-600" />
                      <span className="font-amiri text-[12px]">امیری نسخ</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onApplyDefaultFont('Scheherazade New')}
                      className={ribbonBtnClass(false)}
                    >
                      <Type className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Press Naskh</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onApplyDefaultFont('Aref Ruqaa')}
                      className={ribbonBtnClass(false)}
                    >
                      <CalligraphyNibIcon className="w-3.5 h-3.5 text-violet-600" />
                      <span>Ruqaa Calligraphy</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================= VIEW TAB ================= */}
          {activeTab === 'view' && (
            <>
              {renderGroup(
                'Zoom',
                <div className="flex items-center gap-1">
                  {[
                    { label: '50%', val: 0.5, icon: <ZoomOut className="w-3.5 h-3.5 text-slate-500" /> },
                    { label: '75% Fit', val: 0.75, icon: <Maximize2 className="w-3.5 h-3.5 text-blue-600" /> },
                    { label: '100%', val: 1.0, icon: <Scan className="w-3.5 h-3.5 text-indigo-600" /> },
                    { label: '150%', val: 1.5, icon: <ZoomIn className="w-3.5 h-3.5 text-emerald-600" /> },
                    { label: '200%', val: 2.0, icon: <ZoomIn className="w-3.5 h-3.5 text-amber-600" /> },
                  ].map((z) => {
                    const isActive = Math.abs(zoom - z.val) < 0.01;
                    return (
                      <button
                        key={z.val}
                        type="button"
                        onClick={() => onSetZoom(z.val)}
                        className={`${ribbonBtnClass(isActive)} tabular-nums`}
                      >
                        <span className={isActive ? 'text-blue-700' : ''}>{z.icon}</span>
                        <span>{z.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {groupDivider}

              {renderGroup(
                'Show Guides & Rulers',
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onToggleGuides}
                    className={ribbonBtnClass(showGuides)}
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Margin Guides</span>
                  </button>
                  <button
                    type="button"
                    onClick={onToggleSnapGrid}
                    className={ribbonBtnClass(snapToGrid)}
                  >
                    <Grid className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Snap 5mm Grid</span>
                  </button>
                  <button
                    type="button"
                    onClick={onToggleRulers}
                    className={ribbonBtnClass(showRulers)}
                  >
                    <Ruler className="w-3.5 h-3.5 text-amber-600" />
                    <span>Rulers</span>
                  </button>
                </div>
              )}

              {groupDivider}

              {renderGroup(
                'Print & Export',
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onPrintPreview}
                    title="Open Full-Page Print Preview"
                    className={ribbonBtnClass(false)}
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Print Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={onExportPdf}
                    title="Export All Pages as PDF (.pdf)"
                    className={ribbonBtnClass(false)}
                  >
                    <FileDown className="w-3.5 h-3.5 text-rose-600" />
                    <span>Export PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={onExportDocx}
                    title="Export Document to Microsoft Word (.docx)"
                    className={ribbonBtnClass(false)}
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Export Word</span>
                  </button>
                </div>
              )}

              {groupDivider}

              {renderGroup(
                'Workspace',
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onToggleMasterPage}
                    title="Toggle Master Page Header/Footer Mode (F12)"
                    className={ribbonBtnClass(isMasterPage)}
                  >
                    <MasterPageToolIcon className="w-4 h-4" active={false} />
                    <span>Master Page (F12)</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenAbout}
                    className={ribbonBtnClass(false)}
                  >
                    <Info className="w-3.5 h-3.5 text-sky-600" />
                    <span>About v1.0</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* ================= CONTEXTUAL FORMAT TAB ================= */}
          {activeTab === 'context' && hasContextTab && (
            <>
              {tableElem &&
                renderGroup(
                  'Table Rows & Columns',
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onTableAction('addRow')}
                      className={ribbonBtnClass(false)}
                    >
                      <TableAddRowIcon className="w-4 h-4" />
                      <span>Add Row</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onTableAction('delRow')}
                      className={ribbonBtnClass(false)}
                    >
                      <TableDelRowIcon className="w-4 h-4" />
                      <span>Delete Row</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onTableAction('addCol')}
                      className={ribbonBtnClass(false)}
                    >
                      <TableAddColIcon className="w-4 h-4" />
                      <span>Add Col</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onTableAction('delCol')}
                      className={ribbonBtnClass(false)}
                    >
                      <TableDelColIcon className="w-4 h-4" />
                      <span>Delete Col</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onTableAction('toggleHeader')}
                      className={ribbonBtnClass(Boolean(tableElem.headerRow))}
                    >
                      <TableHeaderShadeIcon className="w-4 h-4" />
                      <span>Header Row Shading</span>
                    </button>
                  </div>
                )}

              {picElem &&
                renderGroup(
                  'Picture Frame & Fit',
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1" title="Picture Frame Shape">
                      {picElem.shape === 'oval' ? (
                        <PicOvalToolIcon className="w-4 h-4 text-slate-700" />
                      ) : picElem.shape === 'rounded' ? (
                        <PicRoundToolIcon className="w-4 h-4 text-slate-700" />
                      ) : (
                        <PicRectToolIcon className="w-4 h-4 text-slate-700" />
                      )}
                      <select
                        value={picElem.shape}
                        onChange={(e) =>
                          onUpdateElement({ shape: e.target.value as PictureElement['shape'] })
                        }
                        className={`${selectClass} w-28`}
                      >
                        <option value="rect">Rectangle</option>
                        <option value="rounded">Rounded</option>
                        <option value="oval">Oval / Circle</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1" title="Image Fit Mode">
                      <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                      <select
                        value={picElem.objectFit || 'cover'}
                        onChange={(e) =>
                          onUpdateElement({ objectFit: e.target.value as PictureElement['objectFit'] })
                        }
                        className={`${selectClass} w-28`}
                      >
                        <option value="cover">Crop Fill</option>
                        <option value="contain">Fit Inside</option>
                        <option value="fill">Stretch</option>
                      </select>
                    </div>
                  </div>
                )}

              {graphicElem &&
                renderGroup(
                  'Graphic Shape',
                  <div className="flex items-center gap-1.5">
                    <GraphicShapeToolIcon className="w-4 h-4 text-slate-700" />
                    <select
                      value={graphicElem.shape}
                      onChange={(e) =>
                        onUpdateElement({ shape: e.target.value as GraphicElement['shape'] })
                      }
                      className={`${selectClass} w-32`}
                      title="Graphic Shape"
                    >
                      <option value="rect">Rectangle</option>
                      <option value="roundRect">Rounded Box</option>
                      <option value="oval">Oval / Circle</option>
                    </select>
                  </div>
                )}

              {lineElem &&
                renderGroup(
                  'Line Properties',
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1" title="Line Orientation">
                      <LineToolIcon className="w-4 h-4 text-slate-700" />
                      <select
                        value={lineElem.orientation}
                        onChange={(e) => {
                          const nextOri = e.target.value as 'horizontal' | 'vertical';
                          if (nextOri !== lineElem.orientation) {
                            onUpdateElement({
                              orientation: nextOri,
                              width: lineElem.height,
                              height: lineElem.width,
                            });
                          }
                        }}
                        className={`${selectClass} w-28`}
                      >
                        <option value="horizontal">Horizontal</option>
                        <option value="vertical">Vertical</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1" title="Line Thickness">
                      <BorderWidthIcon className="w-3.5 h-3.5 text-slate-500" />
                      <select
                        value={lineElem.strokeWidth}
                        onChange={(e) => onUpdateElement({ strokeWidth: Number(e.target.value) })}
                        className={`${selectClass} w-20 tabular-nums`}
                      >
                        <option value={0.5}>0.5 pt</option>
                        <option value={1}>1.0 pt</option>
                        <option value={1.5}>1.5 pt</option>
                        <option value={2}>2.0 pt</option>
                        <option value={3}>3.0 pt</option>
                        <option value={5}>5.0 pt</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1" title="Line Style">
                      <BorderStyleIcon className="w-3.5 h-3.5 text-slate-500" />
                      <select
                        value={lineElem.style}
                        onChange={(e) =>
                          onUpdateElement({ style: e.target.value as LineElement['style'] })
                        }
                        className={`${selectClass} w-24`}
                      >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                        <option value="double">Double</option>
                      </select>
                    </div>
                  </div>
                )}

              {groupDivider}

              {renderGroup(
                'Arrangement',
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onCenterHorizontal}
                    className={ribbonBtnClass(false)}
                  >
                    <AlignHorizontalSpaceAround className="w-3.5 h-3.5 text-blue-600" />
                    <span>Center H</span>
                  </button>
                  <button
                    type="button"
                    onClick={onBringToFront}
                    className={ribbonBtnClass(false)}
                  >
                    <ArrowUpToLine className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Front</span>
                  </button>
                  <button
                    type="button"
                    onClick={onSendToBack}
                    className={ribbonBtnClass(false)}
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5 text-slate-600" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={onDeleteSelected}
                    className="px-2 h-7 text-[11px] font-medium flex items-center gap-1.5 modern-btn text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
