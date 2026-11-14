import React, { useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { QalamBrandEmblem } from './DtpIcons';
import { APP_AUTHOR, APP_VERSION, type ProjectLink } from '../appInfo';
import { isNativeApp, openProjectLink } from '../platform/native';
import { UpdatesSection, type Updates } from './Updates';

const LINKS: { link: ProjectLink; label: string }[] = [
  { link: 'website', label: 'Website' },
  { link: 'source', label: 'Source code' },
  { link: 'license', label: 'License' },
  { link: 'notices', label: 'Third-party notices' },
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4 short:p-2 select-none">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="About Qalam Urdu Studio"
        className="max-w-md w-full max-h-full flex flex-col text-slate-800 shadow-2xl bg-white border border-slate-200 rounded-xl overflow-hidden font-modern"
        dir="ltr"
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between text-xs font-semibold bg-slate-900 text-white px-3.5 py-2.5">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>About Qalam Urdu Studio</span>
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

        {/* Content (scrolls when the window is short, e.g. at 150-200% display scaling) */}
        <div className="min-h-0 overflow-y-auto">
        <div className="p-4 short:p-3 flex gap-4 text-xs">
          <div className="w-16 h-16 flex flex-col items-center justify-center gap-0.5 text-white shadow-md shrink-0 overflow-hidden bg-gradient-to-br from-blue-700 to-indigo-900 rounded-xl">
            <QalamBrandEmblem className="w-8 h-8 text-amber-300" />
            <span className="text-[9px] font-mono tracking-wider leading-none">Qalam</span>
          </div>

          <div className="space-y-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Qalam Urdu Studio</h2>
              <p className="text-[11px] text-slate-600">
                Desktop Publishing Suite for Urdu, Arabic & Nastaliq
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Version {APP_VERSION} · {isNativeApp() ? 'Desktop app' : 'Web app'}
              </p>
              <p className="text-[11px] text-slate-700 mt-1">
                Created by <span className="font-semibold text-slate-900">{APP_AUTHOR}</span>
              </p>
            </div>

            <div
              className="border px-3 py-2.5 text-[12px] text-slate-700 leading-[2.2] font-nastaliq text-right bg-slate-50 border-slate-200 rounded-lg"
              dir="rtl"
            >
              قلم اردو سٹوڈیو اخبارات، رسائل، کتب اور سرکاری دستاویزات کی خطِ نستعلیق، نسخ اور رقعہ میں پیشہ ورانہ کمپوزنگ و اشاعت کا جدید سٹوڈیو ہے۔
            </div>

            <div className="text-[10px] text-slate-500 space-y-0.5">
              <p>• 15 Urdu, Arabic & Latin fonts, bundled for offline use (Nastaliq, Gulzar, Amiri, Ruqaa, Kufi)</p>
              <p>• Phonetic, Monotype & Muqtadira Urdu keyboard layouts</p>
              <p>• Multi-column frames, table builder, snap grid & character scaling</p>
              <p>• Open &amp; Save .qlm / .inp / Word (.docx) / PDF / TXT, Export PDF, HTML, PNG &amp; Web App</p>
            </div>

            <div className="text-[10px] text-slate-600 leading-relaxed border-t border-slate-200 pt-2">
              <p>
                Free and open-source software under the{' '}
                <span className="font-semibold text-slate-800">GNU General Public License v3.0</span>{' '}
                or later: you can use, share and change it, and versions you share stay open source.
                Bundled fonts are under the SIL Open Font License.
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                {LINKS.map(({ link, label }) => (
                  <button
                    key={link}
                    type="button"
                    onClick={() => void openProjectLink(link)}
                    className="text-blue-700 hover:text-blue-900 hover:underline font-medium"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <UpdatesSection updates={updates} />
        </div>

        {/* Footer */}
        <div className="px-4 py-2 flex items-center justify-between gap-3 bg-slate-50 border-t border-slate-200">
          <span className="text-[10px] text-slate-500">
            © 2026 {APP_AUTHOR} · GPL-3.0-or-later
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
