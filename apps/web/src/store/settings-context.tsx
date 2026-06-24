"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type PropsWithChildren,
} from "react";

type SettingsContextType = {
  musicEnabled: boolean;
  soundEnabled: boolean;
  setMusic: (value: boolean) => void;
  setSound: (value: boolean) => void;
};

const STORAGE_KEY = "block-ore-settings";

const SettingsContext = createContext<SettingsContextType | null>(null);

export function useSettingsContext(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettingsContext must be used within SettingsProvider");
  return ctx;
}

function loadSettings(): { musicEnabled: boolean; soundEnabled: boolean } {
  if (typeof window === "undefined") {
    return { musicEnabled: true, soundEnabled: true };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        musicEnabled: parsed.musicEnabled ?? true,
        soundEnabled: parsed.soundEnabled ?? true,
      };
    }
  } catch {
    // ignore
  }
  return { musicEnabled: true, soundEnabled: true };
}

function saveSettings(musicEnabled: boolean, soundEnabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ musicEnabled, soundEnabled }));
  } catch {
    // ignore
  }
}

export function SettingsProvider({ children }: PropsWithChildren) {
  const [musicEnabled, setMusicState] = useState(true);
  const [soundEnabled, setSoundState] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount (client only)
  useEffect(() => {
    const saved = loadSettings();
    setMusicState(saved.musicEnabled);
    setSoundState(saved.soundEnabled);
    setLoaded(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (loaded) {
      saveSettings(musicEnabled, soundEnabled);
    }
  }, [musicEnabled, soundEnabled, loaded]);

  const setMusic = useCallback((value: boolean) => {
    setMusicState(value);
  }, []);

  const setSound = useCallback((value: boolean) => {
    setSoundState(value);
  }, []);

  const ctx = useMemo(
    () => ({ musicEnabled, soundEnabled, setMusic, setSound }),
    [musicEnabled, soundEnabled, setMusic, setSound],
  );

  return (
    <SettingsContext.Provider value={ctx}>{children}</SettingsContext.Provider>
  );
}
