import React from 'react';

interface HorizontalRulerProps {
  pageWidthMm: number;
  zoom: number;
  cursorX: number;
  offsetX: number;
  margins?: { left: number; right: number };
}

export const HorizontalRuler: React.FC<HorizontalRulerProps> = ({
  pageWidthMm,
  zoom,
  cursorX,
  offsetX,
  margins,
}) => {
  const scale = 3.78 * zoom;
  const totalPx = pageWidthMm * scale;
  const labelStepMm = zoom < 0.7 ? 20 : 10;
  const minorStepMm = zoom >= 1.25 ? 2 : 5;

  const ticks: React.ReactNode[] = [];
  const maxStep = Math.floor(pageWidthMm / minorStepMm);

  for (let i = 0; i <= maxStep; i++) {
    const mm = i * minorStepMm;
    const pos = mm * scale;
    const isMajor = mm % labelStepMm === 0;
    const isMid = !isMajor && mm % 5 === 0;

    ticks.push(
      <div
        key={mm}
        className="absolute bottom-0 pointer-events-none"
        style={{ left: `${pos}px` }}
      >
        <div
          className={`w-px ${
            isMajor ? 'h-2.5 bg-slate-500' : isMid ? 'h-1.5 bg-slate-400' : 'h-1 bg-slate-300'
          }`}
        />
        {isMajor && (
          <span
            className={`absolute top-[-9px] text-[8px] font-mono tabular-nums leading-none select-none whitespace-nowrap text-slate-600 ${
              mm === 0 ? 'left-0.5' : '-translate-x-1/2 left-0'
            }`}
          >
            {mm}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="h-5 relative select-none overflow-hidden shrink-0 no-print flex-1 bg-slate-200/80 border-b border-slate-300">
      <div
        className="absolute top-0 bottom-0 bg-white border-x border-slate-300"
        style={{
          width: `${totalPx}px`,
          transform: `translateX(${offsetX}px)`,
        }}
      >
        {margins && (
          <>
            <div
              className="absolute top-0 bottom-0 left-0 pointer-events-none bg-slate-100/90"
              style={{ width: `${margins.left * scale}px` }}
            />
            <div
              className="absolute top-0 bottom-0 right-0 pointer-events-none bg-slate-100/90"
              style={{ width: `${margins.right * scale}px` }}
            />
          </>
        )}

        {ticks}

        {cursorX >= 0 && cursorX <= pageWidthMm && (
          <div
            className="absolute top-0 bottom-0 w-px z-10 pointer-events-none bg-blue-600"
            style={{ left: `${cursorX * scale}px` }}
          />
        )}
      </div>
    </div>
  );
};

interface VerticalRulerProps {
  pageHeightMm: number;
  zoom: number;
  cursorY: number;
  offsetY: number;
  margins?: { top: number; bottom: number };
}

export const VerticalRuler: React.FC<VerticalRulerProps> = ({
  pageHeightMm,
  zoom,
  cursorY,
  offsetY,
  margins,
}) => {
  const scale = 3.78 * zoom;
  const totalPx = pageHeightMm * scale;
  const labelStepMm = zoom < 0.7 ? 20 : 10;
  const minorStepMm = zoom >= 1.25 ? 2 : 5;

  const ticks: React.ReactNode[] = [];
  const maxStep = Math.floor(pageHeightMm / minorStepMm);

  for (let i = 0; i <= maxStep; i++) {
    const mm = i * minorStepMm;
    const pos = mm * scale;
    const isMajor = mm % labelStepMm === 0;
    const isMid = !isMajor && mm % 5 === 0;

    ticks.push(
      <div
        key={mm}
        className="absolute right-0 pointer-events-none"
        style={{ top: `${pos}px` }}
      >
        <div
          className={`h-px ${
            isMajor ? 'w-2.5 bg-slate-500' : isMid ? 'w-1.5 bg-slate-400' : 'w-1 bg-slate-300'
          }`}
        />
        {isMajor && (
          <span
            className={`absolute right-2.5 text-[7px] font-mono tabular-nums leading-none select-none whitespace-nowrap text-slate-600 ${
              mm === 0 ? 'top-0.5' : '-translate-y-1/2 top-0'
            }`}
            style={{
              writingMode: 'vertical-rl',
              transform: mm === 0 ? 'rotate(180deg)' : 'translateY(-50%) rotate(180deg)',
            }}
          >
            {mm}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="w-5 relative select-none overflow-hidden shrink-0 no-print bg-slate-200/80 border-r border-slate-300">
      <div
        className="absolute left-0 right-0 bg-white border-y border-slate-300"
        style={{
          height: `${totalPx}px`,
          transform: `translateY(${offsetY}px)`,
        }}
      >
        {margins && (
          <>
            <div
              className="absolute left-0 right-0 top-0 pointer-events-none bg-slate-100/90"
              style={{ height: `${margins.top * scale}px` }}
            />
            <div
              className="absolute left-0 right-0 bottom-0 pointer-events-none bg-slate-100/90"
              style={{ height: `${margins.bottom * scale}px` }}
            />
          </>
        )}

        {ticks}

        {cursorY >= 0 && cursorY <= pageHeightMm && (
          <div
            className="absolute left-0 right-0 h-px z-10 pointer-events-none bg-blue-600"
            style={{ top: `${cursorY * scale}px` }}
          />
        )}
      </div>
    </div>
  );
};
