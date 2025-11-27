
import { useState, useEffect } from 'react';
import { logEvent } from '../features/quiz/services/analyticsService';

export type InstallStatus = 'idle' | 'installing' | 'success' | 'failed';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installStatus, setInstallStatus] = useState<InstallStatus>('idle');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const triggerInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    setInstallStatus('installing');
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      logEvent('app_installed', { platform: navigator.userAgent });
      setDeferredPrompt(null);
      setIsInstalled(true);
      setInstallStatus('success');
      return true;
    } else {
      setInstallStatus('failed');
      return false;
    }
  };

  return { isInstalled, canInstall: !!deferredPrompt, triggerInstall, installStatus };
}
