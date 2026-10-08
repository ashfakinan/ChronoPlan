import { useState, useRef, useEffect, useCallback } from 'react';
import { PlannerTask } from '../types';

export interface DropCellInfo {
  date: string;
  dayPart: string;
}

interface UseTaskDragAndScrollProps {
  onDropTask: (taskId: string, targetDate: string, targetDayPart: string) => Promise<void> | void;
  containerId?: string;
}

export function useTaskDragAndScroll({
  onDropTask,
}: UseTaskDragAndScrollProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTask, setDraggedTask] = useState<PlannerTask | null>(null);
  const [dropTarget, setDropTarget] = useState<DropCellInfo | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);

  const draggedTaskRef = useRef<PlannerTask | null>(null);
  const dropTargetRef = useRef<DropCellInfo | null>(null);
  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);

  // Synchronize refs
  useEffect(() => {
    draggedTaskRef.current = draggedTask;
  }, [draggedTask]);

  useEffect(() => {
    dropTargetRef.current = dropTarget;
  }, [dropTarget]);

  useEffect(() => {
    pointerPosRef.current = pointerPos;
  }, [pointerPos]);

  // Identify drop target under given screen coordinates
  const detectDropTarget = useCallback((x: number, y: number): DropCellInfo | null => {
    if (typeof document === 'undefined') return null;
    const elem = document.elementFromPoint(x, y);
    if (!elem) return null;

    const targetCell = elem.closest<HTMLElement>('[data-drop-target="true"]');
    if (targetCell) {
      const date = targetCell.getAttribute('data-drop-date');
      const dayPart = targetCell.getAttribute('data-drop-daypart');
      if (date && dayPart) {
        return { date, dayPart };
      }
    }
    return null;
  }, []);

  // Complete the drop operation
  const finalizeDrop = useCallback(async () => {
    const task = draggedTaskRef.current;
    const target = dropTargetRef.current;

    if (typeof document !== 'undefined') {
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
    }

    setIsDragging(false);
    setDraggedTask(null);
    setDropTarget(null);
    setPointerPos(null);
    pointerPosRef.current = null;

    if (task && target) {
      if (task.date !== target.date || task.dayPart !== target.dayPart) {
        // Haptic feedback for successful drop
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([25, 45]);
          } catch {
            // ignore
          }
        }
        await onDropTask(task.id, target.date, target.dayPart);
      }
    }
  }, [onDropTask]);

  // Global touch handlers during active touch drag
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowTouchMove = (e: TouchEvent) => {
      // Prevent browser default scroll during task drag
      if (e.cancelable) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      if (!touch) return;

      const currentX = touch.clientX;
      const currentY = touch.clientY;

      setPointerPos({ x: currentX, y: currentY });
      pointerPosRef.current = { x: currentX, y: currentY };

      const found = detectDropTarget(currentX, currentY);
      setDropTarget(found);
    };

    const handleWindowTouchEnd = () => {
      finalizeDrop();
    };

    const handleWindowTouchCancel = () => {
      setIsDragging(false);
      setDraggedTask(null);
      setDropTarget(null);
      setPointerPos(null);
      pointerPosRef.current = null;
      if (typeof document !== 'undefined') {
        document.body.style.userSelect = '';
        document.body.style.touchAction = '';
      }
    };

    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
    window.addEventListener('touchend', handleWindowTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleWindowTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
      window.removeEventListener('touchcancel', handleWindowTouchCancel);
    };
  }, [isDragging, detectDropTarget, finalizeDrop]);

  // Start touch drag (called on grip handle or task card hold)
  const startTouchDrag = useCallback(
    (e: React.TouchEvent | TouchEvent, task: PlannerTask) => {
      const touch = 'touches' in e ? e.touches[0] : null;
      if (!touch) return;

      // Haptic confirmation of task lift
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([35]);
        } catch {
          // ignore
        }
      }

      if (typeof document !== 'undefined') {
        document.body.style.userSelect = 'none';
        document.body.style.touchAction = 'none';
      }

      const x = touch.clientX;
      const y = touch.clientY;

      setIsDragging(true);
      setDraggedTask(task);
      setPointerPos({ x, y });
      pointerPosRef.current = { x, y };

      const currentCell = detectDropTarget(x, y);
      setDropTarget(currentCell);
    },
    [detectDropTarget]
  );

  // Desktop HTML5 drag support
  const handleDesktopDragOver = useCallback(
    (e: React.DragEvent, date: string, dayPart: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropTarget({ date, dayPart });
    },
    []
  );

  const handleDesktopDragLeave = useCallback(() => {
    // leave target
  }, []);

  const handleDesktopDrop = useCallback(
    async (e: React.DragEvent, date: string, dayPart: string, fallbackTaskId?: string | null) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('text/plain') || fallbackTaskId;
      setDropTarget(null);
      setDraggedTask(null);
      setIsDragging(false);

      if (taskId) {
        await onDropTask(taskId, date, dayPart);
      }
    },
    [onDropTask]
  );

  return {
    isDragging,
    draggedTask,
    dropTarget,
    pointerPos,
    startTouchDrag,
    handleDesktopDragOver,
    handleDesktopDragLeave,
    handleDesktopDrop,
    cancelDrag: finalizeDrop,
  };
}
