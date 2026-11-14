import React, { useEffect } from 'react';
import { X, Type, Keyboard, LayoutTemplate, FileInput, FileOutput, WifiOff, type LucideIcon } from 'lucide-react';
import { QalamAppLogo } from './DtpIcons';
import { APP_AUTHOR, APP_VERSION, type ProjectLink } from '../appInfo';
import { isNativeApp, openProjectLink } from '../platform/native';
import { UpdatesSection, type Updates } from './Updates';

const LINKS: { link: ProjectLink; label: string }[] = [
  { link: 'website', label: 'Website' },
  { link: 'source', label: 'Source code' },
  { link: 'license', label: 'License' },
  { link: 'notices', label: 'Third-party notices' },
];

const FEATURES: [LucideIcon, string][] = [
  [Type, 'Nastaliq, Naskh and 13 more fonts'],
  [Keyboard, 'Phonetic, Monotype and Muqtadira keyboards'],
  [LayoutTemplate, 'Frames, columns, tables and master pages'],
  [FileInput, 'Opens and saves InPage files'],
  [FileOutput, 'PDF, Word, PNG and HTML export'],
  [WifiOff, 'Works offline, on every device'],
];

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  updates: Updates;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, updates }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const platform = isNativeApp()
    ? /Android/i.test(navigator.userAgent)
      ? 'Android app'
      : 'Desktop app'
    : 'Web app';

  return (
    <div className="fixed inset-0 z-50 safe-overlay flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4 short:p-2 select-none">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="About Qalam Urdu Studio"
        className="relative max-w-md w-full max-h-full flex flex-col text-slate-800 shadow-2xl bg-white border border-slate-200 rounded-2xl overflow-hidden font-modern"
        dir="ltr"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2.5 top-2.5 z-10 w-8 h-8 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content (scrolls when the window is short, e.g. at 150-200% display scaling) */}
        <div className="min-h-0 overflow-y-auto">
          <div className="px-5 pt-6 pb-4 short:pt-4 flex flex-col items-center text-center">
            <QalamAppLogo className="w-16 h-16 drop-shadow-md" />
            <h2 className="mt-3 text-lg font-bold text-slate-900 tracking-tight">Qalam Urdu Studio</h2>
            <p className="text-xs text-slate-500">Desktop publishing for Urdu, Arabic and English</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold tabular-nums">
                Version {APP_VERSION}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{platform}</span>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Created by <span className="font-semibold text-slate-900">{APP_AUTHOR}</span>
            </p>

            <p className="mt-3 text-[13px] text-slate-700 leading-[2.3] font-nastaliq" dir="rtl">
              اخبارات، رسائل اور کتب کی نستعلیق میں اشاعت
            </p>
          </div>

          <ul className="mx-5 grid grid-cols-2 gap-x-3 gap-y-2 text-[11.5px] text-slate-700">
            {FEATURES.map(([Icon, label]) => (
              <li key={label} className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 shrink-0 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="leading-tight">{label}</span>
              </li>
            ))}
          </ul>

          <div className="mx-5 mt-4 pt-3 border-t border-slate-200 text-center">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Free and open source under the GNU GPL v3.0 or later. Bundled fonts are under the SIL
              Open Font License.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {LINKS.map(({ link, label }) => (
                <button
                  key={link}
                  type="button"
                  onClick={() => void openProjectLink(link)}
                  className="px-2.5 py-1 rounded-full border border-slate-200 text-[11px] font-medium text-blue-700 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <UpdatesSection updates={updates} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 flex items-center justify-between gap-3 bg-slate-50 border-t border-slate-200">
          <span className="text-[11px] text-slate-500">© 2026 {APP_AUTHOR}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
