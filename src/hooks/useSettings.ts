import { useState, useEffect, useCallback } from 'react';
import { getById, update, SettingsData, UserData, seedDefaults } from '../db/database';

const applyTheme = async (theme: string) => {
  document.documentElement.setAttribute('data-theme', theme);
  const module = await import('../theme.json');
  const themeConfig = module.default;
  const activeThemeConfig = themeConfig[theme as keyof typeof themeConfig] || themeConfig.dark;
  Object.entries(activeThemeConfig).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value as string);
  });
};

export function useSettings() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      await seedDefaults(); // Ensure all stores have initial records (ID: 1)
      const dbSettings = await getById<SettingsData>('settings', 1);
      if (dbSettings) {
        setSettings(dbSettings);
        applyTheme(dbSettings.theme);
      }

      const dbUser = await getById<UserData>('user', 1);
      if (dbUser) setUser(dbUser);
    } catch (err) {
      console.error('Failed to fetch settings/user', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateSettings = async (newSettings: Partial<SettingsData>) => {
    const current = settings || { id: 1, oilInterval: 3000, language: 'es', theme: 'dark' as const, distanceUnits: 'km' };
    const updated = { ...current, ...newSettings };
    await update('settings', updated);
    setSettings(updated);
    
    if (newSettings.theme) {
      applyTheme(newSettings.theme);
    }
  };

  const updateUser = async (newUserData: Partial<UserData>) => {
    const current = user || { id: 1, name: 'RIDER_01', email: '' };
    const updated = { ...current, ...newUserData };
    await update('user', updated);
    setUser(updated);
  };

  return { settings, user, isLoading, updateSettings, updateUser, refresh: fetchData };
}
