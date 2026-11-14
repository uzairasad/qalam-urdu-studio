export type ToolType =
  | 'pick'
  | 'text'
  | 'rotate'
  | 'link'
  | 'delink'
  | 'textBox'
  | 'titleBox'
  | 'picRect'
  | 'picOval'
  | 'picRound'
  | 'graphic'
  | 'line'
  | 'table';

export type PaperSize = 'A4' | 'Letter' | 'Legal' | 'Tabloid' | 'Custom';
export type Orientation = 'portrait' | 'landscape';
export type InputLanguage = 'urdu' | 'english';
export type KeyboardLayout = 'phonetic' | 'monotype' | 'muqtadira';
export type TextAlign = 'right' | 'center' | 'left' | 'justify';

export interface PageSetup {
  paperSize: PaperSize;
  widthMm: number;
  heightMm: number;
  orientation: Orientation;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  columns: number;
  columnGutter: number;
  direction: 'rtl' | 'ltr';
}

export interface BaseElement {
  id: string;
  x: number; // in mm
  y: number;
  width: number;
  height: number;
  rotation?: number;
  borderColor?: string;
  borderWidth?: number; // pt
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  backgroundColor?: string;
  zIndex?: number;
  locked?: boolean;
}

/**
 * A stretch of a text frame's text with its own formatting. The runs' texts, joined, are the
 * frame's `text`; anything a run leaves out uses the frame's own setting.
 */
export interface TextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  fontFamily?: string;
  fontSize?: number; // pt
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  /** Formatting of parts of the text (per-word bold, colour, font…); absent when uniform. */
  runs?: TextRun[];
  isTitleBox?: boolean;
  fontFamily: string;
  fontSize: number; // in pt
  lineHeight: number; // e.g. 1.85 for Nastaliq
  letterSpacing: number; // px
  scaleX?: number; // % horizontal character scaling (50-200, default 100)
  paddingMm?: number; // inner text inset in mm
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: TextAlign;
  direction: 'rtl' | 'ltr';
  columns?: number;
  columnGutter?: number;
  linkedToId?: string; // ID of next text box
  linkedFromId?: string; // ID of prev text box
}

export interface PictureElement extends BaseElement {
  type: 'picture';
  imageSrc: string;
  /**
   * Where the image sits inside the frame (mm from the frame's top-left, at the size shown);
   * whatever falls outside the frame is cropped. When absent the image fits by `objectFit`.
   */
  imageBox?: { x: number; y: number; width: number; height: number };
  caption?: string;
  shape: 'rect' | 'oval' | 'rounded';
  objectFit: 'cover' | 'contain' | 'fill';
}

export interface GraphicElement extends BaseElement {
  type: 'graphic';
  shape: 'rect' | 'oval' | 'roundRect';
  fillColor: string;
}

export interface LineElement extends BaseElement {
  type: 'line';
  orientation: 'horizontal' | 'vertical';
  strokeWidth: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted' | 'double' | 'ornamental';
}

export interface TableElement extends BaseElement {
  type: 'table';
  rows: number;
  cols: number;
  data: string[][];
  headerRow?: boolean;
  fontFamily: string;
  fontSize: number;
  color: string;
  /** Relative column widths, first column first (the rightmost in RTL); equal when absent. */
  colWidths?: number[];
  /** Lines around the cells (default on). */
  cellBorders?: boolean;
  /** Cell text alignment (default centre). */
  cellAlign?: TextAlign;
}

export type DocElement =
  | TextElement
  | PictureElement
  | GraphicElement
  | LineElement
  | TableElement;

export interface Page {
  id: string;
  pageNumber: number;
  elements: DocElement[];
}

export interface DocumentProject {
  version: string;
  title: string;
  fileName: string;
  pageSetup: PageSetup;
  pages: Page[];
  masterElements: DocElement[];
}

export interface DocumentTab {
  id: string;
  project: DocumentProject;
  activePageIndex: number;
  selectedElementId: string | null;
  isModified: boolean;
  history: DocumentProject[];
  historyIndex: number;
}

