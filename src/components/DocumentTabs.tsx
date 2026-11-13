import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, FileText, ChevronDown } from 'lucide-react';
import { DocumentTab } from '../types/inpage';
import { TEMPLATES } from '../utils/templates';

interface DocumentTabsProps {
  tabs: DocumentTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewBlankTab: () => void;
  onNewTemplateTab: (templateId: string) => void;
}

export const DocumentTabs: React.FC<DocumentTabsProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewBlankTab,
  onNewTemplateTab,
}) => {
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setTemplateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div
      className="h-8 px-2 bg-slate-100 border-b border-slate-200 flex items-end gap-1 select-none shrink-0 relative z-20 no-print font-modern"
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

      {/* New Tab & Template Tab Controls (kept outside overflow-x-auto so dropdown is never clipped) */}
      <div className="flex items-center gap-0.5 pb-1 pl-1 shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={onNewBlankTab}
          title="Open New Blank Document Tab (Ctrl+N)"
          aria-label="New Document Tab"
          className="w-7 h-6 sm:w-6 flex items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-blue-600 hover:border hover:border-slate-300 transition-colors touch-manipulation"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setTemplateMenuOpen((prev) => !prev)}
            aria-expanded={templateMenuOpen}
            title="New Document Tab from Template"
            className="h-6 px-1.5 flex items-center gap-0.5 rounded-md text-[10px] font-medium text-slate-600 hover:bg-white hover:text-slate-900 hover:border hover:border-slate-300 transition-colors whitespace-nowrap touch-manipulation"
          >
            <span className="hidden xs:inline sm:inline">Templates</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {templateMenuOpen && (
            <div className="absolute right-0 sm:left-0 sm:right-auto top-full mt-1 w-60 sm:w-64 max-w-[calc(100vw-16px)] bg-white border border-slate-200 rounded-lg shadow-xl p-1 z-50">
              <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400">
                Open Template in New Tab
              </div>
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    setTemplateMenuOpen(false);
                    onNewTemplateTab(tpl.id);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white group transition-colors"
                >
                  <div className="text-xs font-semibold">{tpl.name}</div>
                  <div className="text-[11px] font-arabic-sans text-slate-500 group-hover:text-blue-100 leading-normal">
                    {tpl.nameUrdu}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <span className="hidden md:inline ml-auto text-[10px] text-slate-400 font-mono tabular-nums pb-1.5 pr-1 whitespace-nowrap shrink-0">
        {tabs.length} {tabs.length === 1 ? 'document' : 'documents'} open
      </span>
    </div>
  );
};
