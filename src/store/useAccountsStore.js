"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAccountsStore = create(
  persist(
    (set, get) => ({
      accounts: [],
      lastFetched: 0,
      accLoading: false,

      /**
       * جلب الحسابات من الخادم — يُظهر البيانات المخزّنة فوراً ويُحدّثها في الخلفية.
       */
      loadAccounts: async () => {
        const { accounts } = get();
        // Don't show loading indicator if there is cached data (silent background update)
        if (accounts.length === 0) set({ accLoading: true });
        try {
          const res = await fetch("/api/accounts");
          const d = await res.json();
          if (d.success) set({ accounts: d.accounts, lastFetched: Date.now() });
        } catch {
          /* تجاهل أخطاء الشبكة — البيانات القديمة تبقى متاحة */
        } finally {
          set({ accLoading: false });
        }
      },

      /** تحديث محلي بعد إضافة / تعديل / حذف بدون إعادة جلب */
      setAccounts: (accounts) => set({ accounts, lastFetched: Date.now() }),
    }),
    {
      name: "accounts-storage",
      // Don't persist accLoading (temporary state) in storage
      partialize: (state) => ({
        accounts: state.accounts,
        lastFetched: state.lastFetched,
      }),
    },
  ),
);
