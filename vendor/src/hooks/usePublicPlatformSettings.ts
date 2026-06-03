import { useEffect, useState } from 'react';
import {
  DEFAULT_PUBLIC_SETTINGS,
  getPublicPlatformSettings,
  type PublicPlatformSettings,
} from '@/lib/publicSettings';

export function usePublicPlatformSettings() {
  const [settings, setSettings] = useState<PublicPlatformSettings>(DEFAULT_PUBLIC_SETTINGS);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await getPublicPlatformSettings();
      if (!cancelled) {
        setSettings(result);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return settings;
}
