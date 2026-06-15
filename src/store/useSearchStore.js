"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSearchStore = create(
  persist(
    (set) => ({
      search: "",
      isTransactionsOnlyActive: false,

      setSearch: (search) => set({ search }),
      setIsTransactionsOnlyActive: (isTransactionsOnlyActive) => set({ isTransactionsOnlyActive }),
    }),
    {
      name: "search-storage",
    }
  )
);
