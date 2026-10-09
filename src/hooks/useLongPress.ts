import { useRef, useCallback } from 'react';

interface UseLongPressOptions {
  threshold?: number; // ms to trigger long press (default: 450ms)
  onLongPress: (id: string) => void;
  onClick?: (id: string) => void;
}

export function useLongPress({
  threshold = 450,
  onLongPress,
  onClick,
}: UseLongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressTriggeredRef = useRef<boolean>(false);
  const targetIdRef = useRef<string | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (id: string, e: React.TouchEvent) => {
      clearTimer();
      isLongPressTriggeredRef.current = false;
      targetIdRef.current = id;
      const touch = e.touches[0];
      startPosRef.current = { x: touch.clientX, y: touch.clientY };

      timerRef.current = setTimeout(() => {
        isLongPressTriggeredRef.current = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate(40);
          } catch {
            // ignore vibration error
          }
        }
        onLongPress(id);
      }, threshold);
    },
    [clearTimer, onLongPress, threshold]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startPosRef.current || !timerRef.current) return;
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - startPosRef.current.x);
      const deltaY = Math.abs(touch.clientY - startPosRef.current.y);
      // Cancel long press if user is scrolling
      if (deltaX > 10 || deltaY > 10) {
        clearTimer();
      }
    },
    [clearTimer]
  );

  const handleTouchEnd = useCallback(() => {
    clearTimer();
    // Reset position
    startPosRef.current = null;
  }, [clearTimer]);

  const handleMouseDown = useCallback(
    (id: string, e: React.MouseEvent) => {
      // Only left clicks
      if (e.button !== 0) return;
      clearTimer();
      isLongPressTriggeredRef.current = false;
      targetIdRef.current = id;
      startPosRef.current = { x: e.clientX, y: e.clientY };

      timerRef.current = setTimeout(() => {
        isLongPressTriggeredRef.current = true;
        onLongPress(id);
      }, threshold);
    },
    [clearTimer, onLongPress, threshold]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!startPosRef.current || !timerRef.current) return;
      const deltaX = Math.abs(e.clientX - startPosRef.current.x);
      const deltaY = Math.abs(e.clientY - startPosRef.current.y);
      if (deltaX > 10 || deltaY > 10) {
        clearTimer();
      }
    },
    [clearTimer]
  );

  const handleMouseUp = useCallback(() => {
    clearTimer();
    startPosRef.current = null;
  }, [clearTimer]);

  const handleClick = useCallback(
    (id: string, e: React.MouseEvent) => {
      // If long press just triggered, swallow click to avoid opening edit modal
      if (isLongPressTriggeredRef.current) {
        e.preventDefault();
        e.stopPropagation();
        setTimeout(() => {
          isLongPressTriggeredRef.current = false;
        }, 100);
        return;
      }
      onClick?.(id);
    },
    [onClick]
  );

  const getHandlers = useCallback(
    (id: string) => ({
      onTouchStart: (e: React.TouchEvent) => handleTouchStart(id, e),
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
      onMouseDown: (e: React.MouseEvent) => handleMouseDown(id, e),
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onClick: (e: React.MouseEvent) => handleClick(id, e),
    }),
    [
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleClick,
    ]
  );

  return {
    getHandlers,
    isLongPressTriggered: () => isLongPressTriggeredRef.current,
  };
}
