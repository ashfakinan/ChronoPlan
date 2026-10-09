import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ZoomControllerProps {
  zoom: number; // percentage, e.g. 100, 80, 50
  onZoomChange: (newZoom: number) => void;
  minZoom?: number; // default 50
  maxZoom?: number; // default 100
  className?: string;
}

export function ZoomController({
  zoom,
  onZoomChange,
  minZoom = 50,
  maxZoom = 100,
  className = '',
}: ZoomControllerProps) {
  const step = 10;

  const handleZoomOut = () => {
    onZoomChange(Math.max(minZoom, zoom - step));
  };

  const handleZoomIn = () => {
    onZoomChange(Math.min(maxZoom, zoom + step));
  };

  const handleReset = () => {
    onZoomChange(100);
  };

  const isMin = zoom <= minZoom;
  const isMax = zoom >= maxZoom;

  return (
    <div
      className={`inline-flex items-center gap-1 bg-[#f4f2ec] dark:bg-[#22242b] p-1 rounded-xl border border-[#e5e2da] dark:border-[#292b34] shadow-2xs select-none ${className}`}
      title="Zoom view (Zoom out max 50%)"
    >
      <button
        type="button"
        onClick={handleZoomOut}
        disabled={isMin}
        className={`p-1.5 rounded-lg text-xs font-semibold transition-all min-h-[32px] min-w-[32px] flex items-center justify-center ${
          isMin
            ? 'opacity-35 cursor-not-allowed text-[#8c909c]'
            : 'text-[#1f2126] dark:text-[#eceef2] hover:bg-[#eae7df] dark:hover:bg-[#2f313c] active:scale-95'
        }`}
        title={isMin ? 'Maximum zoom out reached (50%)' : 'Zoom Out (-10%)'}
        aria-label="Zoom Out"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={handleReset}
        className={`px-2 py-1 text-[11px] font-bold tracking-tight rounded-md transition-colors min-h-[32px] flex items-center gap-1 ${
          zoom === 100
            ? 'text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2]'
            : 'text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/15'
        }`}
        title="Click to reset to 100%"
        aria-label={`Current zoom: ${zoom}%. Click to reset.`}
      >
        <span>{zoom}%</span>
        {isMin && (
          <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400">
            Min
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={handleZoomIn}
        disabled={isMax}
        className={`p-1.5 rounded-lg text-xs font-semibold transition-all min-h-[32px] min-w-[32px] flex items-center justify-center ${
          isMax
            ? 'opacity-35 cursor-not-allowed text-[#8c909c]'
            : 'text-[#1f2126] dark:text-[#eceef2] hover:bg-[#eae7df] dark:hover:bg-[#2f313c] active:scale-95'
        }`}
        title={isMax ? 'Maximum zoom in reached (100%)' : 'Zoom In (+10%)'}
        aria-label="Zoom In"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>

      {zoom !== 100 && (
        <button
          type="button"
          onClick={handleReset}
          className="p-1.5 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
          title="Reset zoom to 100%"
          aria-label="Reset zoom"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
