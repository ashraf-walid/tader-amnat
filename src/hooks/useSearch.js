"use client";

import { useState, useEffect, useRef } from "react";
import { normalizeArabicText } from "@/lib/search-utils";

export function useSearch(allAccounts, setData) {
  const [search, setSearch] = useState("");
  const [isEnglishKeyboard, setIsEnglishKeyboard] = useState(false);
  const [isTransactionsOnlyActive, setIsTransactionsOnlyActive] = useState(false);
  const searchInputRef = useRef(null);

  // 🔍 Search and filter locally when changing the search or filter
  useEffect(() => {
    const performLocalSearch = () => {
      // Start with all accounts from our master state
      let results = [...allAccounts];

      // Apply search filter (in-memory)
      if (search) {
        const normalizedQuery = normalizeArabicText(search);
        results = results.filter(account => {
          const normalizedAccountName = normalizeArabicText(account.account || '');
          const normalizedAccountCode = normalizeArabicText(account.accountCode || '');
          return normalizedAccountName.includes(normalizedQuery) || normalizedAccountCode.includes(normalizedQuery);
        });
      }

      // Apply transactions only filter
      if (isTransactionsOnlyActive) {
        results = results.filter(
          (acc) =>
            acc.transactions &&
            Array.isArray(acc.transactions) &&
            acc.transactions.length > 0,
        );
      }

      setData(results);
    };

    performLocalSearch();
  }, [search, isTransactionsOnlyActive, allAccounts, setData]);

  // Focus on search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const clearSearch = () => {
    setSearch("");
    searchInputRef.current?.focus();
  };

  return {
    search,
    setSearch,
    isEnglishKeyboard,
    setIsEnglishKeyboard,
    isTransactionsOnlyActive,
    setIsTransactionsOnlyActive,
    searchInputRef,
    clearSearch,
  };
}
