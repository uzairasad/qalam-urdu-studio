import React from 'react';

interface IconProps {
  className?: string;
  active?: boolean;
}

export const QalamBrandEmblem: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor" fillOpacity="0.14" />
    {/* Traditional angled Qalam reed-pen nib */}
    <path
      d="M12 4.2L17.2 11.4L15.4 16.4H8.6L6.8 11.4L12 4.2Z"
      fill="currentColor"
      fillOpacity="0.22"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M12 4.6V11.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="12.6" r="1.25" fill="currentColor" />
    {/* Gold/Pen Collar */}
    <path d="M8 18.6H16" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    {/* Calligraphic nuqta dot */}
    <rect
      x="17.2"
      y="5.2"
      width="2.2"
      height="2.2"
      rx="0.4"
      transform="rotate(45 18.3 6.3)"
      fill="currentColor"
    />
  </svg>
);

/* =========================================================
   LEFT TOOLBOX ICONS (24x24 precision pixel-aligned DTP vectors)
   ========================================================= */

export const PickToolIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', active = false }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    {/* Subtle selection anchor frame accent */}
    <path
      d="M14.5 4.5H19.5V9.5"
      stroke="currentColor"
      strokeOpacity={active ? 0.55 : 0.35}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="2 2"
    />
    <path
      d="M5.5 3.2L18.2 12.1L12.3 13.1L15.1 19.1L12.5 20.3L9.7 14.3L5.5 18.1V3.2Z"
      fill="currentColor"
      fillOpacity={active ? 0.25 : 0.14}
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinejoin="round"
    />
  </svg>
);

export const TextIBeamToolIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', active = false }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    {/* Crisp serif I-Beam cursor */}
    <path
      d="M4 4.5H9M6.5 4.5V19.5M4 19.5H9"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    {/* Soft glow behind Urdu Ain */}
    <circle
      cx="16"
      cy="12.5"
      r="5.5"
      fill={active ? 'currentColor' : '#2563eb'}
      fillOpacity={active ? 0.16 : 0.08}
    />
    {/* Stylized Calligraphic Ain (ع) */}
    <path
      d="M18.6 7.8C16.2 6.6 13.4 7.7 13.4 9.9C13.4 11.7 15.2 12.6 17.6 12.4C14.4 12.8 12.5 14.8 12.8 17.2C13.1 19.4 15.8 20.5 19.2 19.4"
      stroke={active ? 'currentColor' : '#1d4ed8'}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const RotateToolIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', active = false }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle
      cx="12"
      cy="12"
      r="7.2"
      fill="currentColor"
      fillOpacity={active ? 0.12 : 0.06}
    />
    <path
      d="M18.4 8.6A7.2 7.2 0 1 0 19 14.3"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <path
      d="M19.2 4.2V9H14.4"
      stroke={active ? 'currentColor' : '#2563eb'}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="2" fill={active ? 'currentColor' : '#2563eb'} />
  </svg>
);

