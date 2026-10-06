import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker with aggressive auto-update for webapp and installed PWA
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('ChronoPlan: New version available, updating assets...');
    updateSW(true);
  },
  onRegistered(r) {
    console.log('ChronoPlan Service Worker registered:', r?.scope);
    if (r) {
      // Expose manual trigger for updates
      (window as unknown as { __chronoUpdateSW?: () => Promise<void> }).__chronoUpdateSW = async () => {
        try {
          await r.update();
        } catch (e) {
          console.warn('Update check failed:', e);
        }
      };

      // Periodic update check every 30 seconds
      setInterval(() => {
        r.update().catch(() => {});
      }, 30 * 1000);

      // Check for updates whenever mobile app or tab is foregrounded
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          r.update().catch(() => {});
        }
      });

      window.addEventListener('focus', () => {
        r.update().catch(() => {});
      });
    }
  },
  onRegisterError(error) {
    console.warn('ChronoPlan Service Worker registration notice:', error);
  },
});

// Automatically reload once new service worker activates and claims the client
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  let isReloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!isReloading) {
      isReloading = true;
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
