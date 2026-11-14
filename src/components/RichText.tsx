import React from 'react';
import type { TextElement } from '../types/inpage';
import { resolveFontStack } from '../utils/fonts';
import { runsOf } from '../utils/richText';

/**
 * A text frame's text with its per-word formatting (runs), as spans inside the frame's text
 * box, which carries the frame's own style. `fontSize` turns a run's point size into CSS.
 */
export const RichText: React.FC<{
  te: TextElement;
  fontSize: (pt: number) => string;
  formatText: (text: string) => string;
}> = ({ te, fontSize, formatText }) => {
  // Lines keep the frame's spacing (InPage's) even where a word is set larger.
  const pitch = fontSize((te.fontSize || 12) * (te.lineHeight || 1.85));
  const runs = runsOf(te);
  if (runs.length === 1 && runs[0].text === te.text && !te.runs) return <>{formatText(te.text)}</>;
  return (
    <>
      {runs.map((r, i) => {
        const style: React.CSSProperties = {};
        if (r.bold !== undefined) style.fontWeight = r.bold ? 'bold' : 'normal';
        if (r.italic !== undefined) style.fontStyle = r.italic ? 'italic' : 'normal';
        if (r.underline !== undefined) style.textDecoration = r.underline ? 'underline' : 'none';
        if (r.color) style.color = r.color;
        if (r.fontFamily) style.fontFamily = resolveFontStack(r.fontFamily);
        if (r.fontSize) {
          style.fontSize = fontSize(r.fontSize);
          style.lineHeight = pitch;
        }
        return Object.keys(style).length ? (
          <span key={i} style={style}>
            {formatText(r.text)}
          </span>
        ) : (
          <React.Fragment key={i}>{formatText(r.text)}</React.Fragment>
        );
      })}
    </>
  );
};
