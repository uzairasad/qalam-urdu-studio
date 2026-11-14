import React from 'react';
import { Plus, X, FileText } from 'lucide-react';
import { DocumentTab } from '../types/inpage';

interface DocumentTabsProps {
  tabs: DocumentTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewBlankTab: () => void;
}

export const DocumentTabs: React.FC<DocumentTabsProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewBlankTab,
}) => {
  return (
    <div
      className="h-8 short:h-7 px-2 bg-slate-100 border-b border-slate-200 flex items-end gap-1 select-none shrink-0 relative z-20 no-print font-modern"
      dir="ltr"
    >
      <div
        onWheel={(e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        className="flex items-end gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-w-0 h-full pt-1"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectTab(tab.id)}
              title={`${tab.project.fileName} (${tab.project.pages.length} ${
                tab.project.pages.length === 1 ? 'page' : 'pages'
              })`}
              className={`group flex items-center gap-1.5 h-7 px-2 sm:px-2.5 text-[11px] rounded-t-md border border-b-0 cursor-pointer transition-colors max-w-[140px] sm:max-w-[190px] shrink-0 touch-manipulation ${
                isActive
                  ? 'bg-white border-slate-300 text-slate-900 font-semibold shadow-2xs'
                  : 'bg-slate-200/60 hover:bg-slate-200 border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText
                className={`w-3 h-3 shrink-0 ${
                  isActive ? 'text-blue-600' : 'text-slate-400'
                }`}
              />
              <span className="truncate whitespace-nowrap">
                {tab.project.fileName}
              </span>
              {tab.isModified && (
                <span className="text-amber-600 font-bold shrink-0" title="Unsaved changes">
                  *
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                title="Close Tab"
                aria-label={`Close ${tab.project.fileName}`}
                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                    : 'text-slate-400 opacity-70 group-hover:opacity-100 hover:bg-slate-300/70 hover:text-slate-800'
                }`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* New tab (templates are under File → New from Template) */}
      <div className="flex items-center pb-1 pl-1 shrink-0">
        <button
          type="button"
          onClick={onNewBlankTab}
          title="New document (Ctrl+N)"
          aria-label="New document"
          className="w-7 h-6 sm:w-6 flex items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-blue-600 hover:border hover:border-slate-300 transition-colors touch-manipulation"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <span className="hidden md:inline ml-auto text-[10px] text-slate-400 font-mono tabular-nums pb-1.5 pr-1 whitespace-nowrap shrink-0">
        {tabs.length} {tabs.length === 1 ? 'document' : 'documents'} open
      </span>
    </div>
  );
};
