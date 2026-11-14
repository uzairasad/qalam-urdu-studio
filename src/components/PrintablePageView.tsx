import React from 'react';
import { tableColumnPercents } from '../utils/tables';
import { RichText } from './RichText';
import {
  DocElement,
  Page,
  GraphicElement,
  LineElement,
  PageSetup,
  PictureElement,
  TableElement,
  TextElement,
} from '../types/inpage';
import { resolveFontStack } from '../utils/fonts';
import { URDU_NUMERALS } from '../utils/phoneticKeyboard';

interface PrintablePageViewProps {
  page: Page;
  pageSetup: PageSetup;
  masterElements: DocElement[];
  showGuides?: boolean;
  className?: string;
}

export const PrintablePageView: React.FC<PrintablePageViewProps> = ({
  page,
  pageSetup,
  masterElements,
  showGuides = false,
  className = '',
}) => {
  const allElements = [...masterElements, ...page.elements];

  const renderElement = (elem: DocElement) => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${elem.x}mm`,
      top: `${elem.y}mm`,
      width: `${elem.width}mm`,
      height: `${elem.height}mm`,
      transform: elem.rotation ? `rotate(${elem.rotation}deg)` : undefined,
      backgroundColor: elem.backgroundColor || 'transparent',
      borderWidth: elem.type !== 'line' && elem.borderWidth ? `${elem.borderWidth}pt` : undefined,
      borderColor: elem.type !== 'line' ? elem.borderColor || 'transparent' : undefined,
      borderStyle: elem.type !== 'line' ? elem.borderStyle || 'none' : undefined,
      boxSizing: 'border-box',
    };

    if (elem.type === 'text') {
      const te = elem as TextElement;
      const fontSizePt = te.fontSize || 12;
      const fontSizeMmApprox = fontSizePt * 0.352778;
      const insetMm = te.paddingMm ?? 1.5;
      const padTopMm = Math.max(1, fontSizeMmApprox * 0.28 + insetMm);
      const padBottomMm = Math.max(1.2, fontSizeMmApprox * 0.34 + insetMm);
      const padSideMm = Math.max(1.2, insetMm + 0.5);
      const scaleFactor = (te.scaleX || 100) / 100;
      const pageNumStr = String(page.pageNumber);
      const localizedNum =
        (te.direction || 'rtl') === 'rtl'
          ? pageNumStr.replace(/[0-9]/g, (d) => URDU_NUMERALS[d] || d)
          : pageNumStr;
      const transformOrigin =
        te.align === 'left' ? 'left top' : te.align === 'center' ? 'center top' : 'right top';

      return (
        <div key={elem.id} style={baseStyle}>
          <div
            className="w-full h-full overflow-hidden box-border"
            style={{
              paddingTop: `${padTopMm.toFixed(2)}mm`,
              paddingBottom: `${padBottomMm.toFixed(2)}mm`,
              paddingLeft: `${padSideMm.toFixed(2)}mm`,
              paddingRight: `${padSideMm.toFixed(2)}mm`,
            }}
          >
            <div
              className="w-full whitespace-pre-wrap break-words"
              style={{
                fontFamily: resolveFontStack(te.fontFamily),
                fontSize: `${fontSizePt}pt`,
                lineHeight: te.lineHeight || 1.85,
                letterSpacing: te.letterSpacing ? `${te.letterSpacing}px` : undefined,
                textAlign: te.align || 'right',
                direction: te.direction || 'rtl',
                color: te.color || '#000',
                fontWeight: te.bold ? 'bold' : 'normal',
                fontStyle: te.italic ? 'italic' : 'normal',
                textDecoration: te.underline ? 'underline' : 'none',
                textRendering: 'optimizeLegibility',
                columnCount: te.columns && te.columns > 1 ? te.columns : undefined,
                columnGap: te.columns && te.columns > 1 ? `${te.columnGutter ?? 4}mm` : undefined,
                transform: scaleFactor !== 1 ? `scaleX(${scaleFactor})` : undefined,
                transformOrigin,
              }}
            >
              <RichText
                te={te}
                fontSize={(pt) => `${pt}pt`}
                formatText={(t) => t.replace(/\{\{PAGE\}\}/g, localizedNum)}
              />
            </div>
          </div>
        </div>
      );
    }

    if (elem.type === 'picture') {
      const pe = elem as PictureElement;
      const fitClass =
        pe.objectFit === 'contain'
          ? 'object-contain'
          : pe.objectFit === 'fill'
          ? 'object-fill'
          : 'object-cover';
      return (
        <div key={elem.id} style={baseStyle}>
          <div
            className={`w-full h-full overflow-hidden relative flex flex-col items-center justify-center bg-slate-50 ${
              pe.shape === 'oval'
                ? 'rounded-full'
                : pe.shape === 'rounded'
                ? 'rounded-lg'
                : ''
            }`}
          >
            {pe.imageSrc && (
              <img
                src={pe.imageSrc}
                alt={pe.caption || ''}
                referrerPolicy="no-referrer"
                className={pe.imageBox ? 'absolute max-w-none' : `w-full h-full ${fitClass}`}
                style={
                  pe.imageBox
                    ? {
                        left: `${pe.imageBox.x}mm`,
                        top: `${pe.imageBox.y}mm`,
                        width: `${pe.imageBox.width}mm`,
                        height: `${pe.imageBox.height}mm`,
                      }
                    : undefined
                }
              />
            )}
            {pe.caption && (
              <div
                className="absolute bottom-0 inset-x-0 bg-black/65 text-white px-2 py-1 leading-[2.0] text-center font-nastaliq truncate"
                style={{ fontSize: '9pt' }}
              >
                {pe.caption}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (elem.type === 'graphic') {
      const ge = elem as GraphicElement;
      return (
        <div key={elem.id} style={baseStyle}>
          <div
            className={`w-full h-full ${
              ge.shape === 'oval'
                ? 'rounded-full'
                : ge.shape === 'roundRect'
                ? 'rounded-lg'
                : ''
            }`}
            style={{ backgroundColor: ge.fillColor }}
          />
        </div>
      );
    }

    if (elem.type === 'line') {
      const le = elem as LineElement;
      const isVert = le.orientation === 'vertical';
      const lineBorder = `${le.strokeWidth || 1}pt ${le.style || 'solid'} ${le.color || '#1a1a1a'}`;
      return (
        <div key={elem.id} style={baseStyle} className="flex items-center justify-center">
          <div
            style={
              isVert
                ? { height: '100%', width: 0, borderLeft: lineBorder }
                : { width: '100%', height: 0, borderTop: lineBorder }
            }
          />
        </div>
      );
    }

    if (elem.type === 'table') {
      const tbl = elem as TableElement;
      return (
        <div key={elem.id} style={baseStyle} className={`overflow-hidden ${tbl.backgroundColor === 'transparent' ? '' : 'bg-white'}`} dir="rtl">
          <table
            className="w-full h-full border-collapse text-right leading-[1.75]"
            style={{
              fontFamily: resolveFontStack(tbl.fontFamily),
              fontSize: `${tbl.fontSize || 10}pt`,
              color: tbl.color || '#1f2937',
              tableLayout: tbl.colWidths ? 'fixed' : undefined,
            }}
          >
            {tbl.colWidths && (
              <colgroup>
                {tableColumnPercents(tbl).map((pct, i) => (
                  <col key={i} style={{ width: `${pct}%` }} />
                ))}
              </colgroup>
            )}
            <tbody>
              {tbl.data.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className={rIdx === 0 && tbl.headerRow ? 'bg-slate-100 font-bold' : ''}
                >
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="p-1"
                      style={{
                        border: tbl.cellBorders === false ? 'none' : `0.75pt solid ${tbl.borderColor || '#64748b'}`,
                        textAlign: tbl.cellAlign ?? 'center',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      dir="ltr"
      className={`bg-white relative overflow-hidden print-page-view ${className}`}
      style={{
        width: `${pageSetup.widthMm}mm`,
        height: `${pageSetup.heightMm}mm`,
        minWidth: `${pageSetup.widthMm}mm`,
        minHeight: `${pageSetup.heightMm}mm`,
      }}
    >
      {showGuides && (
        <div
          className="absolute pointer-events-none border border-pink-400/55"
          style={{
            top: `${pageSetup.margins.top}mm`,
            left: `${pageSetup.margins.left}mm`,
            right: `${pageSetup.margins.right}mm`,
            bottom: `${pageSetup.margins.bottom}mm`,
          }}
        />
      )}
      {allElements.map(renderElement)}
    </div>
  );
};
