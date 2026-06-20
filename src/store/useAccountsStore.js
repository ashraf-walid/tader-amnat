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
        // لا تُظهر مؤشر التحميل إذا كانت هناك بيانات مخزّنة (تحديث صامت في الخلفية)
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
      // لا تُبقِ accLoading (حالة مؤقتة) في التخزين
      partialize: (state) => ({
        accounts: state.accounts,
        lastFetched: state.lastFetched,
      }),
    },
  ),
);
