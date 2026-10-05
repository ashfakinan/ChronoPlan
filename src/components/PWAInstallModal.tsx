import React from 'react';
import {
  X,
  Download,
  Smartphone,
  Tablet,
  Share,
  PlusSquare,
  CheckCircle2,
  Cloud,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PWAInstallModal({ isOpen, onClose }: PWAInstallModalProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-700 dark:text-blue-400 flex items-center justify-center border border-blue-600/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#1f2126] dark:text-[#eceef2]">
                Install ChronoPlan App
              </h2>
              <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae]">
                Install on Mobile, Tablet & Desktop via link
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8c909c] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close install modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Real-time Bidirectional Cloud Sync Highlight */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
              <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Real-Time Two-Way Cloud Sync</span>
            </div>
            <p className="text-[11px] text-[#606470] dark:text-[#9aa0ae] leading-relaxed">
              Every task, schedule plan, and to-do item automatically syncs between this installed app and your web browser in real time. Works offline and updates immediately upon reconnecting!
            </p>
          </div>

          {/* Already installed banner */}
          {isInstalled ? (
            <div className="text-center py-4 space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#1f2126] dark:text-[#eceef2]">
                ChronoPlan is Already Installed!
              </h3>
              <p className="text-xs text-[#606470] dark:text-[#9aa0ae]">
                You are currently running ChronoPlan in standalone application mode.
              </p>
            </div>
          ) : isInstallable ? (
            /* Chromium / Android / Tablet / Desktop 1-Click Flow */
            <div className="space-y-3">
              <p className="text-xs text-[#606470] dark:text-[#9aa0ae] leading-relaxed">
                Click the button below to add ChronoPlan directly to your home screen or app launcher. It launches full-screen without address bars just like a native app.
              </p>

              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-xs min-h-[48px]"
              >
                <Download className="w-4 h-4" />
                <span>Install ChronoPlan App Now</span>
              </button>
            </div>
          ) : isIOS ? (
            /* iOS Safari Step-by-Step Guide */
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#1f2126] dark:text-[#eceef2]">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>How to Install on iPhone & iPad:</span>
              </div>

              <div className="space-y-2 text-xs text-[#606470] dark:text-[#9aa0ae]">
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34]">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-semibold text-[#1f2126] dark:text-[#eceef2]">
                      Tap the Share button
                    </span>
                    <p className="text-[11px] text-[#8c909c] mt-0.5">
                      In the Safari bottom menu (square with an arrow pointing up{' '}
                      <Share className="w-3.5 h-3.5 inline text-blue-600" />).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34]">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-semibold text-[#1f2126] dark:text-[#eceef2]">
                      Select "Add to Home Screen"
                    </span>
                    <p className="text-[11px] text-[#8c909c] mt-0.5">
                      Scroll down in the share sheet and tap{' '}
                      <PlusSquare className="w-3.5 h-3.5 inline text-blue-600" />{' '}
                      <strong>Add to Home Screen</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34]">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-semibold text-[#1f2126] dark:text-[#eceef2]">
                      Tap "Add" in top-right corner
                    </span>
                    <p className="text-[11px] text-[#8c909c] mt-0.5">
                      The ChronoPlan app icon will immediately appear on your home screen!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Generic Browser / Desktop Instructions */
            <div className="space-y-3">
              <p className="text-xs text-[#606470] dark:text-[#9aa0ae] leading-relaxed">
                To install ChronoPlan on this device:
              </p>

              <div className="space-y-2 text-xs text-[#606470] dark:text-[#9aa0ae]">
                <div className="p-2.5 rounded-lg bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34]">
                  <strong>On Android / Chrome / Edge:</strong> Tap the browser menu (⋮) and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </div>
                <div className="p-2.5 rounded-lg bg-[#f4f2ec] dark:bg-[#22242b] border border-[#e5e2da] dark:border-[#292b34]">
                  <strong>On iPhone / iPad (Safari):</strong> Tap the Share button (<Share className="w-3 h-3 inline" />) and choose <strong>"Add to Home Screen"</strong>.
                </div>
              </div>
            </div>
          )}

          {/* Benefits summary */}
          <div className="pt-2 border-t border-[#e5e2da] dark:border-[#292b34]">
            <span className="text-[11px] uppercase font-bold text-[#8c909c] tracking-wider block mb-2">
              App Capabilities
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#606470] dark:text-[#9aa0ae]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Full screen UI (no URL bar)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Instant home screen launch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Offline caching & storage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Two-way live webapp sync</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#e5e2da] dark:border-[#292b34] bg-[#f4f2ec] dark:bg-[#22242b] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-[#1f2126] text-[#fdfcf9] dark:bg-[#eceef2] dark:text-[#121317] rounded-xl hover:bg-[#343842] dark:hover:bg-[#d8dbe2] transition-colors min-h-[40px]"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