export const LinkFrameToolIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', active = false }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="3"
      y="3.5"
      width="8"
      height="10.5"
      rx="1.5"
      fill="currentColor"
      fillOpacity="0.1"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M5 7H9M5 9.5H8" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" />
    <rect
      x="13"
      y="10"
      width="8"
      height="10.5"
      rx="1.5"
      fill="currentColor"
      fillOpacity="0.1"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M15 13.5H19" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" />
    <path
      d="M8.5 11.2C11.2 11.2 12 13.2 12 15.5H15.8M14 13.6L16.2 15.5L14 17.4"
      stroke={active ? 'currentColor' : '#2563eb'}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const DelinkFrameToolIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', active = false }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="3"
      y="3.5"
      width="8"
      height="10.5"
      rx="1.5"
      fill="currentColor"
      fillOpacity="0.1"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <rect
      x="13"
      y="10"
      width="8"
      height="10.5"
      rx="1.5"
      fill="currentColor"
      fillOpacity="0.1"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle
      cx="16.5"
      cy="6.5"
      r="3.8"
      fill={active ? 'currentColor' : '#dc2626'}
      fillOpacity={active ? 0.22 : 0.12}
    />
    <path
      d="M18.2 4.8L14.8 8.2M14.8 4.8L18.2 8.2"
      stroke={active ? 'currentColor' : '#dc2626'}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const TextBoxToolIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', active = false }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="4"
      y="4"
      width="16"
      height="16"
      rx="1.5"
      fill="currentColor"
      fillOpacity={active ? 0.16 : 0.07}
      stroke="currentColor"
      strokeWidth="1.5"
    />
    {/* Crisp corner selection handles */}
    <rect x="2.5" y="2.5" width="3" height="3" rx="0.6" fill="currentColor" />
    <rect x="18.5" y="2.5" width="3" height="3" rx="0.6" fill="currentColor" />
    <rect x="2.5" y="18.5" width="3" height="3" rx="0.6" fill="currentColor" />
    <rect x="18.5" y="18.5" width="3" height="3" rx="0.6" fill="currentColor" />
    {/* RTL text lines + Urdu mark */}
    <path
      d="M8 8.5H16M9.5 12H16M8 15.5H13.5"
      stroke={active ? 'currentColor' : '#2563eb'}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const TitleBoxToolIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', active = false }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="3"
      y="4.5"
      width="18"
      height="15"
      rx="1.8"
      fill="currentColor"
      fillOpacity={active ? 0.16 : 0.06}
      stroke="currentColor"
      strokeWidth="1.55"
    />
    {/* Headline banner zone */}
    <path
      d="M3.5 5C3.5 4.72 3.72 4.5 4 4.5H20C20.28 4.5 20.5 4.72 20.5 5V9.2H3.5V5Z"
      fill={active ? 'currentColor' : '#2563eb'}
      fillOpacity={active ? 0.3 : 0.2}
    />
    <path d="M3 9.2H21" stroke="currentColor" strokeWidth="1.35" />
    {/* Headline & sub-headline bars */}
    <path
      d="M6.5 13H17.5"
      stroke={active ? 'currentColor' : '#2563eb'}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M8.5 16.2H15.5"
      stroke="currentColor"
      strokeOpacity="0.65"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

export const PicRectToolIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', active = false }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="3"
      y="4"
      width="18"
      height="16"
      rx="1.2"
      fill={active ? 'currentColor' : '#059669'}
      fillOpacity={active ? 0.18 : 0.1}
      stroke="currentColor"
      strokeWidth="1.6"
    />
    {/* Crisp corner handles */}
    <rect x="2" y="3" width="2.4" height="2.4" fill="currentColor" />
    <rect x="19.6" y="3" width="2.4" height="2.4" fill="currentColor" />
    <rect x="2" y="18.6" width="2.4" height="2.4" fill="currentColor" />
    <rect x="19.6" y="18.6" width="2.4" height="2.4" fill="currentColor" />
    {/* Sun & mountain landscape */}
    <circle cx="8.5" cy="9.2" r="1.7" fill={active ? 'currentColor' : '#d97706'} />
    <path
      d="M4.2 18.8L9.6 13L13.2 16.3L16 12.2L19.8 18.8H4.2Z"
      fill={active ? 'currentColor' : '#059669'}
      fillOpacity={active ? 0.45 : 0.35}
      stroke={active ? 'currentColor' : '#059669'}
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

export const PicRoundToolIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', active = false }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="3"
      y="4"
      width="18"
      height="16"
      rx="5"
      fill={active ? 'currentColor' : '#0284c7'}
      fillOpacity={active ? 0.18 : 0.1}
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <circle cx="8.8" cy="9.3" r="1.6" fill={active ? 'currentColor' : '#d97706'} />
    <path
      d="M5.2 18.2L10 12.8L13.5 16L16.2 12.4L19 18"
      stroke={active ? 'currentColor' : '#0284c7'}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PicOvalToolIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', active = false }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <ellipse
      cx="12"
      cy="12"
      rx="9"
      ry="7.4"
      fill={active ? 'currentColor' : '#7c3aed'}
      fillOpacity={active ? 0.18 : 0.1}
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <circle cx="9.2" cy="9.6" r="1.5" fill={active ? 'currentColor' : '#d97706'} />
    <path
      d="M5.8 15.8L10.1 11.8L13.2 14.6L15.8 11.5L18.5 15.5"
      stroke={active ? 'currentColor' : '#7c3aed'}
      strokeWidth="1.45"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const GraphicShapeToolIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', active = false }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="3.5"
      y="9.5"
      width="10.5"
      height="10.5"
      rx="1.8"
      fill={active ? 'currentColor' : '#d97706'}
      fillOpacity={active ? 0.22 : 0.16}
      stroke="currentColor"
      strokeWidth="1.55"
    />
    <circle
      cx="14.8"
      cy="9.2"
      r="5.4"
      fill={active ? 'currentColor' : '#2563eb'}
      fillOpacity={active ? 0.26 : 0.2}
      stroke={active ? 'currentColor' : '#2563eb'}
      strokeWidth="1.55"
    />
  </svg>
);

