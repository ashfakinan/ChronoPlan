import { useState, useCallback } from 'react';

export function usePlannerSelection() {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);

  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const handleSelectAllInSection = useCallback((sectionTaskIds: string[]) => {
    setSelectedTaskIds((prev) => {
      const allSelected = sectionTaskIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        sectionTaskIds.forEach((id) => next.delete(id));
      } else {
        sectionTaskIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTaskIds(new Set());
    setIsSelectionMode(false);
  }, []);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => {
      if (prev) {
        setSelectedTaskIds(new Set());
        return false;
      }
      return true;
    });
  }, []);

  return {
    selectedTaskIds,
    setSelectedTaskIds,
    isSelectionMode,
    setIsSelectionMode,
    toggleTaskSelection,
    handleSelectAllInSection,
    clearSelection,
    toggleSelectionMode,
  };
}
