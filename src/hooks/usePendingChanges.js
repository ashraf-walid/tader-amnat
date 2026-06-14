"use client";

import { useState } from "react";

export function usePendingChanges() {
  const [pendingChanges, setPendingChanges] = useState({});

  const updateManualValue = (accountCode, field, amount) => {
    setPendingChanges((prev) => ({
      ...prev,
      [accountCode]: {
        ...(prev[accountCode] || {}),
        [field]: parseFloat(amount) || 0,
      },
    }));
  };

  const clearPendingChanges = (accountCode) => {
    setPendingChanges((prev) => {
      const next = { ...prev };
      delete next[accountCode];
      return next;
    });
  };

  return {
    pendingChanges,
    updateManualValue,
    clearPendingChanges,
  };
}