export const LineToolIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', active = false }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M5.5 18.5L18.5 5.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <rect
      x="3"
      y="16.2"
      width="4.2"
      height="4.2"
      rx="0.9"
      fill={active ? 'currentColor' : '#2563eb'}
    />
    <rect
      x="16.8"
      y="3.6"
      width="4.2"
      height="4.2"
      rx="0.9"
      fill={active ? 'currentColor' : '#2563eb'}
    />
    <circle
      cx="12"
      cy="12"
      r="1.7"
      fill={active ? '#2563eb' : '#ffffff'}
      stroke="currentColor"
      strokeWidth="1.3"
    />
  </svg>
);

export const TableToolIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', active = false }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="3"
      y="4"
      width="18"
      height="16"
      rx="1.6"
      fill="currentColor"
      fillOpacity={active ? 0.12 : 0.04}
      stroke="currentColor"
      strokeWidth="1.55"
    />
    {/* Header row tint */}
    <path
      d="M3.5 5.6C3.5 4.72 4.22 4 5.1 4H18.9C19.78 4 20.5 4.72 20.5 5.6V9H3.5V5.6Z"
      fill={active ? 'currentColor' : '#2563eb'}
      fillOpacity={active ? 0.34 : 0.22}
    />
    <path
      d="M3 9H21M3 14.5H21M9 4V20M15 4V20"
      stroke="currentColor"
      strokeWidth="1.3"
    />
  </svg>
);

export const MasterPageToolIcon: React.FC<IconProps> = ({ className = 'w-[18px] h-[18px]', active = false }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M5.5 3H14.5L18.5 7V21H5.5V3Z"
      fill="currentColor"
      fillOpacity={active ? 0.2 : 0.08}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M14.5 3V7H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path
      d="M8.5 17V10.8L12 15L15.5 10.8V17"
      stroke={active ? 'currentColor' : '#d97706'}
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* =========================================================
   INLINE & RIBBON DTP ICONS
   ========================================================= */

export const CalligraphyNibIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path
      d="M15.8 3.2L17 4.4C17.4 4.8 17.4 5.4 17 5.8L9.6 13.2L5.2 14.8L6.8 10.4L14.2 3C14.6 2.6 15.3 2.7 15.8 3.2Z"
      fill="currentColor"
      fillOpacity="0.18"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M5.2 14.8L3 17M8.5 11.5L10.5 9.5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
  </svg>
);

export const TransparentSwatchIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
    <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" />
    <path d="M2.5 13.5L13.5 2.5" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const RtlDirectionIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 18 18" fill="none" className={className} aria-hidden="true">
    <path d="M4 5H14M6.5 9H14M4 13H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M14.5 11.5L12 13.5L14.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LtrDirectionIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 18 18" fill="none" className={className} aria-hidden="true">
    <path d="M4 5H14M4 9H11.5M8 13H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M3.5 11.5L6 13.5L3.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PasteRibbonIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="4" y="4.5" width="12" height="15" rx="2" fill="#d97706" fillOpacity="0.16" stroke="#b45309" strokeWidth="1.5" />
    <rect x="7.5" y="2.5" width="5" height="3.2" rx="1" fill="#ffffff" stroke="#b45309" strokeWidth="1.4" />
    <rect x="9.5" y="9" width="10.5" height="12.5" rx="1.6" fill="#ffffff" stroke="#2563eb" strokeWidth="1.55" />
    <path d="M12 13H17.5M12 16H17.5M12 18.5H15.5" stroke="#2563eb" strokeWidth="1.35" strokeLinecap="round" />
  </svg>
);

