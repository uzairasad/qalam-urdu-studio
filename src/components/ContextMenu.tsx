import React, { useEffect, useRef } from 'react';
import {
  Scissors,
  Copy,
  Clipboard,
  Trash2,
  Lock,
  Unlock,
  FileText,
  Image as ImageIcon,
  CopyPlus,
  ArrowUpToLine,
  ArrowDownToLine,
  AlignHorizontalSpaceAround,
  Maximize2,
  ArrowLeftRight,
  BookOpen,
} from 'lucide-react';
import { DocElement } from '../types/inpage';

interface ContextMenuProps {
  x: number;
  y: number;
  element: DocElement | null;
  hasClipboard: boolean;
  onClose: () => void;
  onEditText?: () => void;
  onOpenStoryEditor?: () => void;
  onOpenDictionary?: () => void;
  onFitTextBox?: () => void;
  onToggleDirection?: () => void;
  onCenterHorizontal?: () => void;
  onEditPicture?: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  element,
  hasClipboard,
  onClose,
  onEditText,
  onOpenStoryEditor,
  onOpenDictionary,
  onFitTextBox,
  onToggleDirection,
  onCenterHorizontal,
  onEditPicture,
  onCut,
  onCopy,
  onPaste,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onToggleLock,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const vw = typeof window !== 'undefined' ? window.innerWidth : 800;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 600;
  const left = Math.max(8, Math.min(x, vw - 232));
  const top = Math.max(8, Math.min(y, vh - Math.min(360, vh - 24)));

  const itemClass =
    'w-full text-left px-3 py-2 sm:py-1.5 text-xs flex items-center justify-between text-slate-700 hover:bg-blue-600 hover:text-white rounded transition-colors';

  return (
    <div
      ref={menuRef}
      style={{ left: `${left}px`, top: `${top}px` }}
      dir="ltr"
      className="fixed z-50 min-w-[220px] max-h-[calc(100dvh-16px)] overflow-y-auto select-none no-print bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow-xl p-1 font-modern"
    >
      {element && element.type === 'text' && (
        <>
          <button
            type="button"
            onClick={() => {
              onEditText?.();
              onClose();
            }}
            className={itemClass}
          >
            <span className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 opacity-75" />
              <span>Edit Text Inline</span>
            </span>
            <span className="text-[10px] opacity-60">Dbl-Click</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenStoryEditor?.();
              onClose();
            }}
            className={itemClass}
          >
            <span className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 opacity-75" />
              <span>Story Editor...</span>
            </span>
            <span className="text-[10px] opacity-60">Ctrl+T</span>
          </button>
          {onFitTextBox && (
            <button
              type="button"
              onClick={() => {
                onFitTextBox();
                onClose();
              }}
              className={itemClass}
            >
              <span className="flex items-center gap-2">
                <Maximize2 className="w-3.5 h-3.5 opacity-75" />
                <span>Fit Box Height to Text</span>
              </span>
            </button>
          )}
          {onToggleDirection && (
            <button
              type="button"
              onClick={() => {
                onToggleDirection();
                onClose();
              }}
              className={itemClass}
            >
              <span className="flex items-center gap-2">
                <ArrowLeftRight className="w-3.5 h-3.5 opacity-75" />
                <span>Switch RTL / LTR Direction</span>
              </span>
            </button>
          )}
          {onOpenDictionary && (
            <button
              type="button"
              onClick={() => {
                onOpenDictionary();
                onClose();
              }}
              className={itemClass}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 opacity-75" />
                <span>Urdu Dictionary (لغت)...</span>
              </span>
              <span className="text-[10px] opacity-60">F10</span>
            </button>
          )}
          <div className="my-1 border-t border-slate-100" />
        </>
      )}

      {element && element.type === 'picture' && (
        <>
          <button
            type="button"
            onClick={() => {
              onEditPicture?.();
              onClose();
            }}
            className={itemClass}
          >
            <span className="flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 opacity-75" />
              <span>Picture Properties...</span>
            </span>
            <span className="text-[10px] opacity-60">Dbl-Click</span>
          </button>
          <div className="my-1 border-t border-slate-100" />
        </>
      )}

      {element && (
        <>
          <button
            type="button"
            onClick={() => {
              onCut();
              onClose();
            }}
            className={itemClass}
          >
            <span className="flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 opacity-75" />
              <span>Cut</span>
            </span>
            <span className="text-[10px] opacity-60">Ctrl+X</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onCopy();
              onClose();
            }}
            className={itemClass}
          >
            <span className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 opacity-75" />
              <span>Copy</span>
            </span>
            <span className="text-[10px] opacity-60">Ctrl+C</span>
          </button>
        </>
      )}

      <button
        type="button"
        disabled={!hasClipboard}
        onClick={() => {
          onPaste();
          onClose();
        }}
        className={`${itemClass} disabled:opacity-40 disabled:pointer-events-none`}
      >
        <span className="flex items-center gap-2">
          <Clipboard className="w-3.5 h-3.5 opacity-75" />
          <span>Paste</span>
        </span>
        <span className="text-[10px] opacity-60">Ctrl+V</span>
      </button>

      {element && (
        <>
          <button
            type="button"
            onClick={() => {
              onDuplicate();
              onClose();
            }}
            className={itemClass}
          >
            <span className="flex items-center gap-2">
              <CopyPlus className="w-3.5 h-3.5 opacity-75" />
              <span>Duplicate</span>
            </span>
            <span className="text-[10px] opacity-60">Ctrl+D</span>
          </button>

          <div className="my-1 border-t border-slate-100" />

          {onCenterHorizontal && (
            <button
              type="button"
              onClick={() => {
                onCenterHorizontal();
                onClose();
              }}
              className={itemClass}
            >
              <span className="flex items-center gap-2">
                <AlignHorizontalSpaceAround className="w-3.5 h-3.5 opacity-75" />
                <span>Center Horizontally</span>
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onBringToFront();
              onClose();
            }}
            className={itemClass}
          >
            <span className="flex items-center gap-2">
              <ArrowUpToLine className="w-3.5 h-3.5 opacity-75" />
              <span>Bring to Front</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              onSendToBack();
              onClose();
            }}
            className={itemClass}
          >
            <span className="flex items-center gap-2">
              <ArrowDownToLine className="w-3.5 h-3.5 opacity-75" />
              <span>Send to Back</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              onToggleLock();
              onClose();
            }}
            className={itemClass}
          >
            <span className="flex items-center gap-2">
              {element.locked ? <Unlock className="w-3.5 h-3.5 opacity-75" /> : <Lock className="w-3.5 h-3.5 opacity-75" />}
              <span>{element.locked ? 'Unlock Object' : 'Lock Position'}</span>
            </span>
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            onClick={() => {
              onDelete();
              onClose();
            }}
            className={`${itemClass} text-red-600`}
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </span>
            <span className="text-[10px] opacity-60">Del</span>
          </button>
        </>
      )}
    </div>
  );
};
