import React from 'react';
import { APP_VERSION } from '../appInfo';
import {
  X,
  Download,
  Monitor,
  FileCode,
  Printer,
  Check,
  Image as ImageIcon,
  Eye,
  FileDown,
  FileText,
  Globe,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProject: () => void;
  onSaveAsInp: () => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
  onExportPng: () => void;
  onPrintPreview: () => void;
  onPrint: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  isOpen,
  onClose,
  onSaveProject,
  onSaveAsInp,
  onExportPdf,
  onExportDocx,
  onExportPng,
  onPrintPreview,
  onPrint,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [downloadedOffline, setDownloadedOffline] = React.useState(false);

  if (!isOpen) return null;

  const handleDownloadOfflineHTML = () => {
    const a = document.createElement('a');
    a.href = `${import.meta.env.BASE_URL}Qalam_Urdu_Studio.html`;
    a.download = 'Qalam_Urdu_Studio.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloadedOffline(true);
  };

  const cardClass = 'border border-slate-200 p-3.5 rounded-lg bg-slate-50 space-y-2';
  const btnClass =
    'modern-btn px-3 py-1.5 font-semibold text-slate-800 flex items-center gap-1.5 text-xs';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4 select-none no-print">
      <div
        className="max-w-xl w-full text-slate-800 shadow-2xl bg-white border border-slate-200 rounded-xl overflow-hidden font-modern"
        dir="ltr"
      >
        {/* Title Bar */}
        <div className="px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold bg-slate-900 text-white">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Add as Web App, Single HTML & Export — v{APP_VERSION}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-6 h-6 hover:bg-red-600 rounded text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 text-xs max-h-[82vh] overflow-y-auto">
          {/* Option 1: Add as Web App (PWA) */}
          <div className={cardClass}>
            <div className="flex items-start gap-2.5">
              <Monitor className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900">
                  1. Add as a Web App (Windows, Mac &amp; Mobile)
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Install Qalam Urdu Studio directly from your browser so it launches in its own dedicated app window from your Desktop, Start Menu, or Dock and works offline.
                </p>
              </div>
            </div>

            <div className="pt-1 space-y-2">
              {isInstallable && (
                <button
                  type="button"
                  onClick={async () => {
                    await install();
                    onClose();
                  }}
                  className="px-4 py-1.5 font-bold flex items-center gap-1.5 shadow-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install Web App Now</span>
                </button>
              )}

              {isInstalled && (
                <span className="inline-flex text-emerald-700 font-bold items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  <Check className="w-4 h-4" /> Running as an installed Web App!
                </span>
              )}

              <div className="bg-blue-50/90 border border-blue-200 p-2.5 rounded-md text-[11px] text-blue-950 space-y-1 leading-relaxed">
                <div>
                  <strong>Google Chrome:</strong> Click the <strong>Install app</strong> icon in the right side of the address bar, or open <strong>Menu (⋮) → Cast, save, and share → Install page as app…</strong>
                </div>
                <div>
                  <strong>Microsoft Edge:</strong> Click the <strong>App available (⊞)</strong> icon in the address bar, or open <strong>Menu (⋯) → Apps → Install Qalam Urdu Studio</strong>.
                </div>
                <div>
                  <strong>Safari (Mac / iOS):</strong> Click <strong>Share (↑) → Add to Dock</strong> (Mac) or <strong>Add to Home Screen</strong> (iPhone/iPad).
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: Single-File Portable HTML App */}
          <div className={cardClass}>
            <div className="flex items-start gap-2.5">
              <FileCode className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900">
                  2. Download Single-File Portable App (Qalam_Urdu_Studio.html)
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Everything is compiled into one standalone <code>.html</code> file—no installer, no local server, and no script needed. Just download it, save it on your PC or USB drive, and double-click to open directly in Chrome, Edge, or Firefox offline.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button type="button" onClick={handleDownloadOfflineHTML} className={btnClass}>
                <Download className="w-3.5 h-3.5 text-blue-700" />
                <span>
                  {downloadedOffline
                    ? 'Downloaded Qalam_Urdu_Studio.html'
                    : 'Download Qalam_Urdu_Studio.html'}
                </span>
              </button>
              <span className="text-[10px] text-slate-500">
                Single self-contained HTML file (~1.1 MB)
              </span>
            </div>
          </div>

          {/* Option 3: Print & Document Export */}
          <div className={cardClass}>
            <div className="flex items-start gap-2.5">
              <FileDown className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-slate-900">3. Print, Preview &amp; Export Document</h3>
                <p className="text-[11px] text-slate-600">
                  Preview pages at exact 1:1 scale, export multi-page PDF or editable Word (<code>.docx</code>), save project files (<code>.qlm</code> / <code>.inp</code>), or export high-DPI PNG.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPrintPreview();
                }}
                className={btnClass}
              >
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Print Preview</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onExportPdf();
                }}
                className={btnClass}
              >
                <FileDown className="w-3.5 h-3.5 text-rose-600" />
                <span>Export PDF (.pdf)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onExportDocx();
                }}
                className={btnClass}
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Export Word (.docx)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onExportPng();
                  onClose();
                }}
                className={btnClass}
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export PNG</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSaveProject();
                  onClose();
                }}
                className={btnClass}
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Save .qlm</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSaveAsInp();
                }}
                className={btnClass}
              >
                <Download className="w-3.5 h-3.5 text-blue-700" />
                <span>Save .inp</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onPrint();
                  onClose();
                }}
                className={btnClass}
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print (Ctrl+P)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 flex justify-end bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-semibold modern-btn text-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
