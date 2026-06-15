'use client';

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCalculatorStore = create(
  persist(
    (set) => ({
      result: null,

      setResult: (result) => set({ result }),
      clearResult: () => set({ result: null }),
    }),
    {
      name: "calculator-storage",
    }
  )
);
