import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#272a34] text-[#eceef2] border border-[#3e4252] px-3.5 py-2 text-xs shadow-xl animate-in slide-in-from-bottom duration-200">
      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>
        Offline Mode — Planners & to-dos saved locally. Cloud will sync once back online.
      </span>
    </div>
  );
}
