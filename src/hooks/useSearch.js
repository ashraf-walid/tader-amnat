"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  normalizeArabicText,
  convertEnglishToArabic,
  convertEnglishToArabicLib,
  isEnglishTyping,
} from "@/lib/search-utils";
import { useSearchStore } from "@/store/useSearchStore";

const DEBOUNCE_MS = 200;

export function useSearch(allAccounts, setData) {
  const {
    search,
    setSearch,
    isTransactionsOnlyActive,
    setIsTransactionsOnlyActive,
  } = useSearchStore();
  const searchInputRef = useRef(null);
  const [isEnglishKeyboard, setIsEnglishKeyboard] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Debounce the search input for better performance
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Detect English keyboard typing
  useEffect(() => {
    setIsEnglishKeyboard(isEnglishTyping(search));
  }, [search]);

  // Build all search query variants once
  const queryVariants = useMemo(() => {
    if (!debouncedSearch) return [];
    const variants = new Set();
    // Original query normalized
    variants.add(normalizeArabicText(debouncedSearch));
    // If user might be typing in English keyboard, convert to Arabic
    if (isEnglishTyping(debouncedSearch)) {
      const winConverted = normalizeArabicText(convertEnglishToArabic(debouncedSearch));
      const libConverted = normalizeArabicText(convertEnglishToArabicLib(debouncedSearch));
      if (winConverted) variants.add(winConverted);
      if (libConverted) variants.add(libConverted);
    }
    return [...variants];
  }, [debouncedSearch]);

  // 🔍 Search and filter locally when changing the search or filter
  useEffect(() => {
    const performLocalSearch = () => {
      let results = [...allAccounts];

      // Apply search filter (in-memory)
      if (queryVariants.length > 0) {
        results = results.filter((account) => {
          const normalizedAccountName = normalizeArabicText(account.account || '');
          const normalizedAccountCode = normalizeArabicText(account.accountCode || '');
          return queryVariants.some(
            (q) =>
              normalizedAccountName.includes(q) ||
              normalizedAccountCode.includes(q)
          );
        });
      }

      // Apply transactions only filter
      if (isTransactionsOnlyActive) {
        results = results.filter(
          (acc) =>
            acc.transactions &&
            Array.isArray(acc.transactions) &&
            acc.transactions.length > 0
        );
      }

      setData(results);
    };

    performLocalSearch();
  }, [queryVariants, isTransactionsOnlyActive, allAccounts, setData]);

  // Focus on search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const clearSearch = useCallback(() => {
    setSearch("");
    searchInputRef.current?.focus();
  }, [setSearch]);

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
