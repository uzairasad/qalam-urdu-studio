/**
 * Makes imported text fit its frames. Documents from InPage were set in InPage's own fonts,
 * which are narrower and shorter than the bundled ones, so the same text at the same size can
 * need more room than the frame InPage gave it. This measures every text frame the way the page
 * canvas lays it out and, where the text would be cut off, reduces the font size (down to
 * `minScale` of the original) until it fits. Browser only; frames that already fit are untouched.
 */
import type { DocumentProject, TextElement } from '../types/inpage.ts';
import { resolveFontStack } from './fonts.ts';

const MM_TO_PX = 3.78; // as DocumentCanvas at 100% zoom

/** Padding the canvas puts around frame text (DocumentCanvas, text element). */
function padding(fontSizePx: number, paddingMm = 1.5) {
  const inset = paddingMm * MM_TO_PX;
  return {
    top: Math.max(4, Math.round(fontSizePx * 0.28 + inset)),
    bottom: Math.max(5, Math.round(fontSizePx * 0.34 + inset)),
    side: Math.max(5, Math.round(inset + 2)),
  };
}

export async function fitTextToFrames(project: DocumentProject, minScale = 0.55): Promise<number> {
  if (typeof document === 'undefined') return 0;
  const frames: TextElement[] = [];
  for (const page of project.pages) for (const el of page.elements) if (el.type === 'text' && el.text.trim()) frames.push(el);
  if (!frames.length) return 0;

  // Fonts must be loaded before anything is measured.
  const families = [...new Set(frames.map((f) => f.fontFamily))];
  await Promise.all(
    families.map((f) => document.fonts?.load(`16px ${resolveFontStack(f)}`, 'ابپ abc').catch(() => undefined))
  );
  await document.fonts?.ready;

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none;';
  const box = document.createElement('div');
  box.style.cssText = 'white-space:pre-wrap;overflow-wrap:break-word;word-break:normal;text-rendering:optimizeLegibility;';
  host.appendChild(box);
  document.body.appendChild(host);

  // Shrinking keeps each frame's line spacing (InPage's), so lines stay where InPage put them.
  const lineHeightAt = (f: TextElement, original: number, size: number) =>
    Math.min(6, ((f.lineHeight || 1.85) * original) / size);

  const fits = (f: TextElement, size: number, lineHeight: number) => {
    const px = size * (96 / 72);
    const pad = padding(px, f.paddingMm);
    const width = f.width * MM_TO_PX - 2 * pad.side;
    const height = f.height * MM_TO_PX - pad.top - pad.bottom;
    box.style.width = `${Math.max(4, width / ((f.scaleX || 100) / 100))}px`;
    box.style.fontFamily = resolveFontStack(f.fontFamily);
    box.style.fontSize = `${px}px`;
    box.style.lineHeight = String(lineHeight);
    box.style.fontWeight = f.bold ? 'bold' : 'normal';
    box.style.fontStyle = f.italic ? 'italic' : 'normal';
    box.style.direction = f.direction || 'rtl';
    box.style.textAlign = f.align || 'right';
    box.style.letterSpacing = f.letterSpacing ? `${f.letterSpacing}px` : 'normal';
    const columns = f.columns && f.columns > 1 ? f.columns : 0;
    box.style.columnCount = columns ? String(columns) : 'auto';
    box.style.columnGap = columns ? `${(f.columnGutter ?? 4) * MM_TO_PX}px` : 'normal';
    box.style.height = columns ? `${Math.max(4, height)}px` : 'auto';
    box.textContent = f.text.replace(/\{\{PAGE\}\}/g, '99');
    if (columns) return box.scrollWidth <= Math.ceil(box.clientWidth) + 1;
    return box.scrollHeight <= height + 1;
  };

  let changed = 0;
  try {
    for (const f of frames) {
      const original = f.fontSize;
      // First keep the line spacing (fewer, narrower lines); if that can't fit, the text has
      // more lines than InPage set, so the spacing has to shrink with the font.
      let keepPitch = true;
      const lh = (size: number) => (keepPitch ? lineHeightAt(f, original, size) : f.lineHeight || 1.85);
      const test = (size: number) => fits(f, size, lh(size));
      if (test(original)) continue;
      let lo = original * minScale;
      let hi = original;
      if (!test(lo)) keepPitch = false;
      if (test(lo)) {
        for (let i = 0; i < 7; i++) {
          const mid = (lo + hi) / 2;
          if (test(mid)) lo = mid;
          else hi = mid;
        }
      }
      const size = Math.max(1, Math.floor(lo * 10) / 10);
      f.lineHeight = Math.round(lh(size) * 1000) / 1000;
      f.fontSize = size;
      changed++;
    }
  } finally {
    host.remove();
  }
  return changed;
}
