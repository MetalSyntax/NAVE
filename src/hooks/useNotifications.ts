import { useState, useEffect } from 'react';

export function useNotifications() {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : 'denied'
  );

  useEffect(() => {
    if (isSupported) setPermission(Notification.permission);
  }, [isSupported]);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch {
      return false;
    }
  };

  const sendNotification = (title: string, body: string, tag?: string) => {
    if (!isSupported || Notification.permission !== 'granted') return;
    try {
      new Notification(title, {
        body,
        icon: '/manifest.json',
        tag: tag || 'nave',
        silent: false,
      });
    } catch { /* ignore */ }
  };

  const checkAndNotifyServiceDue = (
    kmActual: number,
    kmProximo: number,
    vehicleName: string
  ) => {
    if (kmActual >= kmProximo * 0.95) {
      sendNotification(
        '⚠️ Mantenimiento Próximo',
        `${vehicleName} necesita revisión. Km actual: ${kmActual.toLocaleString()}`,
        'service-due'
      );
    }
  };

  return { permission, isSupported, requestPermission, sendNotification, checkAndNotifyServiceDue };
}
