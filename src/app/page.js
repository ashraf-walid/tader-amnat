"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SearchBar from "@/components/dashboard/SearchBar";
import AccountsTable from "@/components/dashboard/AccountsTable";
import AccountCard from "@/components/dashboard/AccountCard";
import TransactionModal from "@/components/dashboard/TransactionModal";
import FileUploadZone from "@/components/dashboard/FileUploadZone";
import { useAccountData } from "@/hooks/useAccountData";
import { useSearch } from "@/hooks/useSearch";
import { usePendingChanges } from "@/hooks/usePendingChanges";

export default function AccountsDashboard() {
  // Account data hook
  const {
    allAccounts,
    data,
    setData,
    dateRange,
    loading,
    lastUpdated,
    errorStatus,
    isDragging,
    fetchDataFromMongoDB,
    handleFileUpload,
    handleFileUploadWithMerge,
    onDragOver,
    onDragLeave,
    onDrop,
    downloadData,
    commitTransactionChanges,
  } = useAccountData();

  // Search hook
  const {
    search,
    setSearch,
    isEnglishKeyboard,
    setIsEnglishKeyboard,
    isTransactionsOnlyActive,
    setIsTransactionsOnlyActive,
    searchInputRef,
  } = useSearch(allAccounts, setData);

  // Pending changes hook
  const {
    pendingChanges,
    updateManualValue,
    clearPendingChanges,
  } = usePendingChanges();

  // Modal state
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Commit changes
  const commitChanges = async (accountCode) => {
    const changes = pendingChanges[accountCode];
    if (!changes) return;
    
    await commitTransactionChanges(accountCode, data, changes);
    clearPendingChanges(accountCode);
  };

  // Filtered data
  const filteredData = data;

  return (
    <div
      className="min-h-screen bg-slate-950"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
        {/* Dashboard Header */}
        <DashboardHeader
          dateRange={dateRange}
          errorStatus={errorStatus}
          lastUpdated={lastUpdated}
          loading={loading}
          fetchDataFromMongoDB={fetchDataFromMongoDB}
          downloadData={downloadData}
          handleFileUpload={handleFileUpload}
          handleFileUploadWithMerge={handleFileUploadWithMerge}
          data={data}
          search={search}
        />

        {/* Loading or Upload or Analysis */}
        {loading &&
          allAccounts.length === 0 &&
          !search &&
          !isTransactionsOnlyActive ? (
          <div className="flex flex-col items-center justify-center h-75 md:h-100 mx-4 md:mx-0">
            <div className="w-12 h-12 rounded-full border-4 border-blue-900/40 border-t-blue-600 animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-500">
              جاري تحميل البيانات...
            </p>
          </div>
        ) : allAccounts.length === 0 &&
          !search &&
          !loading &&
          !isTransactionsOnlyActive ? (
          /* Empty State - File Upload Zone */
          <FileUploadZone
            isDragging={isDragging}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            handleFileUpload={handleFileUpload}
          />
        ) : (
          /* Analysis View */
          <div className="space-y-6 animate-in">
            <div className="bg-slate-900 rounded-3xl shadow-sm border border-slate-800 overflow-hidden">
              {/* Search Bar */}
              <SearchBar
                search={search}
                setSearch={setSearch}
                searchInputRef={searchInputRef}
                isEnglishKeyboard={isEnglishKeyboard}
                setIsEnglishKeyboard={setIsEnglishKeyboard}
                isTransactionsOnlyActive={isTransactionsOnlyActive}
                setIsTransactionsOnlyActive={setIsTransactionsOnlyActive}
                filteredData={filteredData}
              />

              {/* Desktop Table View */}
              <AccountsTable
                filteredData={filteredData}
                pendingChanges={pendingChanges}
                updateManualValue={updateManualValue}
                commitChanges={commitChanges}
                setSelectedAccount={setSelectedAccount}
                setIsHistoryOpen={setIsHistoryOpen}
              />

              {/* Mobile Card View */}
              <AccountCard
                filteredData={filteredData}
                pendingChanges={pendingChanges}
                updateManualValue={updateManualValue}
                commitChanges={commitChanges}
                setSelectedAccount={setSelectedAccount}
                setIsHistoryOpen={setIsHistoryOpen}
              />

              {/* No Search Results */}
              {filteredData.length === 0 && search && (
                <div className="text-center py-12 px-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
                    <Search size={24} className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-1">
                    لا توجد نتائج مطابقة
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    لم يتم العثور على حسابات تطابق &quot;{search}&quot;
                  </p>
                  <button
                    onClick={() => setSearch("")}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-400 bg-blue-900/20 rounded-xl hover:bg-blue-900/35 transition-colors"
                  >
                    <Search size={14} /> مسح البحث
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Transaction History Modal */}
      <TransactionModal
        isOpen={isHistoryOpen}
        selectedAccount={selectedAccount}
        onClose={() => setIsHistoryOpen(false)}
      />

      <footer className="mt-12 text-center text-slate-400 text-sm">
        نظام أمانات لعرض حسابات العملاء &copy; 2026
      </footer>
    </div>
  );
}
