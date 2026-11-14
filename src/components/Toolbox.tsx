import React from 'react';
import { APP_VERSION } from '../appInfo';
import { ToolType } from '../types/inpage';
import {
  PickToolIcon,
  TextIBeamToolIcon,
  RotateToolIcon,
  LinkFrameToolIcon,
  DelinkFrameToolIcon,
  TextBoxToolIcon,
  TitleBoxToolIcon,
  PicRectToolIcon,
  PicRoundToolIcon,
  PicOvalToolIcon,
  GraphicShapeToolIcon,
  LineToolIcon,
  TableToolIcon,
  MasterPageToolIcon,
} from './DtpIcons';

interface ToolboxProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  isMasterPage: boolean;
  onToggleMasterPage: () => void;
}

export const Toolbox: React.FC<ToolboxProps> = ({
  activeTool,
  onSelectTool,
  isMasterPage,
  onToggleMasterPage,
}) => {
  const toolGroups: {
    id: ToolType;
    label: string;
    urduLabel: string;
    renderIcon: (active: boolean) => React.ReactNode;
    shortcut: string;
    group: 'select' | 'frame' | 'shape';
  }[] = [
    {
      id: 'pick',
      label: 'Arrow Tool (Pick & Move)',
      urduLabel: 'تیر کا نشان (پک ٹول)',
      renderIcon: (active) => <PickToolIcon className="w-5 h-5" active={active} />,
      shortcut: 'V / Esc',
      group: 'select',
    },
    {
      id: 'text',
      label: 'I-Beam Text Tool',
      urduLabel: 'ٹیکسٹ ٹول (متن لکھائی)',
      renderIcon: (active) => <TextIBeamToolIcon className="w-5 h-5" active={active} />,
      shortcut: 'T',
      group: 'select',
    },
    {
      id: 'rotate',
      label: 'Rotation Tool (Drag to rotate)',
      urduLabel: 'گھمانے کا ٹول (روٹیشن)',
      renderIcon: (active) => <RotateToolIcon className="w-5 h-5" active={active} />,
      shortcut: 'R',
      group: 'select',
    },
    {
      id: 'link',
      label: 'Link Text Frames',
      urduLabel: 'فریم لنک کریں',
      renderIcon: (active) => <LinkFrameToolIcon className="w-5 h-5" active={active} />,
      shortcut: 'L',
      group: 'select',
    },
    {
      id: 'delink',
      label: 'Delink Text Frames',
      urduLabel: 'فریم علیحدہ کریں',
      renderIcon: (active) => <DelinkFrameToolIcon className="w-5 h-5" active={active} />,
      shortcut: 'U',
      group: 'select',
    },
    {
      id: 'textBox',
      label: 'Standard Text Box',
      urduLabel: 'متن کا خانہ (ٹیکسٹ باکس)',
      renderIcon: (active) => <TextBoxToolIcon className="w-5 h-5" active={active} />,
      shortcut: 'B',
      group: 'frame',
    },
    {
      id: 'titleBox',
      label: 'Title Text Box',
      urduLabel: 'عنوان کا خانہ (ٹائٹل باکس)',
      renderIcon: (active) => <TitleBoxToolIcon className="w-5 h-5" active={active} />,
      shortcut: 'H',
      group: 'frame',
    },
    {
      id: 'picRect',
      label: 'Rectangular Picture Box',
      urduLabel: 'چوکور تصویری فریم',
      renderIcon: (active) => <PicRectToolIcon className="w-5 h-5" active={active} />,
      shortcut: 'P',
      group: 'frame',
    },
    {
      id: 'picRound',
      label: 'Rounded Picture Box',
      urduLabel: 'گول کناروں والا تصویری فریم',
      renderIcon: (active) => <PicRoundToolIcon className="w-5 h-5" active={active} />,
      shortcut: 'O',
      group: 'frame',
    },
    {
      id: 'picOval',
      label: 'Oval Picture Box',
      urduLabel: 'بیضوی تصویری فریم',
      renderIcon: (active) => <PicOvalToolIcon className="w-5 h-5" active={active} />,
      shortcut: 'E',
      group: 'frame',
    },
    {
      id: 'graphic',
      label: 'Graphic Shape Tool',
      urduLabel: 'گرافک باکس / شکل',
      renderIcon: (active) => <GraphicShapeToolIcon className="w-5 h-5" active={active} />,
      shortcut: 'S',
      group: 'shape',
    },
    {
      id: 'line',
      label: 'Line Tool (Dividers)',
      urduLabel: 'لکیر کا ٹول (ڈیوائیڈر)',
      renderIcon: (active) => <LineToolIcon className="w-5 h-5" active={active} />,
      shortcut: 'D',
      group: 'shape',
    },
    {
      id: 'table',
      label: 'Table Tool (جدول)',
      urduLabel: 'جدول / ٹیبل ٹول',
      renderIcon: (active) => <TableToolIcon className="w-5 h-5" active={active} />,
      shortcut: 'G',
      group: 'shape',
    },
  ];

  const renderButton = (t: (typeof toolGroups)[number]) => {
    const isActive = activeTool === t.id;
    return (
      <button
        key={t.id}
        type="button"
        aria-label={`${t.label} (${t.shortcut})`}
        aria-pressed={isActive}
        onClick={() => onSelectTool(t.id)}
        title={`${t.label} — ${t.urduLabel} [${t.shortcut}]`}
        className={`w-10 h-9 md:w-9 md:h-8.5 rounded-md flex items-center justify-center relative shrink-0 transition-all duration-150 touch-manipulation ${
          isActive
            ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-700/25'
            : 'text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-xs border border-transparent hover:border-slate-200/90 active:scale-95'
        }`}
      >
        {t.renderIcon(isActive)}
        {isActive && (
          <>
            <span
              className="hidden md:block absolute -left-1.5 top-1.5 bottom-1.5 w-[3px] rounded-r bg-blue-600"
              aria-hidden="true"
            />
            <span
              className="md:hidden absolute -bottom-1 left-2 right-2 h-[3px] rounded-t bg-blue-600"
              aria-hidden="true"
            />
          </>
        )}
      </button>
    );
  };

  const selectTools = toolGroups.filter((t) => t.group === 'select');
  const frameTools = toolGroups.filter((t) => t.group === 'frame');
  const shapeTools = toolGroups.filter((t) => t.group === 'shape');

  return (
    <div
      className="order-2 md:order-1 w-full h-12 md:w-[50px] md:h-auto bg-slate-50 border-t md:border-t-0 md:border-r border-slate-200 font-modern flex flex-row md:flex-col items-center px-2 py-1 md:px-0 md:py-2 select-none shrink-0 z-20 no-print overflow-x-auto md:overflow-x-hidden md:overflow-y-auto no-scrollbar touch-pan-x gap-1 md:gap-0"
      dir="ltr"
    >
      <div className="flex flex-row md:flex-col items-center gap-1 md:w-full md:px-1 shrink-0">
        {selectTools.map(renderButton)}
        <div className="h-6 w-px bg-slate-200 mx-0.5 shrink-0 md:hidden" />
        <div className="hidden md:block my-1 w-6 border-t border-slate-200" />
        {frameTools.map(renderButton)}
        <div className="h-6 w-px bg-slate-200 mx-0.5 shrink-0 md:hidden" />
        <div className="hidden md:block my-1 w-6 border-t border-slate-200" />
        {shapeTools.map(renderButton)}
      </div>

      <div className="h-6 w-px bg-slate-200 mx-0.5 shrink-0 md:hidden" />
      <div className="hidden md:block my-2 w-7 border-t border-slate-200" />

      {/* Master Page Switcher Button */}
      <div className="md:px-1 md:w-full flex flex-row md:flex-col items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onToggleMasterPage}
          aria-pressed={isMasterPage}
          title={`Master Page Mode (F12) — ${isMasterPage ? 'Exit Master Page' : 'Edit Master Page template'}`}
          className={`px-2.5 h-9 md:px-0 md:w-9 md:h-10 rounded-md font-bold flex flex-row md:flex-col items-center justify-center gap-1 md:gap-0.5 transition-all touch-manipulation shrink-0 ${
            isMasterPage
              ? 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-600 shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 shadow-2xs active:scale-95'
          }`}
        >
          <MasterPageToolIcon className="w-[18px] h-[18px]" active={isMasterPage} />
          <span className="text-[9px] md:text-[7px] leading-none tracking-tight font-semibold">
            {isMasterPage ? 'ON' : 'MASTER'}
          </span>
        </button>
      </div>

      <div className="hidden md:flex mt-auto pt-2 mb-0.5 flex-col items-center text-[9px] text-slate-400 font-arabic-sans leading-tight text-center px-0.5">
        <span>قلم</span>
        <span className="text-[8px] font-mono tabular-nums text-slate-400">v{APP_VERSION}</span>
      </div>
    </div>
  );
};
