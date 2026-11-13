import {
  DocElement,
  PageSetup,
  TextElement,
  PictureElement,
  GraphicElement,
  LineElement,
  TableElement,
} from '../types/inpage';
import { resolveFontStack } from './fonts';
import { URDU_NUMERALS } from './phoneticKeyboard';
import { getProjectBaseName } from './exportInpage';
import { saveFile } from '../platform/native';

function formatPageNumberToken(text: string, pageNumber: number, direction: 'rtl' | 'ltr'): string {
  const numStr = String(pageNumber);
  const localized =
    direction === 'rtl'
      ? numStr.replace(/[0-9]/g, (d) => URDU_NUMERALS[d] || d)
      : numStr;
  return text.replace(/\{\{PAGE\}\}/g, localized);
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Renders a single Qalam Urdu Studio document page onto a high-resolution Canvas.
 * Shared by both PNG export and multi-page PDF export.
 */
export async function renderPageToCanvas(
  pageSetup: PageSetup,
  elements: DocElement[],
  masterElements: DocElement[],
  pageNumber: number,
  scaleMultiplier = 2
): Promise<HTMLCanvasElement> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Proceed if fonts API rejects
    }
  }

  // 1mm = 3.7795px at 96 DPI
  const dpiScale = 3.7795 * scaleMultiplier;
  const width = Math.round(pageSetup.widthMm * dpiScale);
  const height = Math.round(pageSetup.heightMm * dpiScale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Crisp white paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const allElements = [...masterElements, ...elements];

  for (const elem of allElements) {
    const x = elem.x * dpiScale;
    const y = elem.y * dpiScale;
    const w = elem.width * dpiScale;
    const h = elem.height * dpiScale;

    ctx.save();
    if (elem.rotation) {
      const cx = x + w / 2;
      const cy = y + h / 2;
      ctx.translate(cx, cy);
      ctx.rotate((elem.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    // Box fill
    if (elem.backgroundColor && elem.backgroundColor !== 'transparent') {
      ctx.fillStyle = elem.backgroundColor;
      ctx.fillRect(x, y, w, h);
    }

    if (elem.type === 'graphic') {
      const g = elem as GraphicElement;
      if (g.fillColor && g.fillColor !== 'transparent') {
        ctx.fillStyle = g.fillColor;
        if (g.shape === 'oval') {
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (g.shape === 'roundRect') {
          drawRoundedRectPath(ctx, x, y, w, h, 8 * scaleMultiplier);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, w, h);
        }
      }
    }

    // Box border
    if (elem.type !== 'line' && elem.borderWidth && elem.borderWidth > 0 && elem.borderStyle !== 'none') {
      ctx.strokeStyle = elem.borderColor || '#000000';
      const strokePx = Math.max(1, elem.borderWidth * scaleMultiplier);
      ctx.lineWidth = strokePx;
      if (elem.borderStyle === 'dashed') ctx.setLineDash([6 * scaleMultiplier, 4 * scaleMultiplier]);
      else if (elem.borderStyle === 'dotted') ctx.setLineDash([2 * scaleMultiplier, 3 * scaleMultiplier]);
      else ctx.setLineDash([]);

      if (elem.type === 'graphic' && (elem as GraphicElement).shape === 'oval') {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (
        (elem.type === 'graphic' && (elem as GraphicElement).shape === 'roundRect') ||
        (elem.type === 'picture' && (elem as PictureElement).shape === 'rounded')
      ) {
        drawRoundedRectPath(ctx, x, y, w, h, 8 * scaleMultiplier);
        ctx.stroke();
      } else if (elem.type === 'picture' && (elem as PictureElement).shape === 'oval') {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(x, y, w, h);
        if (elem.borderStyle === 'double') {
          ctx.lineWidth = Math.max(1, strokePx * 0.5);
          ctx.strokeRect(
            x + 2.5 * scaleMultiplier,
            y + 2.5 * scaleMultiplier,
            Math.max(1, w - 5 * scaleMultiplier),
            Math.max(1, h - 5 * scaleMultiplier)
          );
        }
      }
      ctx.setLineDash([]);
    }

    if (elem.type === 'line') {
      const l = elem as LineElement;
      ctx.strokeStyle = l.color || '#000000';
      ctx.lineWidth = Math.max(1, (l.strokeWidth || 1) * scaleMultiplier);
      if (l.style === 'dashed') ctx.setLineDash([6 * scaleMultiplier, 4 * scaleMultiplier]);
      else if (l.style === 'dotted') ctx.setLineDash([2 * scaleMultiplier, 3 * scaleMultiplier]);
      else ctx.setLineDash([]);

      const isVert = l.orientation === 'vertical';
      ctx.beginPath();
      if (isVert) {
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w / 2, y + h);
      } else {
        ctx.moveTo(x, y + h / 2);
        ctx.lineTo(x + w, y + h / 2);
      }
      ctx.stroke();

      if (l.style === 'double') {
        const offset = 2.5 * scaleMultiplier;
        ctx.beginPath();
        if (isVert) {
          ctx.moveTo(x + w / 2 + offset, y);
          ctx.lineTo(x + w / 2 + offset, y + h);
        } else {
          ctx.moveTo(x, y + h / 2 + offset);
          ctx.lineTo(x + w, y + h / 2 + offset);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    if (elem.type === 'picture') {
      const p = elem as PictureElement;
      if (p.imageSrc) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            ctx.save();
            if (p.shape === 'oval') {
              ctx.beginPath();
              ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
              ctx.clip();
            } else if (p.shape === 'rounded') {
              drawRoundedRectPath(ctx, x, y, w, h, 8 * scaleMultiplier);
              ctx.clip();
            } else {
              ctx.beginPath();
              ctx.rect(x, y, w, h);
              ctx.clip();
            }

            const fit = p.objectFit || 'cover';
            if (fit === 'fill' || !img.naturalWidth || !img.naturalHeight) {
              ctx.drawImage(img, x, y, w, h);
            } else {
              const imgRatio = img.naturalWidth / img.naturalHeight;
              const boxRatio = w / h;
              let drawW = w;
              let drawH = h;
              let drawX = x;
              let drawY = y;
              if (fit === 'contain') {
                if (imgRatio > boxRatio) {
                  drawH = w / imgRatio;
                  drawY = y + (h - drawH) / 2;
                } else {
                  drawW = h * imgRatio;
                  drawX = x + (w - drawW) / 2;
                }
              } else {
                // cover
                if (imgRatio > boxRatio) {
                  drawW = h * imgRatio;
                  drawX = x - (drawW - w) / 2;
                } else {
                  drawH = w / imgRatio;
                  drawY = y - (drawH - h) / 2;
                }
              }
              ctx.drawImage(img, drawX, drawY, drawW, drawH);
            }

            ctx.restore();
            resolve();
          };
          img.onerror = () => resolve();
          img.src = p.imageSrc;
        });
      }
      if (p.caption) {
        const capH = 14 * scaleMultiplier;
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(x, y + h - capH, w, capH);
        ctx.fillStyle = '#ffffff';
        ctx.font = `${9 * scaleMultiplier}px ${resolveFontStack('Noto Nastaliq Urdu')}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.caption, x + w / 2, y + h - capH / 2, w - 8 * scaleMultiplier);
      }
    }

    if (elem.type === 'text') {
      const t = elem as TextElement;
      const fontSizePx = t.fontSize * (96 / 72) * scaleMultiplier;
      const lineHeightPx = fontSizePx * (t.lineHeight || 1.85);
      const scaleX = (t.scaleX || 100) / 100;
      const insetPx = (t.paddingMm ?? 1.5) * dpiScale;
      const padX = Math.max(5 * scaleMultiplier, insetPx + 2 * scaleMultiplier);
      const padTop = Math.max(4 * scaleMultiplier, fontSizePx * 0.28 + insetPx);
      const padBottom = Math.max(5 * scaleMultiplier, fontSizePx * 0.34 + insetPx);
      const renderedText = formatPageNumberToken(t.text || '', pageNumber, t.direction || 'rtl');

      ctx.fillStyle = t.color || '#000000';
      ctx.font = `${t.italic ? 'italic ' : ''}${t.bold ? 'bold ' : ''}${fontSizePx}px ${resolveFontStack(t.fontFamily)}`;
      ctx.direction = t.direction || 'rtl';

      const colCount = Math.max(1, t.columns || 1);
      const colGapPx = (t.columnGutter ?? 4) * dpiScale;
      const innerWidth = Math.max(20, w - padX * 2);
      const singleColW = (innerWidth - colGapPx * (colCount - 1)) / colCount;
      const maxLineTextW = Math.max(20, singleColW / scaleX);

      // Wrap all paragraphs into drawable lines
      const allLines: string[] = [];
      const paragraphs = renderedText.split('\n');
      for (const para of paragraphs) {
        if (!para.trim()) {
          allLines.push('');
          continue;
        }
        const words = para.split(/\s+/);
        let line = '';
        for (const word of words) {
          const testLine = line ? `${line} ${word}` : word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxLineTextW && line) {
            allLines.push(line);
            line = word;
          } else {
            line = testLine;
          }
        }
        allLines.push(line);
      }

      const usableHeight = Math.max(lineHeightPx, h - padTop - padBottom);
      const maxLinesPerCol = Math.max(1, Math.floor(usableHeight / lineHeightPx));

      allLines.forEach((wl, idx) => {
        const colIdx = Math.floor(idx / maxLinesPerCol);
        if (colIdx >= colCount) return;
        const lineInCol = idx % maxLinesPerCol;
        const cursorY = y + padTop + fontSizePx * 0.85 + lineInCol * lineHeightPx;
        if (cursorY > y + h - 2 * scaleMultiplier) return;

        // RTL column order goes right-to-left for Urdu multi-column frames
        const visualColIdx = (t.direction || 'rtl') === 'rtl' ? colCount - 1 - colIdx : colIdx;
        const colLeft = x + padX + visualColIdx * (singleColW + colGapPx);
        const colRight = colLeft + singleColW;

        let drawX = colRight;
        if (t.align === 'center') {
          ctx.textAlign = 'center';
          drawX = colLeft + singleColW / 2;
        } else if (t.align === 'left') {
          ctx.textAlign = 'left';
          drawX = colLeft;
        } else {
          ctx.textAlign = t.direction === 'ltr' ? 'left' : 'right';
          drawX = t.direction === 'ltr' ? colLeft : colRight;
        }

        ctx.save();
        if (scaleX !== 1) {
          ctx.translate(drawX, 0);
          ctx.scale(scaleX, 1);
          ctx.translate(-drawX, 0);
        }
        ctx.fillText(wl, drawX, cursorY, maxLineTextW);

        if (t.underline && wl.trim()) {
          const textW = Math.min(maxLineTextW, ctx.measureText(wl).width);
          const uY = cursorY + fontSizePx * 0.14;
          const uStart =
            ctx.textAlign === 'center'
              ? drawX - textW / 2
              : ctx.textAlign === 'left'
              ? drawX
              : drawX - textW;
          ctx.beginPath();
          ctx.strokeStyle = t.color || '#000000';
          ctx.lineWidth = Math.max(1, fontSizePx * 0.06);
          ctx.moveTo(uStart, uY);
          ctx.lineTo(uStart + textW, uY);
          ctx.stroke();
        }
        ctx.restore();
      });
    }

    if (elem.type === 'table') {
      const tbl = elem as TableElement;
      const rows = tbl.data.length || 1;
      const cols = tbl.data[0]?.length || 1;
      const cellW = w / cols;
      const cellH = h / rows;
      const tblFontPx = (tbl.fontSize || 10) * (96 / 72) * scaleMultiplier;

      tbl.data.forEach((row, rIdx) => {
        row.forEach((cell, cIdx) => {
          const cx = x + (cols - 1 - cIdx) * cellW; // RTL table layout
          const cy = y + rIdx * cellH;
          if (rIdx === 0 && tbl.headerRow) {
            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(cx, cy, cellW, cellH);
          }
          ctx.strokeStyle = tbl.borderColor || '#64748b';
          ctx.lineWidth = Math.max(1, 0.8 * scaleMultiplier);
          ctx.strokeRect(cx, cy, cellW, cellH);
          ctx.fillStyle = tbl.color || '#1f2937';
          ctx.font = `${rIdx === 0 && tbl.headerRow ? 'bold ' : ''}${tblFontPx}px ${resolveFontStack(tbl.fontFamily)}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cell, cx + cellW / 2, cy + cellH / 2, cellW - 6 * scaleMultiplier);
        });
      });
    }

    ctx.restore();
  }

  return canvas;
}

/**
 * Renders a Qalam Urdu Studio document page cleanly onto a high-resolution Canvas
 * and downloads it as a PNG file (works offline in Edge, Firefox, and Chrome).
 */
export async function exportPageToPng(
  pageSetup: PageSetup,
  elements: DocElement[],
  masterElements: DocElement[],
  fileName: string,
  pageNumber: number
): Promise<string | null> {
  const canvas = await renderPageToCanvas(pageSetup, elements, masterElements, pageNumber, 2);
  const dataUrl = canvas.toDataURL('image/png');
  const baseName = getProjectBaseName(fileName) || 'Qalam_Page';
  return saveFile(`${baseName}_Page_${pageNumber}.png`, dataUrl, 'image/png');
}