export const StoryEditorRibbonIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M5 3.5H15L19 7.5V20.5H5V3.5Z"
      fill="#2563eb"
      fillOpacity="0.1"
      stroke="#2563eb"
      strokeWidth="1.55"
      strokeLinejoin="round"
    />
    <path d="M15 3.5V7.5H19" stroke="#2563eb" strokeWidth="1.45" strokeLinejoin="round" />
    <path d="M8 11H16M9.5 14.5H16M8 18H13.5" stroke="#1e40af" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const UrduDictionaryRibbonIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M4 5.5C4 4.4 4.9 3.5 6 3.5H11.5V19.5H6C4.9 19.5 4 18.6 4 17.5V5.5Z"
      fill="#059669"
      fillOpacity="0.15"
      stroke="#059669"
      strokeWidth="1.55"
      strokeLinejoin="round"
    />
    <path
      d="M20 5.5C20 4.4 19.1 3.5 18 3.5H12.5V19.5H18C19.1 19.5 20 18.6 20 17.5V5.5Z"
      fill="#059669"
      fillOpacity="0.08"
      stroke="#059669"
      strokeWidth="1.55"
      strokeLinejoin="round"
    />
    <path d="M6.5 8H9.5M6.5 11.5H9.5M14.5 8H17.5M14.5 11.5H17.5" stroke="#047857" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M15.5 19.5V22L17 20.8L18.5 22V19.5" fill="#d97706" />
  </svg>
);

export const AddPageRibbonIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M5 3H14L18 7V19.5C18 20.3 17.3 21 16.5 21H5C4.2 21 3.5 20.3 3.5 19.5V4.5C3.5 3.7 4.2 3 5 3Z"
      fill="#2563eb"
      fillOpacity="0.1"
      stroke="#2563eb"
      strokeWidth="1.55"
      strokeLinejoin="round"
    />
    <path d="M14 3V7H18" stroke="#2563eb" strokeWidth="1.45" strokeLinejoin="round" />
    <circle cx="17" cy="17" r="4.5" fill="#059669" />
    <path d="M17 15V19M15 17H19" stroke="#ffffff" strokeWidth="1.65" strokeLinecap="round" />
  </svg>
);

export const PageSetupRibbonIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="5" y="3" width="14" height="18" rx="1.6" fill="#2563eb" fillOpacity="0.08" stroke="#334155" strokeWidth="1.5" />
    {/* Margin guide lines */}
    <path
      d="M8.5 3V21M15.5 3V21M5 7H19M5 17H19"
      stroke="#2563eb"
      strokeOpacity="0.6"
      strokeWidth="1.15"
      strokeDasharray="2 1.5"
    />
    <rect x="8.5" y="7" width="7" height="10" fill="#2563eb" fillOpacity="0.14" />
  </svg>
);

export const PageNumberRibbonIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="4.5" y="3" width="15" height="18" rx="1.8" fill="#f8fafc" stroke="#475569" strokeWidth="1.5" />
    <path d="M8 7.5H16M8 10.5H14" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
    <rect x="8" y="14" width="8" height="4.5" rx="1" fill="#2563eb" fillOpacity="0.16" stroke="#2563eb" strokeWidth="1.2" />
    <path d="M12 15.1V17.4M11 15.7L12 15.1" stroke="#1d4ed8" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LineSpacingRibbonIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path d="M4.5 4.5V15.5M4.5 4.5L2.8 6.3M4.5 4.5L6.2 6.3M4.5 15.5L2.8 13.7M4.5 15.5L6.2 13.7" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 5.5H17M9 10H17M9 14.5H17" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
  </svg>
);

