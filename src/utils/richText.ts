/**
 * Per-word formatting in text frames (`TextElement.runs`): helpers shared by the canvas, print
 * and export renderers, and by editing, which keeps runs in step with the text.
 */
import type { TextElement, TextRun } from '../types/inpage.ts';

export const RUN_STYLE_KEYS = ['bold', 'italic', 'underline', 'color', 'fontFamily', 'fontSize'] as const;

/** The frame's runs, or one run of all its text when it has none (or they don't match it). */
export function runsOf(te: Pick<TextElement, 'text' | 'runs'>): TextRun[] {
  const runs = te.runs;
  if (runs && runs.length && runs.map((r) => r.text).join('') === te.text) return runs;
  return [{ text: te.text }];
}

/** Merges neighbouring runs with the same formatting and drops empty ones. */
export function mergeRuns(runs: TextRun[]): TextRun[] {
  const out: TextRun[] = [];
  for (const r of runs) {
    if (!r.text) continue;
    const last = out[out.length - 1];
    if (last && RUN_STYLE_KEYS.every((k) => last[k] === r[k])) last.text += r.text;
    else out.push({ ...r });
  }
  return out;
}

/** True when any run carries formatting of its own. */
export function hasFormatting(runs: TextRun[] | undefined): boolean {
  return !!runs && runs.some((r) => RUN_STYLE_KEYS.some((k) => r[k] !== undefined));
}

/**
 * The runs after the text changed from `before` to `after` (typing, find/replace, the story
 * editor): the changed stretch takes the formatting of the run it starts in.
 */
export function editRuns(runs: TextRun[], before: string, after: string): TextRun[] | undefined {
  if (!hasFormatting(runs) || runs.map((r) => r.text).join('') !== before) return undefined;
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start++;
  let end = 0;
  while (
    end < before.length - start &&
    end < after.length - start &&
    before[before.length - 1 - end] === after[after.length - 1 - end]
  ) {
    end++;
  }
  const removeTo = before.length - end;
  const inserted = after.slice(start, after.length - end);
  const out: TextRun[] = [];
  let pos = 0;
  let placed = false;
  for (const r of runs) {
    const a = pos;
    const b = pos + r.text.length;
    pos = b;
    let text = '';
    if (a < start) text += r.text.slice(0, Math.min(r.text.length, start - a));
    // New text joins the run it follows (typing at the end of a bold word continues it).
    if (!placed && ((start > a && start <= b) || (start === 0 && a === 0))) {
      text += inserted;
      placed = true;
    }
    if (b > removeTo) text += r.text.slice(Math.max(0, removeTo - a));
    out.push({ ...r, text });
  }
  if (!placed && out.length) out[out.length - 1].text += inserted;
  const merged = mergeRuns(out);
  return merged.map((r) => r.text).join('') === after && hasFormatting(merged) ? merged : undefined;
}

/** Removes a frame-wide setting from every run (the frame's new value then applies to all). */
export function clearRunStyle(runs: TextRun[], keys: readonly string[]): TextRun[] | undefined {
  const out = mergeRuns(
    runs.map((r) => {
      const c: TextRun = { ...r };
      for (const k of keys) delete (c as unknown as Record<string, unknown>)[k];
      return c;
    })
  );
  return hasFormatting(out) ? out : undefined;
}

/** Scales every run's own font size (when the frame's size is scaled). */
export function scaleRuns(runs: TextRun[] | undefined, factor: number): TextRun[] | undefined {
  if (!runs) return runs;
  return runs.map((r) => (r.fontSize ? { ...r, fontSize: Math.round(r.fontSize * factor * 10) / 10 } : r));
}

/**
 * An element with an update applied, keeping its runs in step: text edits move the runs with
 * the text, and a frame-wide style (bold, colour, font…) set without runs applies to all of it.
 */
export function updateTextElement<T extends { type: string }>(el: T, updated: Partial<TextElement>): T {
  const next = { ...el, ...updated } as T & Partial<TextElement>;
  if (el.type !== 'text' || 'runs' in updated) return next;
  const te = el as unknown as TextElement;
  if (!te.runs) return next;
  let runs: TextRun[] | undefined = te.runs;
  if (typeof updated.text === 'string' && updated.text !== te.text) runs = editRuns(runs, te.text, updated.text);
  const styleKeys = RUN_STYLE_KEYS.filter((k) => k in updated);
  if (runs && styleKeys.length) runs = clearRunStyle(runs, styleKeys);
  if (runs) next.runs = runs;
  else delete next.runs;
  return next;
}
