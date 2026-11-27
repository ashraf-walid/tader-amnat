"use client";

import React, { useState } from "react";
import { Ban, Undo2, Plus, ShieldOff } from "lucide-react";

/**
 * Owner-only panel to manage accounts excluded from database upload.
 * Excluded accounts are still parsed and shown locally; they are only
 * kept out of MongoDB. Removing an entry re-includes the account from
 * the next upload onward.
 */
export default function ExcludedAccountsPanel({
  excludedAccounts = [],
  allAccounts = [],
  onExclude,
  onInclude,
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [deleteExisting, setDeleteExisting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // When the owner picks an account by name, fill in its code automatically
  const handleNameChange = (value) => {
    setName(value);
    const match = allAccounts.find((acc) => acc.account === value);
    if (match) setCode(match.accountCode || "");
  };

  const handleAdd = async () => {
    if (!code.trim() && !name.trim()) {
      setError("اكتب كود الحساب أو اختر اسمه من القائمة");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onExclude(
        { accountCode: code.trim(), account: name.trim() },
        { deleteExisting }
      );
      setName("");
      setCode("");
      setDeleteExisting(false);
    } catch (err) {
      setError(err.message || "حدث خطأ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 bg-slate-900 rounded-3xl shadow-sm border border-amber-900/40 overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b border-slate-800 flex items-center gap-2">
        <ShieldOff size={18} className="text-amber-400" />
        <h3 className="font-bold text-slate-100">
          الحسابات المستثناة من الرفع إلى قاعدة البيانات
        </h3>
        <span className="text-[11px] px-2 py-0.5 rounded bg-amber-900/30 text-amber-300">
          للمالك فقط
        </span>
      </div>

      <div className="px-4 md:px-6 py-4 space-y-4">
        {/* Add form: by code or by picking a name */}
        <div className="flex flex-col md:flex-row gap-2 md:items-end">
          <label className="flex-1 space-y-1">
            <span className="text-xs text-slate-400">اسم الحساب (بحث)</span>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              list="excluded-account-options"
              placeholder="اكتب اسم العميل للبحث…"
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            <datalist id="excluded-account-options">
              {allAccounts.map((acc) => (
                <option
                  key={acc.accountCode || acc.account}
                  value={acc.account}
                >
                  {acc.accountCode}
                </option>
              ))}
            </datalist>
          </label>
          <label className="md:w-48 space-y-1">
            <span className="text-xs text-slate-400">كود الحساب</span>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="مثال: 17142100"
              className="w-full px-3 py-2 text-sm font-mono bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </label>
          <button
            onClick={handleAdd}
            disabled={busy}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus size={14} /> استثناء
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={deleteExisting}
            onChange={(e) => setDeleteExisting(e.target.checked)}
            className="accent-amber-500"
          />
          حذف النسخة الحالية من قاعدة البيانات أيضًا (بدون الاختيار ده هتفضل لحد الرفعة الجاية، وبعدها هتتشال تلقائيًا لأن الرفع بيستبدل كل البيانات)
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {/* Current exclusion list */}
        {excludedAccounts.length === 0 ? (
          <p className="text-sm text-slate-500">
            لا توجد حسابات مستثناة حاليًا — كل الحسابات بتترفع عادي.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {excludedAccounts.map((entry) => (
              <li
                key={entry.code || entry.name}
                className="py-2.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Ban size={14} className="text-amber-400 shrink-0" />
                  <span className="font-semibold text-slate-200 truncate">
                    {entry.name || "—"}
                  </span>
                  {entry.code && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
                      {entry.code}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onInclude(entry)}
                  className="shrink-0 px-3 py-1.5 text-xs font-bold text-emerald-300 bg-emerald-900/20 hover:bg-emerald-900/40 rounded-lg flex items-center gap-1 transition-colors"
                  title="إدراج الحساب مرة أخرى في الرفعات القادمة"
                >
                  <Undo2 size={12} /> إدراج مرة أخرى
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
