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
  containerId = 'day-focus-scroll',
}: UseTaskDragAndScrollProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTask, setDraggedTask] = useState<PlannerTask | null>(null);
  const [dropTarget, setDropTarget] = useState<DropCellInfo | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);

  const draggedTaskRef = useRef<PlannerTask | null>(null);
  const dropTargetRef = useRef<DropCellInfo | null>(null);
  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastTouchPosRef = useRef<{ x: number; y: number } | null>(null);
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

  // Robust active scroll container finder that checks actual visibility
  const getActiveScrollContainer = useCallback((): HTMLElement | null => {
    if (typeof document === 'undefined') return null;

    // Check preferred container
    if (containerId) {
      const el = document.getElementById(containerId);
      if (el && el.offsetParent !== null && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) {
        return el;
      }
    }

    // Check candidate scroll IDs in priority order
    const candidateIds = ['day-focus-scroll', 'planner-matrix-scroll', 'daily-modal-scroll'];
    for (const id of candidateIds) {
      const el = document.getElementById(id);
      if (el && el.offsetParent !== null && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) {
        return el;
      }
    }

    // Check visible elements with overflow auto/scroll
    const scrollables = document.querySelectorAll<HTMLElement>('.overflow-y-auto, .overflow-auto');
    for (let i = 0; i < scrollables.length; i++) {
      const el = scrollables[i];
      if (el.offsetParent !== null && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) {
        return el;
      }
    }

    return null;
  }, [containerId]);

  // Scroll active container or window
  const performScroll = useCallback((dx: number, dy: number) => {
    const container = getActiveScrollContainer();
    if (container) {
      if (dy !== 0) container.scrollTop += dy;
      if (dx !== 0) container.scrollLeft += dx;
    } else {
      window.scrollBy(dx, dy);
    }
  }, [getActiveScrollContainer]);

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
    lastTouchPosRef.current = null;

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

  // Continuous auto-scrolling animation loop while dragging
  // When thumb is in the lower half -> smoothly auto-scrolls down so lower sections (Afternoon, Evening, Night) come into view
  // When thumb is in the upper half -> smoothly auto-scrolls up so upper sections (Morning) come into view
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

      const container = getActiveScrollContainer();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let rectTop = 0;
      let rectBottom = viewportHeight;
      let rectLeft = 0;
      let rectRight = viewportWidth;

      if (container) {
        const cRect = container.getBoundingClientRect();
        rectTop = Math.max(0, cRect.top);
        rectBottom = Math.min(viewportHeight, cRect.bottom);
        rectLeft = Math.max(0, cRect.left);
        rectRight = Math.min(viewportWidth, cRect.right);
      }

      const visibleHeight = rectBottom - rectTop;
      const centerY = rectTop + visibleHeight * 0.5;
      const deadZoneY = Math.max(35, visibleHeight * 0.12);

      let scrollDeltaY = 0;

      // Lower half (moving down towards Evening, Night)
      if (pos.y > centerY + deadZoneY) {
        const range = Math.max(1, rectBottom - (centerY + deadZoneY));
        const depth = Math.min(1, Math.max(0, (pos.y - (centerY + deadZoneY)) / range));
        scrollDeltaY = Math.round(3 + depth * 17); // 3px to 20px per frame
      }
      // Upper half (moving up towards Morning)
      else if (pos.y < centerY - deadZoneY) {
        const range = Math.max(1, (centerY - deadZoneY) - rectTop);
        const depth = Math.min(1, Math.max(0, ((centerY - deadZoneY) - pos.y) / range));
        scrollDeltaY = -Math.round(3 + depth * 17);
      }

      // Horizontal side-scrolling (for Matrix table view)
      const visibleWidth = rectRight - rectLeft;
      const centerX = rectLeft + visibleWidth * 0.5;
      const deadZoneX = Math.max(40, visibleWidth * 0.14);

      let scrollDeltaX = 0;
      if (pos.x > centerX + deadZoneX) {
        const range = Math.max(1, rectRight - (centerX + deadZoneX));
        const depth = Math.min(1, Math.max(0, (pos.x - (centerX + deadZoneX)) / range));
        scrollDeltaX = Math.round(3 + depth * 17);
      } else if (pos.x < centerX - deadZoneX) {
        const range = Math.max(1, (centerX - deadZoneX) - rectLeft);
        const depth = Math.min(1, Math.max(0, ((centerX - deadZoneX) - pos.x) / range));
        scrollDeltaX = -Math.round(3 + depth * 17);
      }

      if (scrollDeltaY !== 0 || scrollDeltaX !== 0) {
        performScroll(scrollDeltaX, scrollDeltaY);

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
  }, [isDragging, getActiveScrollContainer, performScroll, detectDropTarget]);

  // Global touch handlers during active drag
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

      // DIRECT THUMB MOVEMENT: Screen moves directly with the thumb!
      // As the thumb moves down or up across sections, the screen moves with the thumb!
      if (lastTouchPosRef.current) {
        const deltaY = currentY - lastTouchPosRef.current.y;
        const deltaX = currentX - lastTouchPosRef.current.x;

        if (Math.abs(deltaY) > 0 || Math.abs(deltaX) > 0) {
          performScroll(deltaX, deltaY);
        }
      }

      setPointerPos({ x: currentX, y: currentY });
      pointerPosRef.current = { x: currentX, y: currentY };
      lastTouchPosRef.current = { x: currentX, y: currentY };

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
      lastTouchPosRef.current = null;
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
  }, [isDragging, detectDropTarget, finalizeDrop, performScroll]);

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
      lastTouchPosRef.current = { x, y };

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
