# 🔄 سلوك زر "دمج مع أرصدة 30/06"

## 📋 ملخص التغييرات

تم تعديل سلوك زر الدمج ليقوم بحذف جميع المعاملات اليدوية القديمة (`transactions`) عند الدمج مع أرصدة 30/06.

---

## ✅ ماذا يحدث عند استخدام زر الدمج؟

### 1️⃣ **دمج الأرصدة المالية** (جمع رياضي)
```javascript
// مثال: إذا كان الحساب رقم 12345
// في ملف 30/06: debit = 1000
// في الملف الجديد: debit = 500
// النتيجة بعد الدمج: debit = 1500 ✅
```

| البيان | قبل الدمج (30/06) | الملف الجديد | بعد الدمج |
|--------|-------------------|--------------|-----------|
| `openingBalance.debit` | 1000 | 500 | **1500** |
| `closingBalance.debit` | 2000 | 800 | **2800** |
| `totals.credit` | 300 | 200 | **500** |

---

### 2️⃣ **حذف المعاملات اليدوية القديمة** ⚠️

```javascript
// قبل الدمج
transactions: [
  { type: "addition", amount: 500, date: "2024-01-15" },
  { type: "deduction", amount: 200, date: "2024-02-10" }
]

// ❌ بعد الدمج
transactions: []  // مصفوفة فارغة
```

---

## 🔧 الملفات المعدلة

### 1. `src/app/api/data/route.js`
```javascript
// إضافة معالج لعلامة clearTransactions
const shouldClearTransactions = body.clearTransactions === true;

for (const newAcc of dataToSave) {
  if (shouldClearTransactions) {
    // حذف المعاملات القديمة عند الدمج
    newAcc.transactions = [];
  } else {
    // الحفاظ على المعاملات القديمة في الحالات العادية
    const oldTx = oldTransactionsMap.get(newAcc.accountCode);
    newAcc.transactions = oldTx || [];
  }
}
```

---

### 2. `src/hooks/useAccountData.js`
```javascript
// إرسال علامة clearTransactions عند الدمج
fetch("/api/data", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    data: preparedResults,
    dateRange: extractedDateRange,
    clearTransactions: true, // ⚠️ علامة لحذف المعاملات القديمة
  }),
})
```

---

### 3. `src/components/dashboard/DashboardHeader.jsx`
```javascript
// إضافة رسالة تحذير قبل الدمج
const handleMergeWithWarning = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const confirmed = window.confirm(
    "⚠️ تحذير: عملية الدمج ستؤدي إلى:\n\n" +
    "1️⃣ دمج الأرصدة المالية (30/06 + الملف الجديد)\n" +
    "2️⃣ حذف جميع المعاملات اليدوية القديمة (الإضافات والخصومات)\n" +
    "3️⃣ البدء من جديد مع الأرصدة المدمجة فقط\n\n" +
    "هل تريد المتابعة؟"
  );

  if (confirmed) {
    handleFileUploadWithMerge(e);
  }
};
```

---

### 4. `src/lib/mergeBalances.js`
```javascript
/**
 * ⚠️ ملاحظة مهمة: عند استخدام الدمج، سيتم حذف جميع المعاملات اليدوية القديمة (transactions)
 * والبدء من جديد مع الأرصدة المدمجة فقط.
 */
```

---

## 🎯 الفرق بين "استبدال" و "دمج"

| الميزة | استبدال الحسابات | دمج مع أرصدة 30/06 |
|-------|------------------|-------------------|
| **الأرصدة المالية** | يتم استبدالها بالكامل | يتم جمعها (30/06 + جديد) |
| **المعاملات اليدوية** | ❌ تُحذف | ❌ تُحذف |
| **الحسابات القديمة** | يتم استبدالها بالكامل | يتم الدمج أو الإضافة |
| **حالات الاستخدام** | بداية شهر جديد | دمج فترتين ماليتين |

---

## 📊 مثال عملي كامل

### السيناريو
لديك حساب برقم `12345` في قاعدة البيانات:

```javascript
// البيانات الحالية في قاعدة البيانات
{
  accountCode: "12345",
  account: "محمد أحمد",
  openingBalance: { debit: 0, credit: 0 },    // من ملف 30/06
  closingBalance: { debit: 1000, credit: 0 }, // من ملف 30/06
  transactions: [
    { type: "addition", amount: 500, date: "2024-07-15" },
    { type: "deduction", amount: 200, date: "2024-08-10" }
  ]
}
```

### بعد رفع ملف جديد باستخدام "دمج مع أرصدة 30/06"
الملف الجديد يحتوي على:
```javascript
// البيانات من الملف الجديد
{
  accountCode: "12345",
  closingBalance: { debit: 800, credit: 0 }
}
```

### النتيجة النهائية في قاعدة البيانات:
```javascript
{
  accountCode: "12345",
  account: "محمد أحمد",
  openingBalance: { debit: 0, credit: 0 },
  closingBalance: { debit: 1800, credit: 0 }, // ✅ 1000 + 800 = 1800
  transactions: []  // ❌ تم حذف المعاملات القديمة
}
```

---

## ⚠️ تحذيرات مهمة

1. **لا يمكن التراجع**: بمجرد الدمج، لا يمكن استرجاع المعاملات القديمة إلا من نسخة احتياطية
2. **احفظ نسخة احتياطية**: استخدم زر "نسخة احتياطية" قبل الدمج
3. **رسالة التأكيد**: سيظهر تحذير قبل الدمج لتأكيد العملية

---

## ✅ الخلاصة

- ✅ الأرصدة المالية: **مدمجة** (جمع رياضي)
- ❌ المعاملات اليدوية: **محذوفة** (تبدأ من جديد)
- 🔔 رسالة تحذير: **تظهر قبل التنفيذ**
- 💾 النسخ الاحتياطي: **موصى به قبل الدمج**
