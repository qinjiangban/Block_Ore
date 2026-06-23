import { create } from "zustand";
import { persist } from "zustand/middleware";

type SettingsStore = {
  musicEnabled: boolean;
  soundEnabled: boolean;
  setMusic: (value: boolean) => void;
  setSound: (value: boolean) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      musicEnabled: true,
      soundEnabled: true,
      setMusic: (value) => set({ musicEnabled: value }),
      setSound: (value) => set({ soundEnabled: value }),
    }),
    {
      name: "block-ore-settings",
    },
  ),
);
