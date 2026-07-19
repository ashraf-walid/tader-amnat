"use client";

import { useState, useCallback, useEffect } from "react";
import {
  isDBEmpty,
  getAllAccounts,
  saveAllAccounts,
  updateTransactions,
  setLastSyncTimestamp,
  setDateRange as setDateRangeDB,
  getDateRange as getDateRangeDB,
  isIndexedDBSupported,
} from "@/lib/localDB";
import { parseAccountingHTML } from "@/lib/parser";
import { mergeHTMLWithBaseBalances, checkBaseBalancesExists } from "@/lib/mergeBalances";

export function useAccountData() {
  const [allAccounts, setAllAccounts] = useState([]);
  const [data, setData] = useState([]);
  const [dateRange, setDateRange] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch data and save to IndexedDB
  const fetchDataFromMongoDB = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/data`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const result = await res.json();
      if (result && Array.isArray(result.data)) {
        // Save data to IndexedDB
        await saveAllAccounts(result.data);
        if (result.dateRange) await setDateRangeDB(result.dateRange);
        await setLastSyncTimestamp(Date.now());

        setAllAccounts(result.data); // تحديث الحالة الرئيسية
        setData(result.data);
        if (result.dateRange) setDateRange(result.dateRange);
        setLastUpdated(new Date(result.timestamp).toLocaleTimeString());
        setErrorStatus(null);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setErrorStatus(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data from IndexedDB First or fallback to MongoDB
  const loadDataSmart = useCallback(async () => {
    setLoading(true);

    try {
      // Check if IndexedDB is supported
      if (!isIndexedDBSupported()) {
        console.warn("⚠️ IndexedDB not supported, using MongoDB directly");
        await fetchDataFromMongoDB();
        return;
      }

      // Check if IndexedDB is empty
      const isEmpty = await isDBEmpty();

      if (isEmpty) {
        // IndexedDB is empty → Load from MongoDB
        console.log("📡 IndexedDB is empty, loading from from MongoDB...");
        await fetchDataFromMongoDB();
      } else {
        // IndexedDB is not empty → Load from IndexedDB
        console.log("⚡ Loading from IndexedDB...");
        const localData = await getAllAccounts();
        const localDateRange = await getDateRangeDB();

        setAllAccounts(localData); // تحديث الحالة الرئيسية
        setData(localData);
        setDateRange(localDateRange);
        setLastUpdated(new Date().toLocaleTimeString());
        setErrorStatus(null);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setErrorStatus(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchDataFromMongoDB]);

  // Process file with merge (HTML + base balances)
  const processFileWithMerge = async (file) => {
    setLoading(true);
    try {
      const fileName = file.name.toLowerCase();

      // التحقق من أن الملف HTML فقط
      if (!fileName.endsWith(".html") && !fileName.endsWith(".htm")) {
        throw new Error("هذه الوظيفة تدعم ملفات HTML فقط");
      }

      // التحقق من وجود ملف الأرصدة الأساسية
      const baseExists = await checkBaseBalancesExists();
      if (!baseExists) {
        throw new Error("لم يتم العثور على ملف الأرصدة الأساسية (base-balances-30-06.json)");
      }

      // دمج الملف الجديد مع الأرصدة الأساسية
      const { data: results, dateRange: extractedDateRange, mergeInfo } =
        await mergeHTMLWithBaseBalances(file);

      // تهيئة الحسابات المستخرجة
      const preparedResults = results.map((newRecord) => ({
        ...newRecord,
        transactions: [],
      }));

      // ✅ 1. حفظ في IndexedDB أولاً (فوري)
      await saveAllAccounts(preparedResults);
      if (extractedDateRange) await setDateRangeDB(extractedDateRange);

      // ✅ 2. تحديث الواجهة فوراً
      setAllAccounts(preparedResults);
      setData(preparedResults);
      if (extractedDateRange) setDateRange(extractedDateRange);

      // ✅ 3. رفع إلى MongoDB في الخلفية (بدون انتظار)
      // استخدام المسار الخاص بالدمج لحذف المعاملات القديمة
      const payload = {
        data: preparedResults,
        dateRange: extractedDateRange,
        clearTransactions: true, // ⚠️ علامة لحذف المعاملات القديمة
      };
      
      console.log("🔍 Sending merge request to API:", {
        accountsCount: preparedResults.length,
        clearTransactions: payload.clearTransactions,
        firstAccountHasTransactions: preparedResults[0]?.transactions?.length || 0
      });
      
      fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(async (response) => {
          const result = await response.json();
          console.log("✅ تمت المزامنة مع MongoDB:", result);
          await setLastSyncTimestamp(Date.now());
        })
        .catch((err) => console.error("⚠️ فشلت المزامنة مع MongoDB:", err));

      // عرض معلومات الدمج
      alert(
        `✅ تم الدمج بنجاح!\n\n` +
        `📊 إجمالي الحسابات: ${mergeInfo.totalAccounts}\n` +
        `🔄 حسابات مدمجة: ${mergeInfo.mergedAccounts}\n` +
        `📌 حسابات من 30/06 فقط: ${mergeInfo.onlyInBase}\n` +
        `🆕 حسابات جديدة: ${mergeInfo.onlyInNew}`
      );

      return { success: true, mergeInfo };
    } catch (err) {
      alert(
        err.message ||
          "حدث خطأ أثناء دمج الملفات. يرجى التأكد من صحة الملف.",
      );
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Process file (HTML or JSON backup)
  const processFile = async (file) => {
    setLoading(true);
    try {
      const fileName = file.name.toLowerCase();

      // إذا كان الملف نسخة احتياطية (JSON)
      if (fileName.endsWith(".json")) {
        const text = await file.text();
        let backup;
        try {
          backup = JSON.parse(text);
        } catch (e) {
          throw new Error(
            "فشل في قراءة محتوى الملف بصيغة JSON. قد يكون الملف تالفاً.",
          );
        }

        // التحقق من وجود مصفوفة البيانات (سواء كانت في backup.data أو كانت هي الملف نفسه)
        const dataToRestore = Array.isArray(backup) ? backup : backup.data;
        const restoredDateRange = backup.dateRange || "";

        if (Array.isArray(dataToRestore)) {
          // ✅ 1. حفظ في IndexedDB أولاً (فوري)
          await saveAllAccounts(dataToRestore);
          if (restoredDateRange) await setDateRangeDB(restoredDateRange);

          // ✅ 2. تحديث الواجهة فوراً
          setAllAccounts(dataToRestore); // تحديث الحالة الرئيسية
          setData(dataToRestore);
          if (restoredDateRange) setDateRange(restoredDateRange);

          // ✅ 3. رفع إلى MongoDB في الخلفية (بدون انتظار)
          fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: dataToRestore,
              dateRange: restoredDateRange,
            }),
          })
            .then(() => {
              console.log("✅ تمت المزامنة مع MongoDB");
              setLastSyncTimestamp(Date.now());
            })
            .catch((err) => console.error("⚠️ فشلت المزامنة مع MongoDB:", err));

          return { success: true };
        } else {
          throw new Error(
            "هيكل ملف النسخة الاحتياطية غير صحيح. لم يتم العثور على مصفوفة بيانات.",
          );
        }
      }

      // إذا كان ملف HTML من النظام المحاسبي
      const { data: results, dateRange: extractedDateRange } =
        await parseAccountingHTML(file);

      // تهيئة الحسابات المستخرجة بدون دمج المعاملات القديمة
      const preparedResults = results.map((newRecord) => ({
        ...newRecord,
        transactions: [],
      }));

      // ✅ 1. حفظ في IndexedDB أولاً (فوري)
      await saveAllAccounts(preparedResults);
      if (extractedDateRange) await setDateRangeDB(extractedDateRange);

      // ✅ 2. تحديث الواجهة فوراً
      setAllAccounts(preparedResults); // تحديث الحالة الرئيسية
      setData(preparedResults);
      if (extractedDateRange) setDateRange(extractedDateRange);

      // ✅ 3. رفع إلى MongoDB في الخلفية (بدون انتظار)
      fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: preparedResults,
          dateRange: extractedDateRange,
        }),
      })
        .then(() => {
          console.log("✅ تمت المزامنة مع MongoDB");
          setLastSyncTimestamp(Date.now());
        })
        .catch((err) => console.error("⚠️ فشلت المزامنة مع MongoDB:", err));

      return { success: true };
    } catch (err) {
      alert(
        err.message ||
          "حدث خطأ أثناء معالجة الملف. يرجى التأكد من أنه ملف صحيح.",
      );
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleFileUploadWithMerge = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFileWithMerge(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const downloadData = async () => {
    if (
      !window.confirm(
        "هل تريد حفظ نسخة احتياطية من البيانات الحالية على جهازك؟",
      )
    )
      return;
    try {
      setLoading(true);
      const res = await fetch("/api/data", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const result = await res.json();
      const backupData = {
        timestamp: new Date().toISOString(),
        data: result.data,
        dateRange: result.dateRange,
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `amanat_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading backup:", err);
      alert("حدث خطأ أثناء تحميل النسخة الاحتياطية");
    } finally {
      setLoading(false);
    }
  };

  // Commit transaction changes
  const commitTransactionChanges = async (
    accountCode,
    transactions,
    pendingChanges,
  ) => {
    // Find the account to update
    const accountToUpdate = data.find(
      (item) => item.accountCode === accountCode,
    );
    if (!accountToUpdate) return;

    // Build new transactions array
    const newTransactions = [...(accountToUpdate.transactions || [])];
    if (pendingChanges.manualAddition > 0) {
      newTransactions.push({
        type: "addition",
        amount: pendingChanges.manualAddition,
        date: new Date().toISOString(),
      });
    }
    if (pendingChanges.manualDeduction > 0) {
      newTransactions.push({
        type: "deduction",
        amount: pendingChanges.manualDeduction,
        date: new Date().toISOString(),
      });
    }

    // ✅ 1. حفظ في IndexedDB أولاً (فوري)
    await updateTransactions(accountCode, newTransactions);

    // ✅ 2. تحديث الواجهة فوراً
    setAllAccounts((prevAll) =>
      prevAll.map((item) =>
        item.accountCode === accountCode
          ? { ...item, transactions: newTransactions }
          : item,
      ),
    );
    setData((prevData) =>
      prevData.map((item) =>
        item.accountCode === accountCode
          ? { ...item, transactions: newTransactions }
          : item,
      ),
    );

    // ✅ 3. مزامنة مع MongoDB في الخلفية (بدون انتظار)
    fetch(`/api/data/${accountCode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactions: newTransactions }),
    })
      .then(async (response) => {
        const result = await response.json();
        if (result.success) {
          console.log(`✅ تمت مزامنة الحساب ${accountCode} مع MongoDB`);
          await setLastSyncTimestamp(Date.now());
        } else {
          console.error(`⚠️ فشلت مزامنة الحساب ${accountCode}:`, result.error);
        }
      })
      .catch((err) => {
        console.error("⚠️ فشلت المزامنة مع MongoDB:", err);
      });
  };

  // Initialize data
  useEffect(() => {
    loadDataSmart();
  }, [loadDataSmart]);

  return {
    allAccounts,
    data,
    setData,
    dateRange,
    loading,
    lastUpdated,
    errorStatus,
    isDragging,
    fetchDataFromMongoDB,
    processFile,
    processFileWithMerge,
    handleFileUpload,
    handleFileUploadWithMerge,
    onDragOver,
    onDragLeave,
    onDrop,
    downloadData,
    commitTransactionChanges,
  };
}
