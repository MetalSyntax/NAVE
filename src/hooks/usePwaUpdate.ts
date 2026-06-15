import { useState, useEffect, useRef } from 'react';

export function usePwaUpdate() {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [justChecked, setJustChecked] = useState(false);
  const regRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then(reg => {
      regRef.current = reg;

      if (reg.waiting) setNeedsUpdate(true);

      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            setNeedsUpdate(true);
          }
        });
      });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  const acceptUpdate = () => {
    const reg = regRef.current;
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      setNeedsUpdate(false);
    }
  };

  const dismissUpdate = () => setNeedsUpdate(false);

  const checkForUpdate = async () => {
    const reg = regRef.current;
    if (!reg || isChecking) return;
    setIsChecking(true);
    setJustChecked(false);
    try {
      await reg.update();
    } finally {
      setTimeout(() => {
        setIsChecking(false);
        if (!needsUpdate) setJustChecked(true);
        setTimeout(() => setJustChecked(false), 3000);
      }, 1200);
    }
  };

  return { needsUpdate, isChecking, justChecked, acceptUpdate, dismissUpdate, checkForUpdate };
}
