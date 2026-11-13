import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  DocElement,
  PageSetup,
  ToolType,
  TextElement,
  PictureElement,
  GraphicElement,
  LineElement,
  TableElement,
  KeyboardLayout,
} from '../types/inpage';
import { translateUrduKey, URDU_NUMERALS } from '../utils/phoneticKeyboard';
import { resolveFontStack } from '../utils/fonts';
import { Link2, Lock, Plus, Edit3, Image as ImageIcon, MoreHorizontal } from 'lucide-react';

interface DocumentCanvasProps {
  pageSetup: PageSetup;
  pageNumber: number;
  elements: DocElement[];
  masterElements: DocElement[];
  isMasterPage: boolean;
  activeTool: ToolType;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updated: Partial<DocElement>) => void;
  onAddElement: (element: DocElement) => void;
  onCursorMove: (xMm: number, yMm: number) => void;
  onPageBoundsChange?: (offsetX: number, offsetY: number) => void;
  zoom: number;
  onZoomChange?: (newZoom: number) => void;
  showGuides: boolean;
  snapToGrid?: boolean;
  language: 'urdu' | 'english';
  keyboardLayout: KeyboardLayout;
  defaultFontFamily?: string;
  defaultFontSize?: number;
  onEditPicture?: (elem: PictureElement) => void;
  onContextMenuElement?: (x: number, y: number, elem: DocElement | null) => void;
  editingTextId: string | null;
  setEditingTextId: (id: string | null) => void;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
  pageSetup,
  pageNumber,
  elements,
  masterElements,
  isMasterPage,
  activeTool,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onAddElement,
  onCursorMove,
  onPageBoundsChange,
  zoom,
  onZoomChange,
  showGuides,
  snapToGrid = false,
  language,
  keyboardLayout,
  defaultFontFamily = 'Noto Nastaliq Urdu',
  defaultFontSize = 11,
  onEditPicture,
  onContextMenuElement,
  editingTextId,
  setEditingTextId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const snapVal = (v: number) => (snapToGrid ? Math.round(v / 5) * 5 : Math.round(v));

  const mmToPx = (mm: number) => mm * 3.78 * zoom;
  const pxToMm = (px: number) => px / (3.78 * zoom);

  const syncPageBounds = useCallback(() => {
    if (!containerRef.current || !pageRef.current || !onPageBoundsChange) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const pageRect = pageRef.current.getBoundingClientRect();
    onPageBoundsChange(
      Math.round(pageRect.left - containerRect.left),
      Math.round(pageRect.top - containerRect.top)
    );
  }, [onPageBoundsChange]);

  useEffect(() => {
    syncPageBounds();
    const raf = requestAnimationFrame(syncPageBounds);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current && pageRef.current) {
      ro = new ResizeObserver(() => syncPageBounds());
      ro.observe(containerRef.current);
      ro.observe(pageRef.current);
    }
    window.addEventListener('resize', syncPageBounds);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener('resize', syncPageBounds);
    };
  }, [syncPageBounds, zoom, pageSetup.widthMm, pageSetup.heightMm, isMasterPage, activeTool]);

  // Ctrl + Mouse Wheel smooth zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && onZoomChange) {
      e.preventDefault();
      const step = e.deltaY < 0 ? 0.1 : -0.1;
      const next = Math.min(2.5, Math.max(0.35, Number((zoom + step).toFixed(2))));
      onZoomChange(next);
    }
  };

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    isResizing: boolean;
    isRotating: boolean;
    resizeHandle?: string;
    startX: number;
    startY: number;
    elementStartX: number;
    elementStartY: number;
    elementStartW: number;
    elementStartH: number;
    elementStartRot: number;
  }>({
    isDragging: false,
    isResizing: false,
    isRotating: false,
    startX: 0,
    startY: 0,
    elementStartX: 0,
    elementStartY: 0,
    elementStartW: 0,
    elementStartH: 0,
    elementStartRot: 0,
  });

  const [drawingState, setDrawingState] = useState<{
    isDrawing: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);

  const displayedElements = isMasterPage ? masterElements : elements;
  const selectedElement = displayedElements.find((e) => e.id === selectedElementId) || null;

  const handlePagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;
    const xMm = Math.max(0, Math.min(pageSetup.widthMm, pxToMm(xPx)));
    const yMm = Math.max(0, Math.min(pageSetup.heightMm, pxToMm(yPx)));
    onCursorMove(xMm, yMm);

    if (drawingState?.isDrawing) {
      setDrawingState((prev) => (prev ? { ...prev, currentX: xMm, currentY: yMm } : null));
    }

    if (dragState.isRotating && selectedElement && !selectedElement.locked) {
      const deltaX = e.clientX - dragState.startX;
      const newRot = Math.round((dragState.elementStartRot + deltaX * 0.6) % 360);
      onUpdateElement(selectedElement.id, { rotation: newRot });
      return;
    }

    if (dragState.isDragging && selectedElement && !selectedElement.locked) {
      const deltaX = pxToMm(e.clientX - dragState.startX);
      const deltaY = pxToMm(e.clientY - dragState.startY);
      const newX = snapVal(dragState.elementStartX + deltaX);
      const newY = snapVal(dragState.elementStartY + deltaY);
      onUpdateElement(selectedElement.id, { x: newX, y: newY });
    }

    if (dragState.isResizing && selectedElement && dragState.resizeHandle && !selectedElement.locked) {
      const deltaX = pxToMm(e.clientX - dragState.startX);
      const deltaY = pxToMm(e.clientY - dragState.startY);
      const handle = dragState.resizeHandle;

      let newW = dragState.elementStartW;
      let newH = dragState.elementStartH;
      let newX = dragState.elementStartX;
      let newY = dragState.elementStartY;

      const minDim = selectedElement.type === 'line' ? 2 : 8;

      if (handle.includes('e')) newW = Math.max(minDim, dragState.elementStartW + deltaX);
      if (handle.includes('s')) newH = Math.max(minDim, dragState.elementStartH + deltaY);
      if (handle.includes('w')) {
        const potentialW = dragState.elementStartW - deltaX;
        if (potentialW >= minDim) {
          newW = potentialW;
          newX = dragState.elementStartX + deltaX;
        }
      }
      if (handle.includes('n')) {
        const potentialH = dragState.elementStartH - deltaY;
        if (potentialH >= minDim) {
          newH = potentialH;
          newY = dragState.elementStartY + deltaY;
        }
      }

      onUpdateElement(selectedElement.id, {
        x: snapVal(newX),
        y: snapVal(newY),
        width: snapVal(newW),
        height: snapVal(newH),
      });
    }
  };

  const handlePagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pageRef.current || (e.pointerType === 'mouse' && e.button === 2)) return;
    const rect = pageRef.current.getBoundingClientRect();
    const xMm = pxToMm(e.clientX - rect.left);
    const yMm = pxToMm(e.clientY - rect.top);

    if (['textBox', 'titleBox', 'picRect', 'picOval', 'picRound', 'graphic', 'line', 'table'].includes(activeTool)) {
      setDrawingState({
        isDrawing: true,
        startX: xMm,
        startY: yMm,
        currentX: xMm,
        currentY: yMm,
      });
      return;
    }

    // Clicking empty page with I-Beam Text Tool creates a quick text frame and focuses it
    if (
      activeTool === 'text' &&
      (e.target === pageRef.current || (e.target as HTMLElement).classList.contains('page-background'))
    ) {
      const newId = `elem-${Date.now()}`;
      const newElem: TextElement = {
        id: newId,
        type: 'text',
        x: Math.max(pageSetup.margins.left, Math.min(pageSetup.widthMm - 60, Math.round(xMm))),
        y: Math.max(pageSetup.margins.top, Math.min(pageSetup.heightMm - 30, Math.round(yMm))),
        width: 75,
        height: 32,
        text: '',
        fontFamily: defaultFontFamily,
        fontSize: defaultFontSize,
        lineHeight: 1.85,
        letterSpacing: 0,
        color: '#111827',
        bold: false,
        italic: false,
        underline: false,
        align: language === 'urdu' ? 'right' : 'left',
        direction: language === 'urdu' ? 'rtl' : 'ltr',
        borderColor: '#cbd5e1',
        borderWidth: 0.5,
        borderStyle: 'solid',
      };
      onAddElement(newElem);
      onSelectElement(newId);
      setEditingTextId(newId);
      return;
    }

    if (e.target === pageRef.current || (e.target as HTMLElement).classList.contains('page-background')) {
      onSelectElement(null);
      setEditingTextId(null);
      setLinkSourceId(null);
    }
  };

  const handlePagePointerUp = () => {
    if (drawingState?.isDrawing) {
      const minX = Math.min(drawingState.startX, drawingState.currentX);
      const minY = Math.min(drawingState.startY, drawingState.currentY);
      const rawW = Math.abs(drawingState.currentX - drawingState.startX);
      const rawH = Math.abs(drawingState.currentY - drawingState.startY);
      const w = Math.max(15, rawW);
      const h = Math.max(10, rawH);

      const newId = `elem-${Date.now()}`;
      let newElem: DocElement;

      switch (activeTool) {
        case 'titleBox':
          newElem = {
            id: newId,
            type: 'text',
            isTitleBox: true,
            x: Math.round(minX),
            y: Math.round(minY),
            width: Math.max(60, Math.round(w)),
            height: Math.max(18, Math.round(h)),
            text: 'سرخی یہاں تحریر کیجئے',
            fontFamily: 'Gulzar',
            fontSize: 22,
            lineHeight: 1.5,
            letterSpacing: 0,
            color: '#0f2942',
            bold: true,
            italic: false,
            underline: false,
            align: 'center',
            direction: 'rtl',
          };
          break;
        case 'picRect':
        case 'picOval':
        case 'picRound':
          newElem = {
            id: newId,
            type: 'picture',
            x: Math.round(minX),
            y: Math.round(minY),
            width: Math.max(40, Math.round(w)),
            height: Math.max(35, Math.round(h)),
            imageSrc: '',
            caption: 'تصویر کا عنوان',
            shape: activeTool === 'picOval' ? 'oval' : activeTool === 'picRound' ? 'rounded' : 'rect',
            objectFit: 'cover',
            borderColor: '#4a5568',
            borderWidth: 1,
            borderStyle: 'solid',
          };
          break;
        case 'graphic':
          newElem = {
            id: newId,
            type: 'graphic',
            x: Math.round(minX),
            y: Math.round(minY),
            width: Math.max(30, Math.round(w)),
            height: Math.max(20, Math.round(h)),
            shape: 'rect',
            fillColor: '#f1f5f9',
            borderColor: '#0f2942',
            borderWidth: 1,
            borderStyle: 'solid',
          };
          break;
        case 'line': {
          const isVertical = rawH > rawW && rawH > 15;
          newElem = {
            id: newId,
            type: 'line',
            x: Math.round(minX),
            y: Math.round(minY),
            width: isVertical ? 2 : Math.max(40, Math.round(rawW)),
            height: isVertical ? Math.max(30, Math.round(rawH)) : 2,
            orientation: isVertical ? 'vertical' : 'horizontal',
            strokeWidth: 1.5,
            color: '#1a1a1a',
            style: 'solid',
          };
          break;
        }
        case 'table':
          newElem = {
            id: newId,
            type: 'table',
            x: Math.round(minX),
            y: Math.round(minY),
            width: Math.max(80, Math.round(w)),
            height: Math.max(40, Math.round(h)),
            rows: 3,
            cols: 3,
            data: [
              ['شمار', 'تفصیل', 'میزان'],
              ['۱', 'کتابی اشاعت', '۵,۰۰۰'],
              ['۲', 'رسالہ جات', '۲,۵۰۰'],
            ],
            headerRow: true,
            fontFamily: defaultFontFamily,
            fontSize: 10,
            color: '#1f2937',
            borderColor: '#64748b',
            borderWidth: 1,
          };
          break;
        case 'textBox':
        default:
          newElem = {
            id: newId,
            type: 'text',
            x: Math.round(minX),
            y: Math.round(minY),
            width: Math.max(40, Math.round(w)),
            height: Math.max(25, Math.round(h)),
            text: 'یہاں اپنا اردو مضمون تحریر کریں۔',
            fontFamily: defaultFontFamily,
            fontSize: defaultFontSize,
            lineHeight: 1.85,
            letterSpacing: 0,
            color: '#111827',
            bold: false,
            italic: false,
            underline: false,
            align: language === 'urdu' ? 'right' : 'left',
            direction: language === 'urdu' ? 'rtl' : 'ltr',
            borderColor: '#cbd5e1',
            borderWidth: 0.5,
            borderStyle: 'solid',
          };
          break;
      }

      onAddElement(newElem);
      onSelectElement(newId);
      setDrawingState(null);
    }

    setDragState({
      isDragging: false,
      isResizing: false,
      isRotating: false,
      startX: 0,
      startY: 0,
      elementStartX: 0,
      elementStartY: 0,
      elementStartW: 0,
      elementStartH: 0,
      elementStartRot: 0,
    });
  };

  const handleElementAction = (elem: DocElement) => {
    if (activeTool === 'text' && elem.type === 'text') {
      setEditingTextId(elem.id);
      return;
    }

    if (activeTool === 'link' && elem.type === 'text') {
      if (!linkSourceId) {
        setLinkSourceId(elem.id);
      } else if (linkSourceId !== elem.id) {
        onUpdateElement(linkSourceId, { linkedToId: elem.id });
        onUpdateElement(elem.id, { linkedFromId: linkSourceId });
        setLinkSourceId(null);
      }
      return;
    }

    if (activeTool === 'delink' && elem.type === 'text') {
      const te = elem as TextElement;
      if (te.linkedToId) {
        onUpdateElement(te.linkedToId, { linkedFromId: undefined });
      }
      if (te.linkedFromId) {
        onUpdateElement(te.linkedFromId, { linkedToId: undefined });
      }
      onUpdateElement(elem.id, { linkedToId: undefined, linkedFromId: undefined });
    }
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, elemId: string) => {
    if (language !== 'urdu') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
      return;
    }

    const translated = translateUrduKey(e.key, keyboardLayout);
    if (translated) {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart ?? 0;
      const end = target.selectionEnd ?? 0;
      const text = target.value;
      const newText = text.substring(0, start) + translated + text.substring(end);
      onUpdateElement(elemId, { text: newText });

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + translated.length;
      }, 0);
    }
  };

  const pageWidthPx = mmToPx(pageSetup.widthMm);
  const pageHeightPx = mmToPx(pageSetup.heightMm);
  const marginTopPx = mmToPx(pageSetup.margins.top);
  const marginBottomPx = mmToPx(pageSetup.margins.bottom);
  const marginLeftPx = mmToPx(pageSetup.margins.left);
  const marginRightPx = mmToPx(pageSetup.margins.right);

  const isDrawingTool = ['textBox', 'titleBox', 'picRect', 'picOval', 'picRound', 'graphic', 'line', 'table'].includes(activeTool);
  const isInteractiveGesture =
    dragState.isDragging ||
    dragState.isResizing ||
    dragState.isRotating ||
    Boolean(drawingState?.isDrawing);

  const cursorClass =
    activeTool === 'text'
      ? 'cursor-text'
      : activeTool === 'rotate'
      ? 'cursor-grab'
      : isDrawingTool
      ? 'cursor-crosshair'
      : 'cursor-default';

  return (
    <div
      ref={containerRef}
      onScroll={syncPageBounds}
      onWheel={handleWheel}
      onPointerMove={handlePagePointerMove}
      onPointerUp={handlePagePointerUp}
      onPointerCancel={handlePagePointerUp}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenuElement?.(e.clientX, e.clientY, selectedElement);
      }}
      dir="ltr"
      className={`flex-1 overflow-auto flex flex-col items-center p-3 sm:p-6 md:p-8 select-none relative ${
        isInteractiveGesture ? 'touch-none' : 'touch-pan-x touch-pan-y'
      } ${cursorClass}`}
      style={{
        backgroundColor: '#e2e8f0',
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 0)',
        backgroundSize: '16px 16px',
      }}
    >
      {/* Master Page Banner */}
      {isMasterPage && (
        <div className="mb-3 px-3 py-1 bg-amber-500 text-white text-xs font-semibold rounded-md shadow-sm flex items-center gap-2 no-print text-center">
          <span>Master Page Editing Mode — Elements placed here appear on all pages</span>
        </div>
      )}

      {/* Link Tool Helper Banner */}
      {activeTool === 'link' && (
        <div className="mb-3 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md shadow-sm no-print text-center">
          {linkSourceId
            ? 'Step 2: Now tap the target Text Box to complete the link'
            : 'Link Mode: Tap the first Text Box to link from'}
        </div>
      )}

      {/* Paper Canvas */}
      <div
        ref={pageRef}
        dir="ltr"
        onPointerDown={handlePagePointerDown}
        className={`bg-white relative overflow-hidden print-page select-none m-auto page-background shadow-[0_12px_36px_rgba(15,23,42,0.16)] ring-1 ring-slate-300/70 ${
          isDrawingTool ? 'touch-none' : ''
        }`}
        style={{
          width: `${pageWidthPx}px`,
          height: `${pageHeightPx}px`,
          minWidth: `${pageWidthPx}px`,
          minHeight: `${pageHeightPx}px`,
        }}
      >
        {/* Margin Guide Borders */}
        {showGuides && (
          <div
            className="absolute pointer-events-none border border-pink-400/50 z-0 no-print"
            style={{
              top: `${marginTopPx}px`,
              left: `${marginLeftPx}px`,
              right: `${marginRightPx}px`,
              bottom: `${marginBottomPx}px`,
            }}
          >
            {pageSetup.columns > 1 && (
              <div className="w-full h-full flex justify-between pointer-events-none">
                {Array.from({ length: pageSetup.columns - 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-full border-r border-dashed border-cyan-400/50"
                    style={{
                      width: `${100 / pageSetup.columns}%`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Snap Grid Overlay */}
        {snapToGrid && showGuides && (
          <div
            className="absolute inset-0 pointer-events-none z-0 no-print opacity-35"
            style={{
              backgroundImage: `radial-gradient(#64748b 0.8px, transparent 0.8px)`,
              backgroundSize: `${mmToPx(5)}px ${mmToPx(5)}px`,
            }}
          />
        )}

        {/* Master Page Elements */}
        {!isMasterPage &&
          masterElements.map((elem) => (
            <ElementRenderer
              key={elem.id}
              elem={elem}
              pageNumber={pageNumber}
              isInteractive={false}
              mmToPx={mmToPx}
              zoom={zoom}
              onSelectElement={onSelectElement}
              selectedElementId={selectedElementId}
              isEditing={false}
              activeTool={activeTool}
              linkSourceId={linkSourceId}
            />
          ))}

        {/* Current Page Elements */}
        {displayedElements.map((elem) => (
          <ElementRenderer
            key={elem.id}
            elem={elem}
            pageNumber={pageNumber}
            isInteractive={true}
            mmToPx={mmToPx}
            zoom={zoom}
            onSelectElement={onSelectElement}
            selectedElementId={selectedElementId}
            isEditing={editingTextId === elem.id}
            setEditingTextId={setEditingTextId}
            handleTextKeyDown={handleTextKeyDown}
            onUpdateElement={onUpdateElement}
            setDragState={setDragState}
            onEditPicture={onEditPicture}
            activeTool={activeTool}
            onElementToolAction={handleElementAction}
            onContextMenuElement={onContextMenuElement}
            linkSourceId={linkSourceId}
          />
        ))}

        {/* Temporary Drawing Box */}
        {drawingState?.isDrawing && (
          <div
            className="absolute border-2 border-dashed border-blue-600 bg-blue-50/30 pointer-events-none z-50"
            style={{
              left: `${mmToPx(Math.min(drawingState.startX, drawingState.currentX))}px`,
              top: `${mmToPx(Math.min(drawingState.startY, drawingState.currentY))}px`,
              width: `${mmToPx(Math.abs(drawingState.currentX - drawingState.startX))}px`,
              height: `${mmToPx(Math.abs(drawingState.currentY - drawingState.startY))}px`,
            }}
          />
        )}
      </div>
    </div>
  );
};

interface ElementRendererProps {
  elem: DocElement;
  pageNumber: number;
  isInteractive: boolean;
  mmToPx: (mm: number) => number;
  zoom: number;
  onSelectElement: (id: string | null) => void;
  selectedElementId: string | null;
  isEditing: boolean;
  setEditingTextId?: (id: string | null) => void;
  handleTextKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>, id: string) => void;
  onUpdateElement?: (id: string, updated: Partial<DocElement>) => void;
  setDragState?: React.Dispatch<React.SetStateAction<any>>;
  onEditPicture?: (elem: PictureElement) => void;
  activeTool: ToolType;
  onElementToolAction?: (elem: DocElement) => void;
  onContextMenuElement?: (x: number, y: number, elem: DocElement | null) => void;
  linkSourceId: string | null;
}

const ElementRenderer: React.FC<ElementRendererProps> = ({
  elem,
  pageNumber,
  isInteractive,
  mmToPx,
  zoom,
  onSelectElement,
  selectedElementId,
  isEditing,
  setEditingTextId,
  handleTextKeyDown,
  onUpdateElement,
  setDragState,
  onEditPicture,
  activeTool,
  onElementToolAction,
  onContextMenuElement,
  linkSourceId,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [hasTextOverflow, setHasTextOverflow] = useState(false);
  const textBoxRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedElementId === elem.id;
  const isLinkSource = linkSourceId === elem.id;
  const leftPx = mmToPx(elem.x);
  const topPx = mmToPx(elem.y);
  const widthPx = mmToPx(elem.width);
  const heightPx = mmToPx(elem.height);

  useEffect(() => {
    setImgFailed(false);
  }, [elem.type === 'picture' ? (elem as PictureElement).imageSrc : '']);

  useEffect(() => {
    if (elem.type !== 'text' || isEditing || !textBoxRef.current) {
      setHasTextOverflow(false);
      return;
    }
    const el = textBoxRef.current;
    setHasTextOverflow(el.scrollHeight > el.clientHeight + 3);
  }, [elem, zoom, isEditing]);

  const handleFitBoxHeight = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (elem.type !== 'text' || !textBoxRef.current || !onUpdateElement) return;
    const neededPx = textBoxRef.current.scrollHeight + Math.max(8, 6 * zoom);
    const neededMm = Math.ceil(neededPx / (3.78 * zoom));
    onUpdateElement(elem.id, { height: Math.max(elem.height, neededMm) });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isInteractive) return;
    e.stopPropagation();
    onSelectElement(elem.id);

    if (e.pointerType === 'mouse' && e.button === 2) return;

    if (activeTool === 'text' || activeTool === 'link' || activeTool === 'delink') {
      onElementToolAction?.(elem);
      return;
    }

    if (activeTool === 'rotate' && setDragState && !elem.locked) {
      setDragState({
        isDragging: false,
        isResizing: false,
        isRotating: true,
        startX: e.clientX,
        startY: e.clientY,
        elementStartX: elem.x,
        elementStartY: elem.y,
        elementStartW: elem.width,
        elementStartH: elem.height,
        elementStartRot: elem.rotation || 0,
      });
      return;
    }

    // On touch screens, require the element to already be selected before dragging so accidental finger scrolls pan the page cleanly
    if (setDragState && !elem.locked && !isEditing && (e.pointerType === 'mouse' || isSelected)) {
      setDragState({
        isDragging: true,
        isResizing: false,
        isRotating: false,
        startX: e.clientX,
        startY: e.clientY,
        elementStartX: elem.x,
        elementStartY: elem.y,
        elementStartW: elem.width,
        elementStartH: elem.height,
        elementStartRot: elem.rotation || 0,
      });
    }
  };

  const handleResizePointerDown = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    if (!setDragState || elem.locked) return;
    setDragState({
      isDragging: false,
      isResizing: true,
      isRotating: false,
      resizeHandle: handle,
      startX: e.clientX,
      startY: e.clientY,
      elementStartX: elem.x,
      elementStartY: elem.y,
      elementStartW: elem.width,
      elementStartH: elem.height,
      elementStartRot: elem.rotation || 0,
    });
  };

  return (
    <div
      id={elem.id}
      onPointerDown={handlePointerDown}
      onContextMenu={(e) => {
        if (!isInteractive) return;
        e.preventDefault();
        e.stopPropagation();
        onSelectElement(elem.id);
        onContextMenuElement?.(e.clientX, e.clientY, elem);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!isInteractive) return;
        if (elem.type === 'text' && setEditingTextId) {
          setEditingTextId(elem.id);
        } else if (elem.type === 'picture' && onEditPicture) {
          onEditPicture(elem as PictureElement);
        }
      }}
      className={`absolute transition-none group ${
        isSelected && isInteractive && !isEditing && !elem.locked ? 'touch-none' : ''
      } ${
        elem.locked ? 'cursor-not-allowed' : activeTool === 'text' ? 'cursor-text' : 'cursor-move'
      } ${
        isLinkSource
          ? 'ring-2 ring-emerald-500 z-30'
          : isSelected
          ? 'ring-1 ring-blue-600 ring-offset-0 z-30'
          : isInteractive
          ? 'hover:ring-1 hover:ring-blue-300 z-10'
          : 'pointer-events-none z-0'
      }`}
      style={{
        left: `${leftPx}px`,
        top: `${topPx}px`,
        width: `${widthPx}px`,
        height: `${heightPx}px`,
        transform: elem.rotation ? `rotate(${elem.rotation}deg)` : undefined,
        backgroundColor: elem.backgroundColor || 'transparent',
        borderWidth:
          elem.type !== 'line' && elem.borderWidth
            ? `${Math.max(1, elem.borderWidth * zoom)}px`
            : undefined,
        borderColor: elem.type !== 'line' ? elem.borderColor || 'transparent' : undefined,
        borderStyle: elem.type !== 'line' ? elem.borderStyle || 'none' : undefined,
        boxSizing: 'border-box',
      }}
    >
      {/* Status corner badges (Locked or Linked) */}
      {isSelected && elem.locked && (
        <div className="absolute -top-2.5 right-0 bg-amber-500 text-white p-0.5 rounded-xs shadow-xs z-40 no-print">
          <Lock className="w-2.5 h-2.5" />
        </div>
      )}
      {elem.type === 'text' && ((elem as TextElement).linkedToId || (elem as TextElement).linkedFromId) && (
        <div
          title="Linked Text Frame"
          className="absolute -top-2.5 left-0 bg-blue-600 text-white px-1 py-0.2 rounded-xs text-[8px] flex items-center gap-0.5 shadow-xs z-40 no-print"
        >
          <Link2 className="w-2.5 h-2.5" />
        </div>
      )}

      {/* Text Element (Nastaliq-safe vertical inset & live overflow detection) */}
      {elem.type === 'text' && (() => {
        const te = elem as TextElement;
        const fontSizePx = te.fontSize * (96 / 72) * zoom;
        const fontStack = resolveFontStack(te.fontFamily);
        const insetPx = mmToPx(te.paddingMm ?? 1.5);
        const padTop = Math.max(4, Math.round(fontSizePx * 0.28 + insetPx));
        const padBottom = Math.max(5, Math.round(fontSizePx * 0.34 + insetPx));
        const padSide = Math.max(5, Math.round(insetPx + 2 * zoom));
        const scaleFactor = (te.scaleX || 100) / 100;
        const pageNumStr = String(pageNumber);
        const localizedNum =
          (te.direction || 'rtl') === 'rtl'
            ? pageNumStr.replace(/[0-9]/g, (d) => URDU_NUMERALS[d] || d)
            : pageNumStr;
        const displayText = (te.text || '').replace(/\{\{PAGE\}\}/g, localizedNum);
        const transformOrigin =
          te.align === 'left' ? 'left top' : te.align === 'center' ? 'center top' : 'right top';

        return (
          <>
            <div
              ref={textBoxRef}
              data-text-container={elem.id}
              className="w-full h-full overflow-hidden box-border"
              style={{
                paddingTop: `${padTop}px`,
                paddingBottom: `${padBottom}px`,
                paddingLeft: `${padSide}px`,
                paddingRight: `${padSide}px`,
              }}
            >
              {isEditing ? (
                <textarea
                  autoFocus
                  value={te.text}
                  onChange={(e) => onUpdateElement?.(elem.id, { text: e.target.value })}
                  onKeyDown={(e) => handleTextKeyDown?.(e, elem.id)}
                  onBlur={() => setEditingTextId?.(null)}
                  className="w-full h-full resize-none outline-none border border-blue-400 bg-white/95 px-1.5 py-1 select-text cursor-text overflow-y-auto"
                  style={{
                    fontFamily: fontStack,
                    fontSize: `${fontSizePx.toFixed(2)}px`,
                    lineHeight: te.lineHeight || 1.85,
                    letterSpacing: te.letterSpacing ? `${(te.letterSpacing * zoom).toFixed(2)}px` : undefined,
                    textAlign: te.align || 'right',
                    direction: te.direction || 'rtl',
                    color: te.color || '#000',
                    fontWeight: te.bold ? 'bold' : 'normal',
                    fontStyle: te.italic ? 'italic' : 'normal',
                    textDecoration: te.underline ? 'underline' : 'none',
                    textRendering: 'optimizeLegibility',
                  }}
                />
              ) : (
                <div
                  className="w-full whitespace-pre-wrap break-words select-text"
                  style={{
                    fontFamily: fontStack,
                    fontSize: `${fontSizePx.toFixed(2)}px`,
                    lineHeight: te.lineHeight || 1.85,
                    letterSpacing: te.letterSpacing ? `${(te.letterSpacing * zoom).toFixed(2)}px` : undefined,
                    textAlign: te.align || 'right',
                    direction: te.direction || 'rtl',
                    color: te.color || '#000',
                    fontWeight: te.bold ? 'bold' : 'normal',
                    fontStyle: te.italic ? 'italic' : 'normal',
                    textDecoration: te.underline ? 'underline' : 'none',
                    textRendering: 'optimizeLegibility',
                    columnCount: te.columns && te.columns > 1 ? te.columns : undefined,
                    columnGap: te.columns && te.columns > 1 ? `${mmToPx(te.columnGutter ?? 4)}px` : undefined,
                    transform: scaleFactor !== 1 ? `scaleX(${scaleFactor})` : undefined,
                    transformOrigin,
                  }}
                >
                  {displayText}
                </div>
              )}
            </div>

            {hasTextOverflow && isInteractive && !te.linkedToId && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleFitBoxHeight}
                title="Text overflows frame — Click to expand box height to fit all Urdu text"
                className="absolute -bottom-2.5 left-1.5 bg-red-600 hover:bg-red-700 text-white w-5 h-5 md:w-4 md:h-4 rounded-xs flex items-center justify-center shadow-sm z-40 no-print cursor-pointer"
              >
                <Plus className="w-3 h-3" strokeWidth={3} />
              </button>
            )}
          </>
        );
      })()}

      {/* Picture Element */}
      {elem.type === 'picture' && (() => {
        const pe = elem as PictureElement;
        const fitClass =
          pe.objectFit === 'contain'
            ? 'object-contain'
            : pe.objectFit === 'fill'
            ? 'object-fill'
            : 'object-cover';
        return (
          <div
            className={`w-full h-full overflow-hidden relative flex flex-col items-center justify-center bg-slate-50 ${
              pe.shape === 'oval'
                ? 'rounded-full'
                : pe.shape === 'rounded'
                ? 'rounded-lg'
                : ''
            }`}
          >
            {pe.imageSrc && !imgFailed ? (
              <img
                src={pe.imageSrc}
                alt={pe.caption || 'Qalam Studio Picture'}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className={`w-full h-full ${fitClass} pointer-events-none`}
              />
            ) : (
              <div className="w-full h-full relative flex flex-col items-center justify-center border border-dashed border-slate-400 text-slate-500">
                <svg className="absolute inset-0 w-full h-full text-slate-300" preserveAspectRatio="none">
                  <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1" />
                  <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="1" />
                </svg>
                <span className="relative z-10 text-[10px] font-arabic-sans bg-white/90 px-2 py-1 rounded border border-slate-300 shadow-xs leading-normal">
                  تصویر منتخب کریں
                </span>
              </div>
            )}
            {pe.caption && (
              <div
                className="absolute bottom-0 inset-x-0 bg-black/65 text-white px-2 py-1.5 leading-[2.1] text-center font-nastaliq truncate"
                style={{ fontSize: `${Math.max(8, 9 * zoom).toFixed(1)}px` }}
              >
                {pe.caption}
              </div>
            )}
          </div>
        );
      })()}

      {/* Graphic Element */}
      {elem.type === 'graphic' && (
        <div
          className={`w-full h-full ${
            (elem as GraphicElement).shape === 'oval'
              ? 'rounded-full'
              : (elem as GraphicElement).shape === 'roundRect'
              ? 'rounded-lg'
              : ''
          }`}
          style={{ backgroundColor: (elem as GraphicElement).fillColor }}
        />
      )}

      {/* Line Element (Supports Horizontal and Vertical Orientations) */}
      {elem.type === 'line' && (() => {
        const le = elem as LineElement;
        const isVert = le.orientation === 'vertical';
        const lineBorder = `${Math.max(1, le.strokeWidth * zoom)}px ${le.style || 'solid'} ${le.color || '#1a1a1a'}`;
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div
              style={
                isVert
                  ? { height: '100%', width: 0, borderLeft: lineBorder }
                  : { width: '100%', height: 0, borderTop: lineBorder }
              }
            />
          </div>
        );
      })()}

      {/* Table Element */}
      {elem.type === 'table' && (
        <div className="w-full h-full overflow-auto bg-white" dir="rtl">
          <table
            className="w-full h-full border-collapse text-right leading-[1.75]"
            style={{
              fontFamily: resolveFontStack((elem as TableElement).fontFamily),
              fontSize: `${(((elem as TableElement).fontSize || 10) * (96 / 72) * zoom).toFixed(2)}px`,
            }}
          >
            <tbody>
              {(elem as TableElement).data.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx === 0 && (elem as TableElement).headerRow ? 'bg-slate-100 font-bold' : ''}>
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="border border-slate-400 p-1 text-center"
                      contentEditable={isSelected && !elem.locked}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const newData = (elem as TableElement).data.map((r) => [...r]);
                        newData[rIdx][cIdx] = e.currentTarget.innerText;
                        onUpdateElement?.(elem.id, { data: newData });
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Touch-friendly Floating Quick Action Pill when Selected */}
      {isSelected && isInteractive && !isEditing && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className={`absolute ${
            topPx < 36 ? '-bottom-8' : '-top-8'
          } right-0 flex items-center gap-1 bg-slate-900/95 text-white px-1.5 py-0.5 rounded-md shadow-lg border border-slate-700 z-50 no-print md:hidden`}
        >
          {elem.type === 'text' && setEditingTextId && !elem.locked && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditingTextId(elem.id);
              }}
              className="px-1.5 py-0.5 text-[10px] font-semibold flex items-center gap-1 rounded hover:bg-slate-700 active:bg-slate-600 whitespace-nowrap"
            >
              <Edit3 className="w-3 h-3 text-blue-400" />
              <span>Edit</span>
            </button>
          )}
          {elem.type === 'picture' && onEditPicture && !elem.locked && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditPicture(elem as PictureElement);
              }}
              className="px-1.5 py-0.5 text-[10px] font-semibold flex items-center gap-1 rounded hover:bg-slate-700 active:bg-slate-600 whitespace-nowrap"
            >
              <ImageIcon className="w-3 h-3 text-emerald-400" />
              <span>Image</span>
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              onContextMenuElement?.(rect.left, rect.bottom + 4, elem);
            }}
            aria-label="Object Actions"
            className="px-1.5 py-0.5 text-[10px] font-semibold flex items-center gap-1 rounded hover:bg-slate-700 active:bg-slate-600 whitespace-nowrap"
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-slate-300" />
            <span>Menu</span>
          </button>
        </div>
      )}

      {/* 8 Resize Handles (Larger touch hitboxes on mobile) */}
      {isSelected && isInteractive && !elem.locked && (
        <>
          <div onPointerDown={(e) => handleResizePointerDown(e, 'nw')} className="touch-none absolute -top-2 -left-2 w-4 h-4 md:-top-1 md:-left-1 md:w-2.5 md:h-2.5 bg-blue-600 border border-white rounded-xs cursor-nwse-resize z-40" />
          <div onPointerDown={(e) => handleResizePointerDown(e, 'n')} className="touch-none absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 md:-top-1 md:w-2.5 md:h-2.5 bg-blue-600 border border-white rounded-xs cursor-ns-resize z-40" />
          <div onPointerDown={(e) => handleResizePointerDown(e, 'ne')} className="touch-none absolute -top-2 -right-2 w-4 h-4 md:-top-1 md:-right-1 md:w-2.5 md:h-2.5 bg-blue-600 border border-white rounded-xs cursor-nesw-resize z-40" />
          <div onPointerDown={(e) => handleResizePointerDown(e, 'e')} className="touch-none absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-4 md:-right-1 md:w-2.5 md:h-2.5 bg-blue-600 border border-white rounded-xs cursor-ew-resize z-40" />
          <div onPointerDown={(e) => handleResizePointerDown(e, 'se')} className="touch-none absolute -bottom-2 -right-2 w-4 h-4 md:-bottom-1 md:-right-1 md:w-2.5 md:h-2.5 bg-blue-600 border border-white rounded-xs cursor-nwse-resize z-40" />
          <div onPointerDown={(e) => handleResizePointerDown(e, 's')} className="touch-none absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 md:-bottom-1 md:w-2.5 md:h-2.5 bg-blue-600 border border-white rounded-xs cursor-ns-resize z-40" />
          <div onPointerDown={(e) => handleResizePointerDown(e, 'sw')} className="touch-none absolute -bottom-2 -left-2 w-4 h-4 md:-bottom-1 md:-left-1 md:w-2.5 md:h-2.5 bg-blue-600 border border-white rounded-xs cursor-nesw-resize z-40" />
          <div onPointerDown={(e) => handleResizePointerDown(e, 'w')} className="touch-none absolute top-1/2 -translate-y-1/2 -left-2 w-4 h-4 md:-left-1 md:w-2.5 md:h-2.5 bg-blue-600 border border-white rounded-xs cursor-ew-resize z-40" />
        </>
      )}
    </div>
  );
};
