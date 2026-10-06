import { useState, useRef, useEffect, useCallback } from 'react';
import { PlannerTask } from '../types';
import { DragAutoScroller } from '../utils/dragAutoScroll';

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
  containerId = 'planner-matrix-scroll',
}: UseTaskDragAndScrollProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTask, setDraggedTask] = useState<PlannerTask | null>(null);
  const [dropTarget, setDropTarget] = useState<DropCellInfo | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [scrollDirections, setScrollDirections] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const draggedTaskRef = useRef<PlannerTask | null>(null);
  const dropTargetRef = useRef<DropCellInfo | null>(null);
  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const autoScrollerRef = useRef<DragAutoScroller | null>(null);

  // Keep refs in sync
  useEffect(() => {
    draggedTaskRef.current = draggedTask;
  }, [draggedTask]);

  useEffect(() => {
    dropTargetRef.current = dropTarget;
  }, [dropTarget]);

  useEffect(() => {
    pointerPosRef.current = pointerPos;
  }, [pointerPos]);

  // Identify drop target under given coordinates
  const detectDropTarget = useCallback((x: number, y: number): DropCellInfo | null => {
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

  // Initialize auto-scroller once
  useEffect(() => {
    const scroller = new DragAutoScroller({
      threshold: 85,
      maxSpeed: 22,
      scrollWindow: true,
      onTargetCheck: (x, y) => {
        const found = detectDropTarget(x, y);
        setDropTarget(found);
      },
      onDirectionChange: (dirs) => {
        setScrollDirections(dirs);
      },
    });

    autoScrollerRef.current = scroller;

    return () => {
      scroller.stop();
    };
  }, [detectDropTarget]);

  // Update container ref when containerId changes or element mounts
  useEffect(() => {
    const container = document.getElementById(containerId);
    autoScrollerRef.current?.setContainer(container);
  }, [containerId, isDragging]);

  // Complete the drop operation
  const finalizeDrop = useCallback(async () => {
    const task = draggedTaskRef.current;
    const target = dropTargetRef.current;

    // Stop auto-scroller immediately
    autoScrollerRef.current?.stop();

    setIsDragging(false);
    setDraggedTask(null);
    setDropTarget(null);
    setPointerPos(null);
    setScrollDirections({ up: false, down: false, left: false, right: false });

    if (task && target) {
      // Only trigger if location actually changed
      if (task.date !== target.date || task.dayPart !== target.dayPart) {
        // Haptic feedback if supported
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([25, 40, 25]);
          } catch {
            // ignore
          }
        }
        await onDropTask(task.id, target.date, target.dayPart);
      }
    }
  }, [onDropTask]);

  // Global touchmove / pointermove handlers during drag
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowTouchMove = (e: TouchEvent) => {
      // Prevent browser bounce / pull-to-refresh while dragging
      if (e.cancelable) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      if (!touch) return;

      const x = touch.clientX;
      const y = touch.clientY;

      setPointerPos({ x, y });
      autoScrollerRef.current?.updatePointer(x, y);

      const found = detectDropTarget(x, y);
      setDropTarget(found);
    };

    const handleWindowTouchEnd = () => {
      finalizeDrop();
    };

    const handleWindowTouchCancel = () => {
      autoScrollerRef.current?.stop();
      setIsDragging(false);
      setDraggedTask(null);
      setDropTarget(null);
      setPointerPos(null);
    };

    // Attach non-passive touchmove for full drag control
    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
    window.addEventListener('touchend', handleWindowTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleWindowTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
      window.removeEventListener('touchcancel', handleWindowTouchCancel);
    };
  }, [isDragging, detectDropTarget, finalizeDrop]);

  // Start touch drag (called directly from grip handle or after long press)
  const startTouchDrag = useCallback(
    (e: React.TouchEvent | TouchEvent, task: PlannerTask) => {
      const touch = 'touches' in e ? e.touches[0] : null;
      if (!touch) return;

      // Haptic bump on pick up
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(30);
        } catch {
          // ignore
        }
      }

      const container = document.getElementById(containerId);
      autoScrollerRef.current?.setContainer(container);

      const x = touch.clientX;
      const y = touch.clientY;

      setIsDragging(true);
      setDraggedTask(task);
      setPointerPos({ x, y });

      const currentCell = detectDropTarget(x, y);
      setDropTarget(currentCell);

      autoScrollerRef.current?.updatePointer(x, y);
      autoScrollerRef.current?.start();
    },
    [containerId, detectDropTarget]
  );

  // Desktop HTML5 drag auto-scroll hook
  const handleDesktopDragOver = useCallback(
    (e: React.DragEvent, date: string, dayPart: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropTarget({ date, dayPart });

      const container = document.getElementById(containerId);
      autoScrollerRef.current?.setContainer(container);
      autoScrollerRef.current?.updatePointer(e.clientX, e.clientY);
    },
    [containerId]
  );

  const handleDesktopDragLeave = useCallback(() => {
    // leave drop target
  }, []);

  const handleDesktopDrop = useCallback(
    async (e: React.DragEvent, date: string, dayPart: string, fallbackTaskId?: string | null) => {
      e.preventDefault();
      autoScrollerRef.current?.stop();
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
    scrollDirections,
    startTouchDrag,
    handleDesktopDragOver,
    handleDesktopDragLeave,
    handleDesktopDrop,
    cancelDrag: finalizeDrop,
  };
}
