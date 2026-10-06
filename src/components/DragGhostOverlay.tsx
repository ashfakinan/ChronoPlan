import React from 'react';
import { PlannerTask, Subject } from '../types';
import { DropCellInfo } from '../hooks/useTaskDragAndScroll';
import { formatShortDate } from '../utils/dateUtils';
import { ArrowRight, ArrowLeft, ArrowDown, ArrowUp, Layers } from 'lucide-react';

interface DragGhostOverlayProps {
  isDragging: boolean;
  task: PlannerTask | null;
  pointerPos: { x: number; y: number } | null;
  dropTarget: DropCellInfo | null;
  subject?: Subject;
  scrollDirections: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  };
}

export function DragGhostOverlay({
  isDragging,
  task,
  pointerPos,
  dropTarget,
  subject,
  scrollDirections,
}: DragGhostOverlayProps) {
  if (!isDragging || !task || !pointerPos) return null;

  return (
    <>
      {/* Edge Auto-Scroll Visual Hints */}
      {scrollDirections.right && (
        <div className="fixed right-0 top-0 bottom-0 w-8 sm:w-12 pointer-events-none z-50 bg-gradient-to-l from-blue-500/25 to-transparent flex items-center justify-end pr-1 sm:pr-2 animate-pulse">
          <div className="bg-[#1f2126]/90 dark:bg-[#eceef2]/90 text-white dark:text-[#121317] p-1.5 rounded-full shadow-lg">
            <ArrowRight className="w-4 h-4 animate-bounce" />
          </div>
        </div>
      )}

      {scrollDirections.left && (
        <div className="fixed left-0 top-0 bottom-0 w-8 sm:w-12 pointer-events-none z-50 bg-gradient-to-r from-blue-500/25 to-transparent flex items-center justify-start pl-1 sm:pl-2 animate-pulse">
          <div className="bg-[#1f2126]/90 dark:bg-[#eceef2]/90 text-white dark:text-[#121317] p-1.5 rounded-full shadow-lg">
            <ArrowLeft className="w-4 h-4 animate-bounce" />
          </div>
        </div>
      )}

      {scrollDirections.down && (
        <div className="fixed bottom-0 left-0 right-0 h-10 pointer-events-none z-50 bg-gradient-to-t from-blue-500/25 to-transparent flex items-end justify-center pb-2 animate-pulse">
          <div className="bg-[#1f2126]/90 dark:bg-[#eceef2]/90 text-white dark:text-[#121317] p-1.5 rounded-full shadow-lg">
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </div>
        </div>
      )}

      {scrollDirections.up && (
        <div className="fixed top-0 left-0 right-0 h-10 pointer-events-none z-50 bg-gradient-to-b from-blue-500/25 to-transparent flex items-start justify-center pt-2 animate-pulse">
          <div className="bg-[#1f2126]/90 dark:bg-[#eceef2]/90 text-white dark:text-[#121317] p-1.5 rounded-full shadow-lg">
            <ArrowUp className="w-4 h-4 animate-bounce" />
          </div>
        </div>
      )}

      {/* Floating Task Preview (Ghost Badge directly following finger) */}
      <div
        className="fixed pointer-events-none z-50 transition-none will-change-transform"
        style={{
          left: 0,
          top: 0,
          transform: `translate3d(${pointerPos.x - 70}px, ${pointerPos.y - 45}px, 0)`,
        }}
      >
        <div className="flex flex-col gap-1 items-start">
          {/* Target destination hint badge */}
          {dropTarget ? (
            <div className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-md flex items-center gap-1 border border-blue-400">
              <Layers className="w-3 h-3" />
              <span>
                Move to {dropTarget.dayPart} ({formatShortDate(dropTarget.date)})
              </span>
            </div>
          ) : (
            <div className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1f2126]/80 text-[#fdfcf9] dark:bg-[#eceef2]/90 dark:text-[#121317] shadow-md backdrop-blur-xs">
              Drag over target day or block
            </div>
          )}

          {/* Elevated Task Card */}
          <div className="w-48 sm:w-56 p-2.5 rounded-xl bg-[#fdfcf9] dark:bg-[#202127] border-2 border-blue-500 shadow-2xl flex items-start gap-2 scale-105 rotate-1">
            <div
              className="w-1.5 self-stretch rounded-full shrink-0"
              style={{ backgroundColor: subject?.color || '#3B82F6' }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] truncate leading-tight">
                {task.title}
              </div>
              {subject && (
                <div
                  className="text-[9px] font-bold mt-0.5 truncate"
                  style={{ color: subject.color }}
                >
                  {subject.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
