"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSearchStore = create(
  persist(
    (set) => ({
      search: "",
      isTransactionsOnlyActive: false,
      isNegativeOnlyActive: false,

      setSearch: (search) => set({ search }),
      setIsTransactionsOnlyActive: (isTransactionsOnlyActive) => set({ isTransactionsOnlyActive }),
      setIsNegativeOnlyActive: (isNegativeOnlyActive) => set({ isNegativeOnlyActive }),
    }),
    {
      name: "search-storage",
    }
  )
);
