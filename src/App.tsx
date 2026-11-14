/**
 * Qalam Urdu Studio - Urdu desktop publishing (DTP). Created by Uzair Asad.
 * @license Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { TitleBar } from './components/TitleBar';
import { RibbonToolbar } from './components/RibbonToolbar';
import { DocumentTabs } from './components/DocumentTabs';
import { Toolbox } from './components/Toolbox';
import { HorizontalRuler, VerticalRuler } from './components/Ruler';
import { DocumentCanvas } from './components/DocumentCanvas';
import { StatusBar } from './components/StatusBar';
import { ContextMenu } from './components/ContextMenu';

import { VirtualKeyboardModal } from './components/VirtualKeyboardModal';
import { StoryEditorModal } from './components/StoryEditorModal';
import { DocumentSetupModal } from './components/DocumentSetupModal';
import { SymbolPickerModal } from './components/SymbolPickerModal';
import { FindReplaceModal } from './components/FindReplaceModal';
import { WordCountModal } from './components/WordCountModal';
import { UrduDictionaryModal } from './components/UrduDictionaryModal';
import { AboutModal } from './components/AboutModal';
import { DownloadAppModal } from './components/DownloadAppModal';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { PrintablePageView } from './components/PrintablePageView';
import { WindowsMessageBox, DialogOptions } from './components/WindowsMessageBox';

import {
  DocumentProject,
  DocumentTab,
  DocElement,
  TextElement,
  PictureElement,
  GraphicElement,
  LineElement,
  TableElement,
  ToolType,
  PageSetup,
  KeyboardLayout,
} from './types/inpage';
import { TEMPLATES } from './utils/templates';
import { URDU_NUMERALS, stripUrduDiacritics } from './utils/phoneticKeyboard';
import { resolveFontStack } from './utils/fonts';
import { exportPageToPng } from './utils/exportPng';
import { downloadProjectAsInp } from './utils/exportInpage';
import { exportProjectToPdf } from './utils/exportPdf';
import { exportProjectToDocx } from './utils/exportDocx';
import { importDocxToProject } from './utils/importDocx';
import { importPdfToProject } from './utils/importPdf';
import { importTxtToProject } from './utils/importTxt';
import { exportProjectToTxt } from './utils/exportTxt';
import { onFilesOpenedByOS, printDocument, saveFile } from './platform/native';

const AUTOSAVE_KEY = 'qalam_studio_autosave_v1';
const TABS_STORAGE_KEY = 'qalam_studio_tabs_v1';

function createTabFromProject(project: DocumentProject, isModified = false): DocumentTab {
  return {
    id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    project,
    activePageIndex: 0,
    selectedElementId: null,
    isModified,
    history: [project],
    historyIndex: 0,
  };
}

function loadInitialTabsState(): { tabs: DocumentTab[]; activeTabId: string } {
  try {
    const savedTabs = localStorage.getItem(TABS_STORAGE_KEY);
    if (savedTabs) {
      const parsed = JSON.parse(savedTabs);
      if (parsed && Array.isArray(parsed.tabs) && parsed.tabs.length > 0) {
        const validTabs: DocumentTab[] = parsed.tabs
          .filter(
            (t: Partial<DocumentTab>) =>
              t && t.project && Array.isArray(t.project.pages) && t.project.pages.length > 0
          )
          .map((t: Partial<DocumentTab>) => {
            const proj = t.project as DocumentProject;
            return {
              id: t.id || `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              project: proj,
              activePageIndex: Math.min(t.activePageIndex || 0, proj.pages.length - 1),
              selectedElementId: null,
              isModified: Boolean(t.isModified),
              history: [proj],
              historyIndex: 0,
            };
          });
        if (validTabs.length > 0) {
          const activeId = validTabs.some((t) => t.id === parsed.activeTabId)
            ? parsed.activeTabId
            : validTabs[0].id;
          return { tabs: validTabs, activeTabId: activeId };
        }
      }
    }

    const legacySaved =
      localStorage.getItem(AUTOSAVE_KEY) ||
      localStorage.getItem('qalampage_autosave_v1') ||
      localStorage.getItem('inpage_autosave_v4');
    if (legacySaved) {
      const parsed = JSON.parse(legacySaved);
      if (parsed && Array.isArray(parsed.pages) && parsed.pages.length > 0 && parsed.pageSetup) {
        const tab = createTabFromProject(parsed, false);
        return { tabs: [tab], activeTabId: tab.id };
      }
    }
  } catch {
    // Fallback to default template on storage errors
  }
  const defaultTab = createTabFromProject(TEMPLATES[0].getProject(), false);
  return { tabs: [defaultTab], activeTabId: defaultTab.id };
}

export default function App() {
  const initialStateRef = useRef<{ tabs: DocumentTab[]; activeTabId: string } | null>(null);
  if (!initialStateRef.current) {
    initialStateRef.current = loadInitialTabsState();
  }

  const [tabs, setTabs] = useState<DocumentTab[]>(initialStateRef.current.tabs);
  const [activeTabId, setActiveTabId] = useState<string>(initialStateRef.current.activeTabId);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const project = activeTab.project;
  const activePageIndex = activeTab.activePageIndex;
  const selectedElementId = activeTab.selectedElementId;
  const isModified = activeTab.isModified;
  const history = activeTab.history;
  const historyIndex = activeTab.historyIndex;

  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [clipboardElement, setClipboardElement] = useState<DocElement | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('pick');
  const [language, setLanguage] = useState<'urdu' | 'english'>('urdu');
  const [keyboardLayout, setKeyboardLayout] = useState<KeyboardLayout>('phonetic');
  const [zoom, setZoom] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      const availW = Math.max(240, window.innerWidth - 28);
      const fit = availW / (initialStateRef.current!.tabs[0].project.pageSetup.widthMm * 3.78);
      return Math.max(0.35, Math.min(1.0, Math.round(fit * 100) / 100));
    }
    return 1.0;
  });
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [showRulers, setShowRulers] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [showRibbon, setShowRibbon] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [isMasterPage, setIsMasterPage] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [pageOffsets, setPageOffsets] = useState<{ x: number; y: number }>({ x: 32, y: 32 });
  const [defaultFontFamily, setDefaultFontFamily] = useState<string>('Noto Nastaliq Urdu');
  const [defaultFontSize, setDefaultFontSize] = useState<number>(11);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const handleFitZoom = () => {
    const measuredW = workspaceRef.current?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800);
    const horizontalPad = typeof window !== 'undefined' && window.innerWidth < 640 ? 28 : 72;
    const fit = (measuredW - horizontalPad) / (project.pageSetup.widthMm * 3.78);
    setZoom(Math.max(0.35, Math.min(1.5, Math.round(fit * 100) / 100)));
  };

  // Transient toast banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    element: DocElement | null;
  } | null>(null);

  // Modals & Dialog State
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isStoryEditorOpen, setIsStoryEditorOpen] = useState(false);
  const [isDocSetupOpen, setIsDocSetupOpen] = useState(false);
  const [isSymbolsOpen, setIsSymbolsOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isWordCountOpen, setIsWordCountOpen] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogOptions | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const wordFileInputRef = useRef<HTMLInputElement>(null);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  const txtFileInputRef = useRef<HTMLInputElement>(null);

  const updateActiveTab = (updater: (tab: DocumentTab) => DocumentTab) => {
    setTabs((prev) => prev.map((t) => (t.id === activeTab.id ? updater(t) : t)));
  };

  const setActivePageIndex = (idx: number) => {
    updateActiveTab((tab) => ({ ...tab, activePageIndex: idx }));
  };

  const setSelectedElementId = (id: string | null) => {
    updateActiveTab((tab) => ({ ...tab, selectedElementId: id }));
  };

  const setIsModified = (modified: boolean) => {
    updateActiveTab((tab) => ({ ...tab, isModified: modified }));
  };

  // Auto-save open document tabs to localStorage
  useEffect(() => {
    try {
      const compactTabs = tabs.map((t) => ({
        id: t.id,
        project: t.project,
        activePageIndex: t.activePageIndex,
        isModified: t.isModified,
      }));
      localStorage.setItem(
        TABS_STORAGE_KEY,
        JSON.stringify({ tabs: compactTabs, activeTabId: activeTab.id })
      );
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(project));
    } catch {
      // Ignore quota exceeded errors
    }
  }, [tabs, activeTab.id, project]);

  // Keep browser @page print dimensions synced 1:1 with the active document paper size
  useEffect(() => {
    const styleId = 'qalam-dynamic-page-print';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@media print { @page { size: ${project.pageSetup.widthMm}mm ${project.pageSetup.heightMm}mm; margin: 0; } }`;
  }, [project.pageSetup.widthMm, project.pageSetup.heightMm]);

  // Helper to commit changes to history for the active tab
  const pushState = (newProject: DocumentProject) => {
    updateActiveTab((tab) => {
      const updatedHistory = tab.history.slice(0, tab.historyIndex + 1);
      updatedHistory.push(newProject);
      if (updatedHistory.length > 50) {
        updatedHistory.shift();
      }
      return {
        ...tab,
        project: newProject,
        history: updatedHistory,
        historyIndex: updatedHistory.length - 1,
        isModified: true,
      };
    });
  };

  const currentPage = project.pages[activePageIndex] || project.pages[0];
  const activeElements = isMasterPage ? project.masterElements : currentPage.elements;
  const selectedElement = activeElements.find((e) => e.id === selectedElementId) || null;

  // Undo / Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      updateActiveTab((tab) => {
        const nextIndex = tab.historyIndex - 1;
        return {
          ...tab,
          historyIndex: nextIndex,
          project: tab.history[nextIndex],
        };
      });
      setEditingTextId(null);
      showToast('Undid last action');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      updateActiveTab((tab) => {
        const nextIndex = tab.historyIndex + 1;
        return {
          ...tab,
          historyIndex: nextIndex,
          project: tab.history[nextIndex],
        };
      });
      setEditingTextId(null);
      showToast('Redid action');
    }
  };

  // Update element
  const handleUpdateElement = (id: string, updated: Partial<DocElement>) => {
    if ('fontFamily' in updated && typeof updated.fontFamily === 'string') {
      setDefaultFontFamily(updated.fontFamily);
    }
    if ('fontSize' in updated && typeof updated.fontSize === 'number') {
      setDefaultFontSize(updated.fontSize);
    }

    let newProject: DocumentProject;
    if (isMasterPage) {
      newProject = {
        ...project,
        masterElements: project.masterElements.map((el) =>
          el.id === id ? ({ ...el, ...updated } as DocElement) : el
        ),
      };
    } else {
      newProject = {
        ...project,
        pages: project.pages.map((p, idx) => {
          if (idx !== activePageIndex) return p;
          return {
            ...p,
            elements: p.elements.map((el) =>
              el.id === id ? ({ ...el, ...updated } as DocElement) : el
            ),
          };
        }),
      };
    }
    pushState(newProject);
  };

  // Add new element
  const handleAddElement = (newElem: DocElement) => {
    let newProject: DocumentProject;
    if (isMasterPage) {
      newProject = {
        ...project,
        masterElements: [...project.masterElements, newElem],
      };
    } else {
      newProject = {
        ...project,
        pages: project.pages.map((p, idx) => {
          if (idx !== activePageIndex) return p;
          return {
            ...p,
            elements: [...p.elements, newElem],
          };
        }),
      };
    }
    pushState(newProject);
    setSelectedElementId(newElem.id);
  };

  // Delete selected element
  const handleDeleteSelected = () => {
    if (!selectedElementId) return;
    if (selectedElement?.locked) return;
    let newProject: DocumentProject;
    if (isMasterPage) {
      newProject = {
        ...project,
        masterElements: project.masterElements.filter((el) => el.id !== selectedElementId),
      };
    } else {
      newProject = {
        ...project,
        pages: project.pages.map((p, idx) => {
          if (idx !== activePageIndex) return p;
          return {
            ...p,
            elements: p.elements.filter((el) => el.id !== selectedElementId),
          };
        }),
      };
    }
    pushState(newProject);
    setSelectedElementId(null);
    if (editingTextId === selectedElementId) {
      setEditingTextId(null);
    }
  };

  // Clipboard: Cut, Copy, Paste, Duplicate
  const handleCopy = () => {
    if (!selectedElement) return;
    setClipboardElement(JSON.parse(JSON.stringify(selectedElement)));
    showToast('Object copied');
  };

  const handleCut = () => {
    if (!selectedElement || selectedElement.locked) return;
    setClipboardElement(JSON.parse(JSON.stringify(selectedElement)));
    handleDeleteSelected();
    showToast('Object cut to clipboard');
  };

  const handlePaste = () => {
    if (!clipboardElement) return;
    const pasted: DocElement = {
      ...JSON.parse(JSON.stringify(clipboardElement)),
      id: `elem-${Date.now()}`,
      x: Math.min(project.pageSetup.widthMm - 10, clipboardElement.x + 8),
      y: Math.min(project.pageSetup.heightMm - 10, clipboardElement.y + 8),
      locked: false,
    };
    handleAddElement(pasted);
  };

  const handleDuplicateSelected = () => {
    if (!selectedElement) return;
    const duplicated: DocElement = {
      ...JSON.parse(JSON.stringify(selectedElement)),
      id: `elem-${Date.now()}`,
      x: Math.min(project.pageSetup.widthMm - 10, selectedElement.x + 8),
      y: Math.min(project.pageSetup.heightMm - 10, selectedElement.y + 8),
      locked: false,
    };
    handleAddElement(duplicated);
  };

  const handleSelectAll = () => {
    if (activeElements.length === 0) return;
    if (!selectedElementId) {
      setSelectedElementId(activeElements[0].id);
    } else {
      const idx = activeElements.findIndex((e) => e.id === selectedElementId);
      const nextIdx = (idx + 1) % activeElements.length;
      setSelectedElementId(activeElements[nextIdx].id);
    }
  };

  // Bring to Front
  const handleBringToFront = () => {
    if (!selectedElementId) return;
    const reorder = (list: DocElement[]) => {
      const item = list.find((e) => e.id === selectedElementId);
      if (!item) return list;
      return [...list.filter((e) => e.id !== selectedElementId), item];
    };
    if (isMasterPage) {
      pushState({ ...project, masterElements: reorder(project.masterElements) });
    } else {
      pushState({
        ...project,
        pages: project.pages.map((p, idx) =>
          idx === activePageIndex ? { ...p, elements: reorder(p.elements) } : p
        ),
      });
    }
  };

  // Send to Back
  const handleSendToBack = () => {
    if (!selectedElementId) return;
    const reorder = (list: DocElement[]) => {
      const item = list.find((e) => e.id === selectedElementId);
      if (!item) return list;
      return [item, ...list.filter((e) => e.id !== selectedElementId)];
    };
    if (isMasterPage) {
      pushState({ ...project, masterElements: reorder(project.masterElements) });
    } else {
      pushState({
        ...project,
        pages: project.pages.map((p, idx) =>
          idx === activePageIndex ? { ...p, elements: reorder(p.elements) } : p
        ),
      });
    }
  };

  // Insert char/word from on-screen keyboard, symbol picker, or Urdu dictionary into active text element
  const handleInsertChar = (char: string) => {
    if (selectedElement && selectedElement.type === 'text') {
      const currentText = (selectedElement as TextElement).text;
      handleUpdateElement(selectedElement.id, { text: currentText + char });
    }
  };

  const handleInsertDictionaryWord = (word: string) => {
    if (selectedElement && selectedElement.type === 'text') {
      const currentText = (selectedElement as TextElement).text;
      const needsSpace = currentText.length > 0 && !/[\s\n]$/.test(currentText);
      handleUpdateElement(selectedElement.id, {
        text: currentText + (needsSpace ? ' ' : '') + word,
      });
      showToast(`Inserted "${word}" into text box`);
    }
  };

  const handleCopyDictionaryWord = async (word: string) => {
    try {
      await navigator.clipboard.writeText(word);
      showToast(`Copied "${word}" to clipboard`);
    } catch {
      showToast(`Selected "${word}"`);
    }
  };

  // Multi-Document Tab Management
  const handleSelectTab = (tabId: string) => {
    if (tabId === activeTabId) return;
    setActiveTabId(tabId);
    setEditingTextId(null);
    setContextMenu(null);
  };

  const openProjectInNewTab = (newProj: DocumentProject, toastLabel?: string) => {
    const newTab = createTabFromProject(newProj, false);
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setEditingTextId(null);
    setContextMenu(null);
    if (toastLabel) showToast(toastLabel);
  };

  const handleNewBlankTab = () => {
    const blankTemplate = TEMPLATES.find((t) => t.id === 'blank') || TEMPLATES[TEMPLATES.length - 1];
    const baseProj = blankTemplate.getProject();
    const blankCount = tabs.filter((t) => t.project.fileName.startsWith('Untitled')).length + 1;
    const fileName = `Untitled_${blankCount}.qlm`;
    openProjectInNewTab(
      { ...baseProj, title: `Untitled ${blankCount}`, fileName },
      `Opened new tab: ${fileName}`
    );
  };

  const handleNewTemplateTab = (templateId: string) => {
    const found = TEMPLATES.find((t) => t.id === templateId);
    if (!found) return;
    const newProj = found.getProject();
    openProjectInNewTab(newProj, `Opened ${found.name} in new tab`);
  };

  const performCloseTab = (tabId: string) => {
    setEditingTextId(null);
    setContextMenu(null);
    setTabs((prev) => {
      if (prev.length <= 1) {
        const blank =
          (TEMPLATES.find((t) => t.id === 'blank') || TEMPLATES[TEMPLATES.length - 1]).getProject();
        const freshTab = createTabFromProject(
          { ...blank, title: 'Untitled 1', fileName: 'Untitled_1.qlm' },
          false
        );
        setActiveTabId(freshTab.id);
        return [freshTab];
      }
      const idx = prev.findIndex((t) => t.id === tabId);
      const remaining = prev.filter((t) => t.id !== tabId);
      if (tabId === activeTabId) {
        const nextTab = remaining[Math.max(0, idx - 1)] || remaining[0];
        setActiveTabId(nextTab.id);
      }
      return remaining;
    });
  };

  const handleCloseTab = (tabId: string) => {
    const target = tabs.find((t) => t.id === tabId);
    if (!target) return;
    if (target.isModified) {
      setDialog({
        isOpen: true,
        type: 'confirm',
        title: 'Close Modified Tab',
        message: `"${target.project.fileName}" has unsaved changes.\nClose this document tab anyway?`,
        onConfirm: () => performCloseTab(tabId),
      });
    } else {
      performCloseTab(tabId);
    }
  };

  // Toggle Language
  const handleToggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === 'urdu' ? 'english' : 'urdu';
      showToast(next === 'urdu' ? 'Keyboard: Urdu (اردو)' : 'Keyboard: English (US)');
      return next;
    });
  };

  // Cycle Urdu Keyboard Layout (Phonetic -> Monotype -> Muqtadira)
  const handleCycleKeyboardLayout = () => {
    setKeyboardLayout((prev) => {
      const next =
        prev === 'phonetic' ? 'monotype' : prev === 'monotype' ? 'muqtadira' : 'phonetic';
      showToast(`Layout: ${next.charAt(0).toUpperCase() + next.slice(1)}`);
      return next;
    });
  };

  // Center selected element horizontally on page
  const handleCenterHorizontal = () => {
    if (!selectedElement || selectedElement.locked) return;
    const centeredX = Math.max(
      0,
      Math.round(((project.pageSetup.widthMm - selectedElement.width) / 2) * 10) / 10
    );
    handleUpdateElement(selectedElement.id, { x: centeredX });
    showToast('Centered horizontally on page');
  };

  // Fit selected text box height to its rendered content
  const handleFitTextBox = () => {
    if (!selectedElement || selectedElement.type !== 'text' || selectedElement.locked) return;
    const container = document.querySelector(`[data-text-container="${selectedElement.id}"]`);
    if (!container) return;
    const neededPx = container.scrollHeight + Math.max(8, 6 * zoom);
    const neededMm = Math.max(12, Math.ceil(neededPx / (3.78 * zoom)));
    handleUpdateElement(selectedElement.id, { height: neededMm });
    showToast(`Box height fitted to ${neededMm}mm`);
  };

  // Table row / column manipulation
  const handleTableAction = (
    action: 'addRow' | 'delRow' | 'addCol' | 'delCol' | 'toggleHeader'
  ) => {
    if (!selectedElement || selectedElement.type !== 'table' || selectedElement.locked) return;
    const te = selectedElement as TableElement;
    const data = te.data.map((row) => [...row]);
    let rows = te.rows;
    let cols = te.cols;
    let headerRow = te.headerRow;

    if (action === 'addRow') {
      data.push(Array(cols).fill(''));
      rows += 1;
    } else if (action === 'delRow' && rows > 1) {
      data.pop();
      rows -= 1;
    } else if (action === 'addCol') {
      data.forEach((r) => r.push(''));
      cols += 1;
    } else if (action === 'delCol' && cols > 1) {
      data.forEach((r) => r.pop());
      cols -= 1;
    } else if (action === 'toggleHeader') {
      headerRow = !headerRow;
    }

    handleUpdateElement(te.id, { rows, cols, data, headerRow });
  };

  // Picture Box Editor
  const handleEditPicture = (elem: PictureElement) => {
    setDialog({
      isOpen: true,
      type: 'prompt-picture',
      title: 'Picture Box Properties (تصویر کے خصائص)',
      message: 'Upload an image from your PC, pick an offline illustration, or enter an image URL:',
      defaultValue: elem.imageSrc || '',
      defaultCaption: elem.caption || '',
      onConfirm: (data: { imageSrc: string; caption: string }) => {
        handleUpdateElement(elem.id, {
          imageSrc: data.imageSrc,
          caption: data.caption,
        });
      },
    });
  };

  // Export current page as high-res PNG
  const handleExportPng = async () => {
    try {
      const saved = await exportPageToPng(
        project.pageSetup,
        currentPage.elements,
        project.masterElements,
        project.fileName,
        currentPage.pageNumber
      );
      if (saved) showToast(`Exported Page ${currentPage.pageNumber} as PNG`);
    } catch {
      setDialog({
        isOpen: true,
        type: 'warning',
        title: 'Export Image',
        message: 'Could not render page image. Try Print / Save as PDF instead.',
        onConfirm: () => {},
      });
    }
  };

  // Apply default Urdu font across all text boxes on current page
  const handleApplyDefaultFont = (fontFamily: string) => {
    setDefaultFontFamily(fontFamily);
    const newProject: DocumentProject = {
      ...project,
      pages: project.pages.map((p, idx) => {
        if (idx !== activePageIndex) return p;
        return {
          ...p,
          elements: p.elements.map((el) =>
            el.type === 'text' ? ({ ...el, fontFamily } as TextElement) : el
          ),
        };
      }),
    };
    pushState(newProject);
    showToast(`Applied ${fontFamily} to page`);
  };

  // App Exit / Reset confirmation
  const handleExitApp = () => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      title: 'Reset Qalam Urdu Studio',
      message: 'Do you want to reload Qalam Urdu Studio? Auto-saved work is kept locally.',
      onConfirm: () => {
        window.location.reload();
      },
    });
  };

  // File Operations: Save .qlm file
  const handleSaveProject = async () => {
    const rawName = project.fileName || 'Qalam_Document.qlm';
    const outName = rawName.replace(/\.qpg$/i, '.qlm');
    const payload = outName === project.fileName ? project : { ...project, fileName: outName };
    const saved = await saveFile(outName, JSON.stringify(payload, null, 2), 'application/json');
    if (!saved) return;
    setIsModified(false);
    showToast(`Saved ${saved}`);
  };

  // Save As .inp file
  const handleSaveAsInp = async () => {
    const outName = await downloadProjectAsInp(project);
    if (!outName) return;
    setIsModified(false);
    setDialog({
      isOpen: true,
      type: 'info',
      title: 'Saved as .inp File',
      message: `Saved "${outName}".\n\nNote: This .inp file preserves your full layout for reopening in Qalam Urdu Studio.\n\nTo share or print externally, use File → Export PDF Document (.pdf) or Export Word Document (.docx).`,
      onConfirm: () => {},
    });
  };

  // Export multi-page PDF (.pdf)
  const handleExportPdf = async () => {
    showToast('Generating PDF document...');
    try {
      const outName = await exportProjectToPdf(project);
      if (outName) showToast(`Exported ${outName}`);
    } catch {
      setDialog({
        isOpen: true,
        type: 'warning',
        title: 'Export PDF',
        message: 'Could not generate PDF file. Try Print (Ctrl+P) → Save as PDF instead.',
        onConfirm: () => {},
      });
    }
  };

  // Export editable Microsoft Word (.docx)
  const handleExportDocx = async () => {
    showToast('Generating Word (.docx) document...');
    try {
      const outName = await exportProjectToDocx(project);
      if (outName) showToast(`Exported ${outName}`);
    } catch {
      setDialog({
        isOpen: true,
        type: 'warning',
        title: 'Export Word (.docx)',
        message: 'Could not generate Word (.docx) document.',
        onConfirm: () => {},
      });
    }
  };

  // Export plain UTF-8 text (.txt)
  const handleExportTxt = async () => {
    try {
      const outName = await exportProjectToTxt(project);
      if (outName) showToast(`Exported ${outName}`);
    } catch {
      setDialog({
        isOpen: true,
        type: 'warning',
        title: 'Export Text (.txt)',
        message: 'Could not export plain text (.txt) file.',
        onConfirm: () => {},
      });
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        handleToggleLanguage();
        return;
      }

      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputFocused = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveProject();
        return;
      }

      if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        handleNewBlankTab();
        return;
      }

      if (e.ctrlKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        fileInputRef.current?.click();
        return;
      }

      if (e.ctrlKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        void printDocument();
        return;
      }

      if (e.ctrlKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        setIsStoryEditorOpen(true);
        return;
      }

      if (e.ctrlKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setIsFindReplaceOpen(true);
        return;
      }

      if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
        if (selectedElement && !isInputFocused) {
          e.preventDefault();
          handleDuplicateSelected();
          return;
        }
      }

      if (e.ctrlKey && !isInputFocused) {
        if (e.key === 'c' || e.key === 'C') {
          if (selectedElement) {
            e.preventDefault();
            handleCopy();
            return;
          }
        } else if (e.key === 'x' || e.key === 'X') {
          if (selectedElement && !selectedElement.locked) {
            e.preventDefault();
            handleCut();
            return;
          }
        } else if (e.key === 'v' || e.key === 'V') {
          if (clipboardElement) {
            e.preventDefault();
            handlePaste();
            return;
          }
        }
      }

      if (e.ctrlKey && !isInputFocused && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (e.ctrlKey && !isInputFocused && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // F-Keys
      if (e.key === 'F5') {
        e.preventDefault();
        handleFitZoom();
      } else if (e.key === 'F6') {
        e.preventDefault();
        setZoom(0.5);
      } else if (e.key === 'F7') {
        e.preventDefault();
        setZoom(1.0);
      } else if (e.key === 'F8') {
        e.preventDefault();
        setZoom(2.0);
      } else if (e.key === 'F9') {
        e.preventDefault();
        setIsKeyboardOpen((prev) => !prev);
      } else if (e.key === 'F10') {
        e.preventDefault();
        setIsDictionaryOpen((prev) => !prev);
      } else if (e.key === 'F12') {
        e.preventDefault();
        setIsMasterPage((prev) => !prev);
      }

      // Arrow-key precision nudging
      if (
        !isInputFocused &&
        !editingTextId &&
        selectedElement &&
        !selectedElement.locked &&
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        handleUpdateElement(selectedElement.id, {
          x: Math.max(0, Math.round((selectedElement.x + dx) * 10) / 10),
          y: Math.max(0, Math.round((selectedElement.y + dy) * 10) / 10),
        });
        return;
      }

      if (
        !isInputFocused &&
        !editingTextId &&
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedElementId
      ) {
        e.preventDefault();
        handleDeleteSelected();
      }

      if (e.key === 'Escape') {
        setActiveTool('pick');
        setEditingTextId(null);
        setContextMenu(null);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  });

  // Open .qlm / .inp / .docx / .pdf / .txt file in a new document tab
  const handleOpenFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await openFile(file);
  };

  const openFile = async (file: File) => {
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith('.docx')) {
      showToast('Opening Word document (.docx)...');
      try {
        const imported = await importDocxToProject(file);
        openProjectInNewTab(imported, `Opened ${file.name} in new tab`);
      } catch {
        setDialog({
          isOpen: true,
          type: 'warning',
          title: 'Open Word File (.docx)',
          message: 'Could not read this Word (.docx) file. Please verify it is a valid, unencrypted .docx document.',
          onConfirm: () => {},
        });
      }
      return;
    }

    if (lowerName.endsWith('.pdf')) {
      showToast('Opening PDF document (.pdf)...');
      try {
        const imported = await importPdfToProject(file);
        openProjectInNewTab(imported, `Opened ${file.name} in new tab`);
      } catch {
        setDialog({
          isOpen: true,
          type: 'warning',
          title: 'Open PDF File (.pdf)',
          message: 'Could not read this PDF file. Please verify it is a valid, unencrypted PDF document.',
          onConfirm: () => {},
        });
      }
      return;
    }

    if (lowerName.endsWith('.txt')) {
      try {
        const imported = await importTxtToProject(file);
        openProjectInNewTab(imported, `Opened ${file.name} in new tab`);
      } catch {
        setDialog({
          isOpen: true,
          type: 'warning',
          title: 'Open Text File (.txt)',
          message: 'Could not read this plain text (.txt) file.',
          onConfirm: () => {},
        });
      }
      return;
    }

    if (lowerName.endsWith('.doc')) {
      setDialog({
        isOpen: true,
        type: 'warning',
        title: 'Legacy Word (.doc) Format',
        message: 'Binary .doc (Word 97–2003) files are not supported directly. Please save the document as .docx in Word or LibreOffice and open the .docx file.',
        onConfirm: () => {},
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const loaded = JSON.parse(event.target?.result as string);
        if (loaded.pages && loaded.pageSetup) {
          openProjectInNewTab(loaded, `Opened ${loaded.fileName || file.name} in new tab`);
        } else {
          setDialog({
            isOpen: true,
            type: 'warning',
            title: 'Open Document',
            message: 'Invalid Qalam Studio document file format.',
            onConfirm: () => {},
          });
        }
      } catch {
        setDialog({
          isOpen: true,
          type: 'warning',
          title: 'Open Document',
          message: 'Failed to parse document file.',
          onConfirm: () => {},
        });
      }
    };
    reader.readAsText(file);
  };

  // Desktop app: documents opened from the OS (double-click, Open with, second launch)
  const openFileRef = useRef(openFile);
  openFileRef.current = openFile;
  useEffect(() => onFilesOpenedByOS((file) => void openFileRef.current(file)), []);

  // Export Unicode HTML publication
  const handleExportHtml = async () => {
    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const renderElHtml = (el: DocElement, pageNum: number): string => {
      const baseStyle = `position:absolute;left:${el.x}mm;top:${el.y}mm;width:${el.width}mm;height:${el.height}mm;box-sizing:border-box;transform:${el.rotation ? `rotate(${el.rotation}deg)` : 'none'};`;
      if (el.type === 'text') {
        const te = el as TextElement;
        const localizedNum =
          (te.direction || 'rtl') === 'rtl'
            ? String(pageNum).replace(/[0-9]/g, (d) => URDU_NUMERALS[d] || d)
            : String(pageNum);
        const content = escapeHtml(te.text.replace(/\{\{PAGE\}\}/g, localizedNum)).replace(/\n/g, '<br/>');
        const colStyle =
          te.columns && te.columns > 1
            ? `column-count:${te.columns};column-gap:${te.columnGutter ?? 4}mm;`
            : '';
        const scaleStyle =
          te.scaleX && te.scaleX !== 100
            ? `transform:scaleX(${(te.scaleX / 100).toFixed(2)});transform-origin:${te.align === 'left' ? 'left top' : te.align === 'center' ? 'center top' : 'right top'};`
            : '';
        return `<div style="${baseStyle}background:${te.backgroundColor || 'transparent'};border:${te.borderWidth || 0}px solid ${te.borderColor || 'transparent'};padding:${Math.max(4, Math.round(te.fontSize * 0.35))}px ${te.paddingMm ?? 2}mm;font-family:${resolveFontStack(te.fontFamily)};font-size:${te.fontSize}pt;line-height:${te.lineHeight || 1.9};text-align:${te.align || 'right'};direction:${te.direction || 'rtl'};color:${te.color || '#000'};font-weight:${te.bold ? 'bold' : 'normal'};font-style:${te.italic ? 'italic' : 'normal'};text-decoration:${te.underline ? 'underline' : 'none'};"><div style="${colStyle}${scaleStyle}">${content}</div></div>`;
      }
      if (el.type === 'graphic') {
        const ge = el as GraphicElement;
        const radius = ge.shape === 'oval' ? '50%' : ge.shape === 'roundRect' ? '8px' : '0';
        return `<div style="${baseStyle}background:${ge.fillColor};border:${ge.borderWidth}px solid ${ge.borderColor};border-radius:${radius};"></div>`;
      }
      if (el.type === 'line') {
        const le = el as LineElement;
        const isVert = le.orientation === 'vertical';
        const lineAttrs = isVert
          ? `x1="${le.width / 2}mm" y1="0" x2="${le.width / 2}mm" y2="${le.height}mm"`
          : `x1="0" y1="${le.height / 2}mm" x2="${le.width}mm" y2="${le.height / 2}mm"`;
        return `<svg style="${baseStyle}overflow:visible;"><line ${lineAttrs} stroke="${le.color || '#000'}" stroke-width="${le.strokeWidth}" /></svg>`;
      }
      if (el.type === 'picture') {
        const pe = el as PictureElement;
        const fit = pe.objectFit || 'cover';
        const radius = pe.shape === 'oval' ? '50%' : pe.shape === 'rounded' ? '8px' : '0';
        const imgTag = pe.imageSrc
          ? `<img src="${escapeHtml(pe.imageSrc)}" style="width:100%;height:100%;object-fit:${fit};display:block;" alt="" />`
          : '';
        return `<div style="${baseStyle}border:${pe.borderWidth || 0}px solid ${pe.borderColor || 'transparent'};border-radius:${radius};overflow:hidden;">${imgTag}</div>`;
      }
      if (el.type === 'table') {
        const te = el as TableElement;
        const rowsHtml = te.data
          .map(
            (row, rIdx) =>
              `<tr>${row
                .map((cell) => {
                  const isHead = te.headerRow && rIdx === 0;
                  return `<td style="border:1px solid ${te.borderColor || '#94a3b8'};padding:4px 6px;font-family:${resolveFontStack(te.fontFamily)};font-size:${te.fontSize}pt;color:${te.color || '#000'};text-align:right;background:${isHead ? '#f1f5f9' : 'transparent'};font-weight:${isHead ? 'bold' : 'normal'};">${escapeHtml(cell)}</td>`;
                })
                .join('')}</tr>`
          )
          .join('');
        return `<div style="${baseStyle}overflow:hidden;"><table dir="rtl" style="width:100%;height:100%;border-collapse:collapse;">${rowsHtml}</table></div>`;
      }
      return '';
    };

    const pagesHtml = project.pages
      .map((p) => {
        const elems = [...project.masterElements, ...p.elements]
          .map((el) => renderElHtml(el, p.pageNumber))
          .join('\n');
        return `<section class="page" style="position:relative;width:${project.pageSetup.widthMm}mm;height:${project.pageSetup.heightMm}mm;background:#fff;margin:16px auto;box-shadow:0 4px 20px rgba(0,0,0,0.12);overflow:hidden;">\n${elems}\n</section>`;
      })
      .join('\n');

    const html = `<!doctype html>\n<html lang="ur" dir="rtl">\n<head>\n<meta charset="UTF-8" />\n<title>${escapeHtml(project.title || 'Qalam Urdu Studio Export')}</title>\n<link href="https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Amiri:wght@400;700&family=Aref+Ruqaa:wght@400;700&family=Gulzar&family=Lateef:wght@400;700&family=Noto+Kufi+Arabic:wght@400;700&family=Noto+Nastaliq+Urdu:wght@400;700&family=Noto+Sans+Arabic:wght@400;700&family=Rakkas&family=Readex+Pro:wght@400;600&family=Reem+Kufi:wght@400;700&family=Scheherazade+New:wght@400;700&display=swap" rel="stylesheet">\n<style>body{margin:0;padding:20px;background:#e5e7eb;}@media print{body{background:#fff;padding:0;}.page{box-shadow:none!important;margin:0!important;page-break-after:always;}}</style>\n</head>\n<body>\n${pagesHtml}\n</body>\n</html>`;

    const saved = await saveFile(
      `${project.title || 'qalam_studio'}_unicode.html`,
      html,
      'text/html;charset=utf-8'
    );
    if (saved) showToast('Exported Unicode HTML page');
  };

  // Convert English digits in all text frames to Urdu numerals
  const handleConvertNumbersToUrdu = () => {
    const convert = (t: string) => {
      let res = t;
      Object.entries(URDU_NUMERALS).forEach(([eng, urd]) => {
        res = res.replaceAll(eng, urd);
      });
      return res;
    };

    const newProject: DocumentProject = {
      ...project,
      pages: project.pages.map((p) => ({
        ...p,
        elements: p.elements.map((el) => {
          if (el.type === 'text') {
            return { ...el, text: convert((el as TextElement).text) };
          }
          return el;
        }),
      })),
    };
    pushState(newProject);
    showToast('Converted digits to Urdu numerals (۰-۹)');
  };

  // Strip Arabic/Urdu diacritics (اعراب صاف کریں)
  const handleStripDiacritics = () => {
    const newProject: DocumentProject = {
      ...project,
      pages: project.pages.map((p, idx) => {
        if (idx !== activePageIndex) return p;
        return {
          ...p,
          elements: p.elements.map((el) => {
            if (el.type === 'text' && (!selectedElementId || el.id === selectedElementId)) {
              return { ...el, text: stripUrduDiacritics((el as TextElement).text) };
            }
            return el;
          }),
        };
      }),
    };
    pushState(newProject);
    showToast('Stripped diacritics (اعراب صاف)');
  };

  // Insert automatic {{PAGE}} footer frame
  const handleInsertPageNumberToken = () => {
    const footerW = 48;
    const x = Math.max(0, Math.round(((project.pageSetup.widthMm - footerW) / 2) * 10) / 10);
    const y = Math.max(
      10,
      Math.round((project.pageSetup.heightMm - project.pageSetup.margins.bottom + 2) * 10) / 10
    );
    const tokenElem: TextElement = {
      id: `elem-${Date.now()}`,
      type: 'text',
      x,
      y,
      width: footerW,
      height: 12,
      rotation: 0,
      text: 'صفحہ {{PAGE}}',
      fontFamily: 'Noto Nastaliq Urdu',
      fontSize: 10,
      lineHeight: 2.0,
      letterSpacing: 0,
      align: 'center',
      direction: 'rtl',
      color: '#334155',
      bold: false,
      italic: false,
      underline: false,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      columns: 1,
      columnGutter: 4,
    };
    handleAddElement(tokenElem);
    showToast('Inserted auto {{PAGE}} number frame');
  };

  // Find and Replace Across Document
  const handleReplaceAll = (findText: string, replaceText: string, matchCase: boolean): number => {
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, matchCase ? 'g' : 'gi');
    let totalCount = 0;

    const newProject: DocumentProject = {
      ...project,
      pages: project.pages.map((p) => ({
        ...p,
        elements: p.elements.map((el) => {
          if (el.type === 'text') {
            const te = el as TextElement;
            const matches = te.text.match(regex);
            if (matches) {
              totalCount += matches.length;
              return { ...el, text: te.text.replace(regex, replaceText) };
            }
          }
          return el;
        }),
      })),
    };
    if (totalCount > 0) {
      pushState(newProject);
    }
    return totalCount;
  };

  // Load Template
  const handleLoadTemplate = (templateId: string) => {
    const found = TEMPLATES.find((t) => t.id === templateId);
    if (found) {
      setDialog({
        isOpen: true,
        type: 'confirm',
        title: 'Load Template (سانچہ لوڈ کریں)',
        message: `Load template: "${found.name}"?\nCurrent unsaved changes will be replaced.`,
        onConfirm: () => {
          const newProj = found.getProject();
          pushState(newProj);
          setActivePageIndex(0);
          setSelectedElementId(null);
          setEditingTextId(null);
          setIsModified(false);
          showToast(`Loaded ${found.name}`);
        },
      });
    }
  };

  // Add Page
  const handleAddPage = () => {
    const newPageNum = project.pages.length + 1;
    const newPage = {
      id: `page-${Date.now()}`,
      pageNumber: newPageNum,
      elements: [],
    };
    pushState({
      ...project,
      pages: [...project.pages, newPage],
    });
    setActivePageIndex(project.pages.length);
    setSelectedElementId(null);
    setEditingTextId(null);
    showToast(`Added Page ${newPageNum}`);
  };

  // Duplicate Current Page
  const handleDuplicatePage = () => {
    const clonedElements = currentPage.elements.map((el, i) => ({
      ...JSON.parse(JSON.stringify(el)),
      id: `elem-${Date.now()}-${i}`,
    }));
    const newPageNum = project.pages.length + 1;
    const newPage = {
      id: `page-${Date.now()}`,
      pageNumber: newPageNum,
      elements: clonedElements,
    };
    pushState({
      ...project,
      pages: [...project.pages, newPage],
    });
    setActivePageIndex(project.pages.length);
    setSelectedElementId(null);
    setEditingTextId(null);
    showToast(`Duplicated Page ${currentPage.pageNumber} → Page ${newPageNum}`);
  };

  // Delete Page
  const handleDeletePage = () => {
    if (project.pages.length <= 1) {
      setDialog({
        isOpen: true,
        type: 'warning',
        title: 'Delete Page',
        message: 'Cannot delete the only page in the document.',
        onConfirm: () => {},
      });
      return;
    }
    setDialog({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Page',
      message: `Are you sure you want to delete Page ${activePageIndex + 1}?`,
      onConfirm: () => {
        const remainingPages = project.pages
          .filter((_, idx) => idx !== activePageIndex)
          .map((p, idx) => ({ ...p, pageNumber: idx + 1 }));

        const nextIndex = Math.max(0, activePageIndex - 1);
        pushState({ ...project, pages: remainingPages });
        setActivePageIndex(nextIndex);
        setSelectedElementId(null);
        setEditingTextId(null);
        showToast('Page deleted');
      },
    });
  };

  return (
    <>
      <div
        className="w-full h-dvh flex flex-col overflow-hidden select-none text-slate-800 bg-[#eef1f6] font-modern no-print"
        dir="ltr"
      >
        {/* Hidden File Inputs for .qlm / .inp / .docx / .pdf / .txt upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".qlm,.qpg,.inp,.docx,.pdf,.txt,.json"
          onChange={handleOpenFile}
          className="hidden"
        />
        <input
          ref={wordFileInputRef}
          type="file"
          accept=".docx,.doc"
          onChange={handleOpenFile}
          className="hidden"
        />
        <input
          ref={pdfFileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleOpenFile}
          className="hidden"
        />
        <input
          ref={txtFileInputRef}
          type="file"
          accept=".txt,text/plain"
          onChange={handleOpenFile}
          className="hidden"
        />

        {/* 1. Balanced 3-Zone Title Bar */}
        <TitleBar
          fileName={project.fileName}
          isModified={isModified}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onNew={handleNewBlankTab}
          onOpen={() => fileInputRef.current?.click()}
          onSave={handleSaveProject}
          onPrintPreview={() => setIsPrintPreviewOpen(true)}
          onPrint={() => void printDocument()}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onRenameDocument={() => setIsDocSetupOpen(true)}
          onOpenDictionary={() => setIsDictionaryOpen(true)}
          language={language}
          onToggleLanguage={handleToggleLanguage}
          onCloseApp={handleExitApp}
          onOpenDownload={() => setIsDownloadOpen(true)}
        />

      {/* 2. Microsoft Word-Style Tabbed Ribbon */}
      <RibbonToolbar
        selectedElement={selectedElement}
        onUpdateElement={(updated) =>
          selectedElementId && handleUpdateElement(selectedElementId, updated)
        }
        pageSetup={project.pageSetup}
        zoom={zoom}
        onSetZoom={(z) => setZoom(z)}
        showGuides={showGuides}
        showRulers={showRulers}
        snapToGrid={snapToGrid}
        showRibbon={showRibbon}
        isMasterPage={isMasterPage}
        onToggleGuides={() => setShowGuides((prev) => !prev)}
        onToggleRulers={() => setShowRulers((prev) => !prev)}
        onToggleSnapGrid={() => setSnapToGrid((prev) => !prev)}
        onToggleRibbon={() => setShowRibbon((prev) => !prev)}
        onToggleMasterPage={() => setIsMasterPage((prev) => !prev)}
        language={language}
        keyboardLayout={keyboardLayout}
        onToggleLanguage={handleToggleLanguage}
        onChangeKeyboardLayout={(layout) => setKeyboardLayout(layout)}
        hasClipboard={Boolean(clipboardElement)}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onDuplicateSelected={handleDuplicateSelected}
        onDeleteSelected={handleDeleteSelected}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onCenterHorizontal={handleCenterHorizontal}
        onFitTextBox={handleFitTextBox}
        onTableAction={handleTableAction}
        onInsertElement={(type) => setActiveTool(type as ToolType)}
        onInsertPageNumberToken={handleInsertPageNumberToken}
        onAddPage={handleAddPage}
        onDuplicatePage={handleDuplicatePage}
        onDeletePage={handleDeletePage}
        onConvertNumbersToUrdu={handleConvertNumbersToUrdu}
        onStripDiacritics={handleStripDiacritics}
        onApplyDefaultFont={handleApplyDefaultFont}
        onNewBlankTab={handleNewBlankTab}
        onNewTemplateTab={handleNewTemplateTab}
        onOpen={() => fileInputRef.current?.click()}
        onOpenWord={() => wordFileInputRef.current?.click()}
        onOpenPdf={() => pdfFileInputRef.current?.click()}
        onOpenTxt={() => txtFileInputRef.current?.click()}
        onSave={handleSaveProject}
        onSaveAsInp={handleSaveAsInp}
        onExportPdf={handleExportPdf}
        onExportDocx={handleExportDocx}
        onExportTxt={handleExportTxt}
        onExportHtml={handleExportHtml}
        onExportImage={handleExportPng}
        onPrintPreview={() => setIsPrintPreviewOpen(true)}
        onPrint={() => void printDocument()}
        onOpenDocSetup={() => setIsDocSetupOpen(true)}
        onOpenKeyboard={() => setIsKeyboardOpen(true)}
        onOpenSymbols={() => setIsSymbolsOpen(true)}
        onOpenStoryEditor={() => setIsStoryEditorOpen(true)}
        onOpenFindReplace={() => setIsFindReplaceOpen(true)}
        onOpenWordCount={() => setIsWordCountOpen(true)}
        onOpenDictionary={() => setIsDictionaryOpen(true)}
        onOpenDownload={() => setIsDownloadOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onExit={handleExitApp}
      />

      {/* 3. Multi-Document Tabs Bar */}
      <DocumentTabs
        tabs={tabs}
        activeTabId={activeTab.id}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onNewBlankTab={handleNewBlankTab}
        onNewTemplateTab={handleNewTemplateTab}
      />

      {/* 4. Main Desktop / Mobile Workspace (Toolbox + Rulers + Canvas) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
        {/* Left Vertical Toolbox (Desktop) / Bottom Dock (Mobile) */}
        <Toolbox
          activeTool={activeTool}
          onSelectTool={(tool) => setActiveTool(tool)}
          isMasterPage={isMasterPage}
          onToggleMasterPage={() => setIsMasterPage(!isMasterPage)}
        />

        {/* Central Workspace: Top Ruler + Left Ruler + Canvas */}
        <div ref={workspaceRef} className="order-1 md:order-2 flex-1 flex flex-col overflow-hidden min-h-0">
          {showRulers && (
            <div className="hidden sm:flex items-center">
              <div
                title="Ruler units: millimeters (mm)"
                className="w-5 h-5 shrink-0 no-print flex items-center justify-center text-[7px] font-mono tabular-nums bg-slate-200/80 border-r border-b border-slate-300 text-slate-500"
              >
                mm
              </div>
              <HorizontalRuler
                pageWidthMm={project.pageSetup.widthMm}
                zoom={zoom}
                cursorX={cursorPos.x}
                offsetX={pageOffsets.x}
                margins={{
                  left: project.pageSetup.margins.left,
                  right: project.pageSetup.margins.right,
                }}
              />
            </div>
          )}

          <div className="flex-1 flex overflow-hidden min-h-0">
            {showRulers && (
              <div className="hidden sm:flex">
                <VerticalRuler
                  pageHeightMm={project.pageSetup.heightMm}
                  zoom={zoom}
                  cursorY={cursorPos.y}
                  offsetY={pageOffsets.y}
                  margins={{
                    top: project.pageSetup.margins.top,
                    bottom: project.pageSetup.margins.bottom,
                  }}
                />
              </div>
            )}

            <DocumentCanvas
              pageSetup={project.pageSetup}
              pageNumber={currentPage.pageNumber}
              elements={currentPage.elements}
              masterElements={project.masterElements}
              isMasterPage={isMasterPage}
              activeTool={activeTool}
              selectedElementId={selectedElementId}
              onSelectElement={(id) => setSelectedElementId(id)}
              onUpdateElement={handleUpdateElement}
              onAddElement={handleAddElement}
              onCursorMove={(xMm, yMm) => setCursorPos({ x: xMm, y: yMm })}
              onPageBoundsChange={(x, y) =>
                setPageOffsets((prev) => (prev.x === x && prev.y === y ? prev : { x, y }))
              }
              zoom={zoom}
              onZoomChange={(newZoom) => setZoom(newZoom)}
              showGuides={showGuides}
              snapToGrid={snapToGrid}
              language={language}
              keyboardLayout={keyboardLayout}
              defaultFontFamily={defaultFontFamily}
              defaultFontSize={defaultFontSize}
              onEditPicture={handleEditPicture}
              onContextMenuElement={(x, y, elem) => setContextMenu({ x, y, element: elem })}
              editingTextId={editingTextId}
              setEditingTextId={setEditingTextId}
            />
          </div>
        </div>

        {/* Non-blocking Studio Toast Notification */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-24 md:bottom-11 right-3 md:right-4 z-40 px-3 py-2 bg-slate-900/95 text-white text-xs font-medium rounded-md shadow-lg border border-slate-700 flex items-center gap-2 no-print animate-toast-in max-w-[calc(100vw-24px)]"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        )}
      </div>

      {/* 5. Bottom Status Bar */}
      <StatusBar
        currentPage={activePageIndex + 1}
        totalPages={project.pages.length}
        pageSetup={project.pageSetup}
        onPageChange={(page) => {
          setActivePageIndex(page - 1);
          setSelectedElementId(null);
          setEditingTextId(null);
        }}
        onAddPage={handleAddPage}
        isMasterPage={isMasterPage}
        onToggleMasterPage={() => setIsMasterPage(!isMasterPage)}
        activeTool={activeTool}
        cursorX={cursorPos.x}
        cursorY={cursorPos.y}
        zoom={zoom}
        onZoomChange={(newZoom) => setZoom(newZoom)}
        onFitZoom={handleFitZoom}
        language={language}
        keyboardLayout={keyboardLayout}
        onCycleKeyboardLayout={handleCycleKeyboardLayout}
        onToggleLanguage={handleToggleLanguage}
      />

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          element={contextMenu.element}
          hasClipboard={Boolean(clipboardElement)}
          onClose={() => setContextMenu(null)}
          onEditText={() => {
            if (contextMenu.element?.type === 'text') {
              setSelectedElementId(contextMenu.element.id);
              setEditingTextId(contextMenu.element.id);
            }
          }}
          onOpenStoryEditor={() => {
            if (contextMenu.element) setSelectedElementId(contextMenu.element.id);
            setIsStoryEditorOpen(true);
          }}
          onOpenDictionary={() => setIsDictionaryOpen(true)}
          onFitTextBox={() => {
            if (contextMenu.element?.type === 'text') {
              setSelectedElementId(contextMenu.element.id);
              handleFitTextBox();
            }
          }}
          onToggleDirection={() => {
            if (contextMenu.element?.type === 'text') {
              const te = contextMenu.element as TextElement;
              handleUpdateElement(te.id, { direction: te.direction === 'rtl' ? 'ltr' : 'rtl' });
            }
          }}
          onCenterHorizontal={handleCenterHorizontal}
          onEditPicture={() => {
            if (contextMenu.element?.type === 'picture') {
              handleEditPicture(contextMenu.element as PictureElement);
            }
          }}
          onCut={handleCut}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onDuplicate={handleDuplicateSelected}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          onToggleLock={() => {
            if (contextMenu.element) {
              handleUpdateElement(contextMenu.element.id, { locked: !contextMenu.element.locked });
            }
          }}
          onDelete={handleDeleteSelected}
        />
      )}

      {/* Modals */}
      <VirtualKeyboardModal
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        onInsertChar={handleInsertChar}
        keyboardLayout={keyboardLayout}
        onChangeKeyboardLayout={(layout) => setKeyboardLayout(layout)}
      />

      <StoryEditorModal
        isOpen={isStoryEditorOpen}
        onClose={() => setIsStoryEditorOpen(false)}
        selectedTextElement={
          selectedElement?.type === 'text' ? (selectedElement as TextElement) : null
        }
        onSaveStory={(newText, fontFamily) => {
          if (selectedElementId) {
            handleUpdateElement(selectedElementId, { text: newText, fontFamily });
            showToast('Story updated');
          }
        }}
        language={language}
        keyboardLayout={keyboardLayout}
        onToggleLanguage={handleToggleLanguage}
      />

      <DocumentSetupModal
        isOpen={isDocSetupOpen}
        onClose={() => setIsDocSetupOpen(false)}
        title={project.title}
        fileName={project.fileName}
        pageSetup={project.pageSetup}
        onApply={(newSetup: PageSetup, newTitle: string, newFileName: string) => {
          pushState({
            ...project,
            title: newTitle,
            fileName: newFileName,
            pageSetup: newSetup,
          });
          showToast(`Updated document setup (${newFileName})`);
        }}
      />

      <SymbolPickerModal
        isOpen={isSymbolsOpen}
        onClose={() => setIsSymbolsOpen(false)}
        onInsertSymbol={handleInsertChar}
      />

      <FindReplaceModal
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        onReplaceAll={handleReplaceAll}
      />

      <WordCountModal
        isOpen={isWordCountOpen}
        onClose={() => setIsWordCountOpen(false)}
        elements={activeElements}
        allPages={project.pages}
      />

      <UrduDictionaryModal
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
        onInsertWord={handleInsertDictionaryWord}
        onCopyWord={handleCopyDictionaryWord}
        canInsertIntoText={selectedElement?.type === 'text'}
        keyboardLayout={keyboardLayout}
      />

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        project={project}
        initialPageIndex={activePageIndex}
        onPrint={() => void printDocument()}
        onExportPdf={handleExportPdf}
        onExportDocx={handleExportDocx}
      />

      <DownloadAppModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        onSaveProject={handleSaveProject}
        onSaveAsInp={handleSaveAsInp}
        onExportPdf={handleExportPdf}
        onExportDocx={handleExportDocx}
        onExportPng={handleExportPng}
        onPrintPreview={() => setIsPrintPreviewOpen(true)}
        onPrint={() => void printDocument()}
      />

      {/* Message Box Dialog */}
      <WindowsMessageBox dialog={dialog} onClose={() => setDialog(null)} />
    </div>

    {/* Dedicated 1:1 Physical Millimeter Print Root (prints all pages cleanly at 100% scale) */}
    <div id="qalam-print-root" className="hidden print:block">
      {project.pages.map((pg) => (
        <PrintablePageView
          key={pg.id}
          page={pg}
          pageSetup={project.pageSetup}
          masterElements={project.masterElements}
          className="qalam-print-sheet"
        />
      ))}
    </div>
    </>
  );
}
