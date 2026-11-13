export interface UrduFontOption {
  value: string;
  label: string;
  category: 'Nastaliq' | 'Naskh & Quranic' | 'Calligraphy & Display' | 'Sans & Modern' | 'Latin';
  cssStack: string;
  isNastaliq?: boolean;
}

export const URDU_FONT_OPTIONS: UrduFontOption[] = [
  {
    value: 'Noto Nastaliq Urdu',
    label: 'Noori Nastaliq (نوری نستعلیق)',
    category: 'Nastaliq',
    cssStack: "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Alvi Nastaleeq', 'Noori Nastaleeq', serif",
    isNastaliq: true,
  },
  {
    value: 'Gulzar',
    label: 'Gulzar Nastaliq (گلزار نستعلیق)',
    category: 'Nastaliq',
    cssStack: "'Gulzar', 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif",
    isNastaliq: true,
  },
  {
    value: 'Lateef',
    label: 'Lahori / Fajr Naskh - Lateef (لاہوری نسخ)',
    category: 'Naskh & Quranic',
    cssStack: "'Lateef', 'Urdu Typesetting', 'Noto Nastaliq Urdu', serif",
    isNastaliq: false,
  },
  {
    value: 'Amiri',
    label: 'Amiri Naskh (امیری خطِ نسخ)',
    category: 'Naskh & Quranic',
    cssStack: "'Amiri', 'Traditional Arabic', serif",
    isNastaliq: false,
  },
  {
    value: 'Amiri Quran',
    label: 'Amiri Quranic (خطِ قرآنی)',
    category: 'Naskh & Quranic',
    cssStack: "'Amiri Quran', 'Amiri', 'Traditional Arabic', serif",
    isNastaliq: false,
  },
  {
    value: 'Scheherazade New',
    label: 'Aswad / Press Naskh (اخباری نسخ)',
    category: 'Naskh & Quranic',
    cssStack: "'Scheherazade New', 'Traditional Arabic', serif",
    isNastaliq: false,
  },
  {
    value: 'Aref Ruqaa',
    label: 'Bombai / Ruqaa (خطِ رقعہ)',
    category: 'Calligraphy & Display',
    cssStack: "'Aref Ruqaa', 'Amiri', serif",
    isNastaliq: true,
  },
  {
    value: 'Rakkas',
    label: 'Rakkas Poster (رقاص جلی خط)',
    category: 'Calligraphy & Display',
    cssStack: "'Rakkas', 'Gulzar', serif",
    isNastaliq: true,
  },
  {
    value: 'Reem Kufi',
    label: 'Reem Kufi Headline (ریم کوفی)',
    category: 'Calligraphy & Display',
    cssStack: "'Reem Kufi', 'Noto Kufi Arabic', sans-serif",
    isNastaliq: false,
  },
  {
    value: 'Noto Kufi Arabic',
    label: 'Kufi Editorial (کوفی عربی)',
    category: 'Calligraphy & Display',
    cssStack: "'Noto Kufi Arabic', 'Noto Sans Arabic', sans-serif",
    isNastaliq: false,
  },
  {
    value: 'Noto Sans Arabic',
    label: 'Tehreer Sans (تحریر سادہ)',
    category: 'Sans & Modern',
    cssStack: "'Noto Sans Arabic', 'Segoe UI', sans-serif",
    isNastaliq: false,
  },
  {
    value: 'Readex Pro',
    label: 'Readex Editorial Sans (جدید اشاعت)',
    category: 'Sans & Modern',
    cssStack: "'Readex Pro', 'Noto Sans Arabic', sans-serif",
    isNastaliq: false,
  },
  {
    value: 'Segoe UI',
    label: 'Segoe UI (Latin / Mixed)',
    category: 'Latin',
    cssStack: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  {
    value: 'Times New Roman',
    label: 'Times New Roman',
    category: 'Latin',
    cssStack: "'Times New Roman', Georgia, serif",
  },
  {
    value: 'Arial',
    label: 'Arial',
    category: 'Latin',
    cssStack: "Arial, Helvetica, sans-serif",
  },
];

export function resolveFontStack(fontFamily?: string): string {
  if (!fontFamily) return URDU_FONT_OPTIONS[0].cssStack;
  const match = URDU_FONT_OPTIONS.find((f) => f.value === fontFamily);
  return match ? match.cssStack : `"${fontFamily}", 'Noto Nastaliq Urdu', serif`;
}

export function isTallNastaliqFont(fontFamily?: string): boolean {
  if (!fontFamily) return true;
  const match = URDU_FONT_OPTIONS.find((f) => f.value === fontFamily);
  return Boolean(match?.isNastaliq);
}
