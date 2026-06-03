import { useState, useEffect, useCallback } from 'react';
import api, { push } from '@/lib/api';
import { handleError } from '@/lib/errorHandler';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const VAPID_PUBLIC_KEY = 'BAIN_yNFBud4AQ1M9BUCKwuQnNxVIwnznWXcl7JmUKF84JR0TWRBWY0LJxl-bGW8arLqX1ysiByMZaEk6Ti5m3E';

const resolveVapidPublicKey = async (): Promise<string> => {
  const candidates = ['/v1/push/vapid-key', '/v1/vendor/push/vapid-key'];

  for (const url of candidates) {
    try {
      const response = await api.get(url);
      const key = response?.data?.data?.publicKey ?? response?.data?.publicKey;
      if (typeof key === 'string' && key.length > 0) {
        return key;
      }
    } catch {
      // Try next candidate endpoint.
    }
  }

  return VAPID_PUBLIC_KEY;
};

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        setSubscription(existingSub.toJSON() as PushSubscription);
      }
    } catch (error) {
      handleError(error, 'push');
    }
  };

  const subscribe = useCallback(async () => {
    if (!isSupported) return false;

    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      
      let sub = await reg.pushManager.getSubscription();
      
      if (!sub) {
        const vapidPublicKey = await resolveVapidPublicKey();
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      const subscriptionData = sub.toJSON() as PushSubscription;
      setSubscription(subscriptionData);

      await push.subscribe(subscriptionData);
      
      return true;
    } catch (error) {
      handleError(error, 'push');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      
      if (sub) {
        await sub.unsubscribe();
      }

      await push.unsubscribe(subscription.endpoint);
      setSubscription(null);
      
      return true;
    } catch (error) {
      handleError(error, 'push');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }, []);

  return {
    isSupported,
    subscription,
    isLoading,
    subscribe,
    unsubscribe,
    requestPermission,
  };
};

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

export default usePushNotifications;
