import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Automatically register and update service worker for offline support
registerSW({
  immediate: true,
  onRegistered(r) {
    console.log('ChronoPlan Service Worker registered:', r?.scope);
  },
  onRegisterError(error) {
    console.warn('ChronoPlan Service Worker registration notice:', error);
  },
});

createRoot(document.getElementById('root')!).render(<App />);
