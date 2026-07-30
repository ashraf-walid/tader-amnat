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
  clearAllData,
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

  // جلب البيانات وحفظها في IndexedDB
  const fetchDataFromMongoDB = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/data`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const result = await res.json();
      if (result && Array.isArray(result.data)) {
        // حفظ البيانات في IndexedDB
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

  // التحقق من تطابق dateRange في MongoDB مع IndexedDB المحلي
  const checkDateRangeSync = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/dateRange');
      const result = await response.json();

      if (!result.success) {
        console.warn("Failed to fetch dateRange from MongoDB");
        return true; // افتراض المزامنة في حالة عدم القدرة على التحقق
      }

      const mongoDateRange = result.dateRange || "";
      const localDateRange = await getDateRangeDB();

      console.log("DateRange comparison:", {
        mongo: mongoDateRange,
        local: localDateRange,
        isMatch: mongoDateRange === localDateRange
      });

      return mongoDateRange === localDateRange;
    } catch (error) {
      console.error("Error checking dateRange sync:", error);
      return true; // افتراض المزامنة في حالة حدوث خطأ
    }
  }, []);

  // تحميل البيانات من IndexedDB أولاً أو الرجوع إلى MongoDB
  const loadDataSmart = useCallback(async () => {
    setLoading(true);

    try {
      // فحص دعم IndexedDB
      if (!isIndexedDBSupported()) {
        console.warn("⚠️ IndexedDB not supported, using MongoDB directly");
        await fetchDataFromMongoDB();
        return;
      }

      // فحص ما إذا كانت IndexedDB فارغة
      const isEmpty = await isDBEmpty();

      if (isEmpty) {
        // IndexedDB فارغة → تحميل من MongoDB
        console.log("📡 IndexedDB is empty, loading from MongoDB...");
        await fetchDataFromMongoDB();
      } else {
        // IndexedDB تحتوي على بيانات → فحص مزامنة dateRange
        const isDateRangeSync = await checkDateRangeSync();

        if (!isDateRangeSync) {
          // DateRange غير متطابق → مسح البيانات المحلية وإعادة التحميل من MongoDB
          console.log("🔄 DateRange mismatch detected, clearing local data and reloading...");
          await clearAllData();
          await fetchDataFromMongoDB();
        } else {
          // DateRange متطابق → تحميل من IndexedDB
          console.log("⚡ Loading from IndexedDB (dateRange synced)...");
          const localData = await getAllAccounts();
          const localDateRange = await getDateRangeDB();

          setAllAccounts(localData);
          setData(localData);
          setDateRange(localDateRange);
          setLastUpdated(new Date().toLocaleTimeString());
          setErrorStatus(null);
        }
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setErrorStatus(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchDataFromMongoDB, checkDateRangeSync]);

  // معالجة الملف مع الدمج (HTML + الأرصدة الأساسية)
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
      try {
        await clearAllData(); // حذف البيانات القديمة
        await saveAllAccounts(preparedResults);
        if (extractedDateRange) await setDateRangeDB(extractedDateRange);
      } catch (error) {
        console.error('Failed to save data to IndexedDB:', error);
        // في حالة الفشل، محاولة استعادة البيانات من MongoDB
        await fetchDataFromMongoDB();
        throw error;
      }

      // ✅ 2. تحديث الواجهة فوراً
      setAllAccounts(preparedResults); // تحديث الحالة الرئيسية
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
          console.log("✅ تمت المزامنة مع MongoDB بنجاح:", result);
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

  // معالجة الملف (HTML أو JSON للنسخ الاحتياطية)
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
          try {
            await clearAllData(); // حذف البيانات القديمة
            await saveAllAccounts(dataToRestore);
            if (restoredDateRange) await setDateRangeDB(restoredDateRange);
          } catch (error) {
            console.error('Failed to save data to IndexedDB:', error);
            // في حالة الفشل، محاولة استعادة البيانات من MongoDB
            await fetchDataFromMongoDB();
            throw error;
          }

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
              console.log("✅ تمت المزامنة مع MongoDB بنجاح");
              setLastSyncTimestamp(Date.now());
            })
            .catch((err) => console.error("⚠️ MongoDB sync failed:", err));

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
      try {
        await clearAllData(); // حذف البيانات القديمة
        await saveAllAccounts(preparedResults);
        if (extractedDateRange) await setDateRangeDB(extractedDateRange);
      } catch (error) {
        console.error('Failed to save data to IndexedDB:', error);
        // في حالة الفشل، محاولة استعادة البيانات من MongoDB
        await fetchDataFromMongoDB();
        throw error;
      }

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
          console.log("✅ تمت المزامنة مع MongoDB بنجاح");
          setLastSyncTimestamp(Date.now());
        })
        .catch((err) => console.error("⚠️ MongoDB sync failed:", err));

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

  // تنفيذ تغييرات المعاملات
  const commitTransactionChanges = async (
    accountCode,
    transactions,
    pendingChanges,
  ) => {
    // العثور على الحساب المراد تحديثه
    const accountToUpdate = data.find(
      (item) => item.accountCode === accountCode,
    );
    if (!accountToUpdate) return;

    // بناء مصفوفة المعاملات الجديدة
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
          console.log(`✅ تمت مزامنة الحساب ${accountCode} مع MongoDB بنجاح`);
          await setLastSyncTimestamp(Date.now());
        } else {
          console.error(`⚠️ فشلت مزامنة الحساب ${accountCode}:`, result.error);
        }
      })
      .catch((err) => {
        console.error("⚠️ MongoDB sync failed:", err);
      });
  };

  // تهيئة البيانات
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
