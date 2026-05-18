import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useNotification } from '../../stores/useNotificationStore';

export const PWAUpdateManager: React.FC = () => {
  const { showToast } = useNotification();

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (!r) return;
    },
    onNeedRefresh() {
       // Notify user silently that an update is pending
       showToast({
           title: "Update Available",
           message: "A new version of the app is available. Refresh the page to update.",
           variant: "info",
           duration: 10000,
       });
    }
  });

  return null; // Silent Background Component
};
