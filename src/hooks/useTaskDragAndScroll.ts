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
  containerId = 'planner-matrix-scroll',
}: UseTaskDragAndScrollProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTask, setDraggedTask] = useState<PlannerTask | null>(null);
  const [dropTarget, setDropTarget] = useState<DropCellInfo | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);

  const draggedTaskRef = useRef<PlannerTask | null>(null);
  const dropTargetRef = useRef<DropCellInfo | null>(null);
  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const animFrameRef = useRef<number | null>(null);

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

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

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
            navigator.vibrate([20, 35]);
          } catch {
            // ignore
          }
        }
        await onDropTask(task.id, target.date, target.dayPart);
      }
    }
  }, [onDropTask]);

  // Smooth edge scrolling loop running during drag
  // Only scrolls when the finger reaches the edge boundary (e.g. dragging from Morning down to Night)
  useEffect(() => {
    if (!isDragging) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const scrollLoop = () => {
      const pos = pointerPosRef.current;
      if (!pos) {
        animFrameRef.current = requestAnimationFrame(scrollLoop);
        return;
      }

      // Locate active scrollable container
      const container =
        document.getElementById(containerId) ||
        document.getElementById('day-focus-scroll') ||
        document.getElementById('daily-modal-scroll') ||
        document.getElementById('planner-matrix-scroll') ||
        document.querySelector('.overflow-y-auto') ||
        document.querySelector('.overflow-auto');

      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let rect: { top: number; bottom: number; left: number; right: number };
      if (container && container instanceof HTMLElement) {
        const cRect = container.getBoundingClientRect();
        rect = {
          top: Math.max(0, cRect.top),
          bottom: Math.min(viewportHeight, cRect.bottom),
          left: Math.max(0, cRect.left),
          right: Math.min(viewportWidth, cRect.right),
        };
      } else {
        rect = { top: 0, bottom: viewportHeight, left: 0, right: viewportWidth };
      }

      const EDGE_ZONE_Y = 110; // Active edge trigger zone in pixels
      const EDGE_ZONE_X = Math.max(100, Math.round(rect.right * 0.15)); // Proportional edge zone for smooth side scrolling

      let scrollDeltaY = 0;
      let scrollDeltaX = 0;

      // When dragging downwards (e.g. from Morning down towards Night)
      if (pos.y > rect.bottom - EDGE_ZONE_Y) {
        const depth = Math.min(1, Math.max(0, (pos.y - (rect.bottom - EDGE_ZONE_Y)) / EDGE_ZONE_Y));
        scrollDeltaY = Math.round(4 + depth * 15); // 4px to 19px per frame
      }
      // When dragging upwards (e.g. from Night up towards Morning)
      else if (pos.y < rect.top + EDGE_ZONE_Y) {
        const depth = Math.min(1, Math.max(0, ((rect.top + EDGE_ZONE_Y) - pos.y) / EDGE_ZONE_Y));
        scrollDeltaY = -Math.round(4 + depth * 15);
      }

      // Horizontal edge scrolling (Auto Side Scroll for Matrix table view & carousels)
      if (pos.x > rect.right - EDGE_ZONE_X) {
        const depth = Math.min(1, Math.max(0, (pos.x - (rect.right - EDGE_ZONE_X)) / EDGE_ZONE_X));
        scrollDeltaX = Math.round(5 + depth * 16);
      } else if (pos.x < rect.left + EDGE_ZONE_X) {
        const depth = Math.min(1, Math.max(0, ((rect.left + EDGE_ZONE_X) - pos.x) / EDGE_ZONE_X));
        scrollDeltaX = -Math.round(5 + depth * 16);
      }

      if (scrollDeltaY !== 0 || scrollDeltaX !== 0) {
        if (container && container instanceof HTMLElement) {
          if (scrollDeltaY !== 0) container.scrollTop += scrollDeltaY;
          if (scrollDeltaX !== 0) container.scrollLeft += scrollDeltaX;
        } else {
          window.scrollBy(scrollDeltaX, scrollDeltaY);
        }

        // Also check if matrix or carousel containers need horizontal side scrolling
        const matrixScroll = document.getElementById('planner-matrix-scroll');
        if (matrixScroll && scrollDeltaX !== 0 && matrixScroll !== container) {
          matrixScroll.scrollLeft += scrollDeltaX;
        }
        const carouselScroll = document.getElementById('day-carousel-scroll');
        if (carouselScroll && scrollDeltaX !== 0 && carouselScroll !== container) {
          carouselScroll.scrollLeft += scrollDeltaX;
        }

        // Drop target re-check as elements scroll under the pointer
        const found = detectDropTarget(pos.x, pos.y);
        if (found) {
          setDropTarget(found);
        }
      }

      animFrameRef.current = requestAnimationFrame(scrollLoop);
    };

    animFrameRef.current = requestAnimationFrame(scrollLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isDragging, containerId, detectDropTarget]);

  // Global touch handlers during active drag
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowTouchMove = (e: TouchEvent) => {
      // Prevent browser default scroll during task drag to avoid layout jumps
      if (e.cancelable) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      if (!touch) return;

      const x = touch.clientX;
      const y = touch.clientY;

      setPointerPos({ x, y });
      pointerPosRef.current = { x, y };

      const found = detectDropTarget(x, y);
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

  // Start touch drag (called on grip handle or task card)
  const startTouchDrag = useCallback(
    (e: React.TouchEvent | TouchEvent, task: PlannerTask) => {
      const touch = 'touches' in e ? e.touches[0] : null;
      if (!touch) return;

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(20);
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