export const CharScaleRibbonIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path d="M6.5 11.5L10 4L13.5 11.5M7.8 9.2H12.2" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.5 15.5H16.5M3.5 15.5L5.3 13.8M3.5 15.5L5.3 17.2M16.5 15.5L14.7 13.8M16.5 15.5L14.7 17.2" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const FitBoxHeightRibbonIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <rect x="3.5" y="3" width="13" height="14" rx="1.4" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 1.5" />
    <path d="M6.5 7H13.5M10 10V15M8 13L10 15L12 13" stroke="#2563eb" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const UrduDigitsRibbonIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <rect x="2" y="3.5" width="7" height="13" rx="1.5" fill="#2563eb" fillOpacity="0.1" stroke="#2563eb" strokeWidth="1.35" />
    <path d="M5.5 7.5V13M4.2 8.7L5.5 7.5" stroke="#1d4ed8" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11 10H18M16 8L18 10L16 12" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const StripAraabRibbonIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path d="M6 5.5L9.5 3.5" stroke="#d97706" strokeWidth="1.55" strokeLinecap="round" />
    <path d="M5 13C5 10.5 7 9.5 10 9.5C12.5 9.5 14 11 14 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M4 16L16 4" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const WordCountRibbonIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="4" y="3.5" width="16" height="17" rx="2" fill="#2563eb" fillOpacity="0.1" stroke="#2563eb" strokeWidth="1.55" />
    <path d="M8 15.5V12.5M12 15.5V9M16 15.5V11" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" />
    <path d="M7.5 6.8H16.5" stroke="#64748b" strokeWidth="1.35" strokeLinecap="round" />
  </svg>
);

export const TableAddRowIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <rect x="2.5" y="3" width="15" height="9" rx="1" stroke="currentColor" strokeWidth="1.3" />
    <path d="M2.5 7.5H17.5M7.5 3V12M12.5 3V12" stroke="currentColor" strokeWidth="1.15" />
    <rect x="2.5" y="13" width="10" height="4" rx="1" fill="#059669" fillOpacity="0.24" stroke="#059669" strokeWidth="1.3" />
    <path d="M16 13V17.5M13.8 15.25H18.2" stroke="#059669" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const TableDelRowIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <rect x="2.5" y="3" width="15" height="9" rx="1" stroke="currentColor" strokeWidth="1.3" />
    <path d="M2.5 7.5H17.5M7.5 3V12M12.5 3V12" stroke="currentColor" strokeWidth="1.15" />
    <rect x="2.5" y="13" width="10" height="4" rx="1" fill="#dc2626" fillOpacity="0.2" stroke="#dc2626" strokeWidth="1.3" />
    <path d="M14 15.25H18.2" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const TableAddColIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <rect x="2.5" y="3" width="9.5" height="14" rx="1" stroke="currentColor" strokeWidth="1.3" />
    <path d="M7.2 3V17M2.5 7.8H12M2.5 12.2H12" stroke="currentColor" strokeWidth="1.15" />
    <rect x="13" y="3" width="4.5" height="9.5" rx="1" fill="#059669" fillOpacity="0.24" stroke="#059669" strokeWidth="1.3" />
    <path d="M15.25 14V18M13.25 16H17.25" stroke="#059669" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const TableDelColIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <rect x="2.5" y="3" width="9.5" height="14" rx="1" stroke="currentColor" strokeWidth="1.3" />
    <path d="M7.2 3V17M2.5 7.8H12M2.5 12.2H12" stroke="currentColor" strokeWidth="1.15" />
    <rect x="13" y="3" width="4.5" height="9.5" rx="1" fill="#dc2626" fillOpacity="0.2" stroke="#dc2626" strokeWidth="1.3" />
    <path d="M13.2 16H17.3" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const TableHeaderShadeIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <rect x="2.5" y="3" width="15" height="14" rx="1.2" stroke="currentColor" strokeWidth="1.35" />
    <rect x="2.5" y="3" width="15" height="4.8" rx="1" fill="#2563eb" fillOpacity="0.32" stroke="#2563eb" strokeWidth="1.2" />
    <path d="M2.5 12.4H17.5M7.5 3V17M12.5 3V17" stroke="currentColor" strokeWidth="1.15" />
  </svg>
);

export const BorderWidthIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 18 18" fill="none" className={className} aria-hidden="true">
    <path d="M2.5 4.5H15.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    <path d="M2.5 9H15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M2.5 13.8H15.5" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" />
  </svg>
);

export const BorderStyleIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 18 18" fill="none" className={className} aria-hidden="true">
    <path d="M2.5 4.5H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M2.5 9H15.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2.5" strokeLinecap="round" />
    <path d="M2.5 13.5H15.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1 2.2" strokeLinecap="round" />
  </svg>
);
