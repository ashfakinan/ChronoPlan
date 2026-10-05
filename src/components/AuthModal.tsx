import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authError,
    clearAuthError,
    signInWithGoogle,
    signInWithGoogleRedirectFlow,
  } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handlePopupSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      setIsAuthModalOpen(false);
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedirectSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogleRedirectFlow();
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank');
    }
  };

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#273347] dark:bg-[#2e3e57] text-[#fdfcf9] flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#1f2126] dark:text-[#eceef2]">
                Sign in to ChronoPlan
              </h2>
              <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae]">
                Sync your planners and tasks to the cloud
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              clearAuthError();
              setIsAuthModalOpen(false);
            }}
            className="p-1.5 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close sign in dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Error Notice if any */}
          {authError && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-[#1f2126] dark:text-[#eceef2] space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-amber-800 dark:text-amber-300 block">
                    {authError.code === 'auth/popup-blocked'
                      ? 'Popup Blocked'
                      : authError.code === 'auth/unauthorized-domain'
                      ? 'Domain Authorization Required'
                      : 'Sign-In Notice'}
                  </span>
                  <p className="mt-0.5 text-[#606470] dark:text-[#9aa0ae] leading-relaxed">
                    {authError.message}
                  </p>
                </div>
              </div>

              {authError.suggestion && (
                <div className="text-[11px] text-[#606470] dark:text-[#9aa0ae] pt-1 border-t border-amber-500/15">
                  <strong>Tip:</strong> {authError.suggestion}
                </div>
              )}
            </div>
          )}

          {/* Iframe Notice */}
          {isIframe && (
            <div className="p-3 rounded-xl bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34] text-[11px] text-[#606470] dark:text-[#9aa0ae] flex items-center justify-between gap-2">
              <span>Running inside an embedded frame. If popups are restricted, open in a new tab:</span>
              <button
                type="button"
                onClick={handleOpenNewTab}
                className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 rounded-md shrink-0 flex items-center gap-1 min-h-[36px]"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Tab
              </button>
            </div>
          )}

          {/* Primary Action: Sign in with Google (Popup) */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handlePopupSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#1f2126] text-[#fdfcf9] hover:bg-[#343842] dark:bg-[#eceef2] dark:text-[#121317] dark:hover:bg-[#d8dbe2] rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-xs disabled:opacity-50 min-h-[48px]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoading ? 'Connecting to Google...' : 'Sign in with Google (Popup)'}</span>
            </button>

            {/* Fallback Option: Sign in with Redirect */}
            <button
              type="button"
              onClick={handleRedirectSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] text-[#1f2126] dark:text-[#eceef2] border border-[#e5e2da] dark:border-[#292b34] rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-colors min-h-[44px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#8c909c] ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sign in with Google (Redirect Flow)</span>
            </button>
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                clearAuthError();
                setIsAuthModalOpen(false);
              }}
              className="text-xs text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] py-2 min-h-[44px]"
            >
              Continue in Local Preview Mode →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
