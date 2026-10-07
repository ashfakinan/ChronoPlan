import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';

export function AppUpdateToast() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('New version ready');

  useEffect(() => {
    // Check if app just updated
    const lastVersion = localStorage.getItem('cp_app_version');
    const CURRENT_VERSION = '1.6.0';

    if (lastVersion && lastVersion !== CURRENT_VERSION) {
      setToastMessage('✨ Updated: Continued Task Multi-Day Distribution & Auto Side Scroll active!');
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 5000);
      localStorage.setItem('cp_app_version', CURRENT_VERSION);
      return () => clearTimeout(timer);
    } else if (!lastVersion) {
      localStorage.setItem('cp_app_version', CURRENT_VERSION);
    }

    // Custom event or check
    const handleUpdateReady = () => {
      setToastMessage('✨ Update ready. Tap to refresh.');
      setShowToast(true);
    };

    window.addEventListener('chrono-update-ready', handleUpdateReady);
    return () => window.removeEventListener('chrono-update-ready', handleUpdateReady);
  }, []);

  if (!showToast) return null;

  return (
    <div className="fixed top-16 right-4 z-50 flex items-center gap-2.5 rounded-xl bg-[#1f2126] text-[#fdfcf9] dark:bg-[#eceef2] dark:text-[#121317] border border-[#3e4252] dark:border-[#d1d5db] px-3.5 py-2.5 text-xs shadow-2xl animate-in slide-in-from-top-2 duration-300">
      <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-600 shrink-0" />
      <span className="font-medium">{toastMessage}</span>
      <button
        type="button"
        onClick={() => {
          if (toastMessage.includes('refresh')) {
            window.location.reload();
          } else {
            setShowToast(false);
          }
        }}
        className="ml-1 p-1 hover:opacity-70 rounded transition-opacity"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
