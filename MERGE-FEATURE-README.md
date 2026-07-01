# 🔄 ميزة دمج الأرصدة مع ملف 30/06

## 📋 نظرة عامة

تم إضافة ميزة جديدة تسمح بدمج ملف HTML جديد مع الأرصدة الأساسية المحفوظة من تاريخ 30/06/2026.

---

## 🎯 الغرض من الميزة

- **المشكلة**: الملفات المرفوعة بعد 30/06 لا تحتوي على أرصدة العملاء المهمة التي لم يتم ترحيلها
- **الحل**: دمج تلقائي للأرصدة القديمة (30/06) مع الملفات الجديدة

---

## 📁 الملفات المُضافة/المُعدّلة

### ملفات جديدة:
1. **`src/lib/mergeBalances.js`** - منطق الدمج الرئيسي
2. **`src/lib/convertToBaseBalances.js`** - تحويل HTML إلى JSON
3. **`public/base-balances-30-06.json`** - ملف الأرصدة الأساسية

### ملفات مُعدّلة:
1. **`src/hooks/useAccountData.js`** - إضافة دالة `processFileWithMerge`
2. **`src/components/dashboard/DashboardHeader.jsx`** - إضافة زر الدمج
3. **`src/app/page.js`** - تمرير الدالة الجديدة

---

## 🚀 كيفية الاستخدام

### 1️⃣ تحويل ملف 30/06 إلى JSON (مرة واحدة فقط)
```javascript
import { convertHTMLToBaseBalances } from '@/lib/convertToBaseBalances';

// رفع ملف 30/06.html
const result = await convertHTMLToBaseBalances(file);
// سيتم تنزيل base-balances-30-06.json تلقائياً
```

### 2️⃣ وضع الملف في المكان الصحيح
- انقل ملف `base-balances-30-06.json` إلى مجلد `public/`

### 3️⃣ استخدام زر الدمج
- افتح الصفحة الرئيسية
- اضغط على زر **"دمج مع أرصدة 30/06"**
- اختر ملف HTML الجديد
- سيتم الدمج تلقائياً

---

## 🔍 منطق الدمج

### القواعد:
1. **حساب موجود في كلا الملفين**: جمع جميع الأرصدة
   ```javascript
   closingBalance.debit = base.debit + new.debit
   closingBalance.credit = base.credit + new.credit
   ```

2. **حساب موجود فقط في 30/06**: الاحتفاظ به كما هو

3. **حساب موجود فقط في الملف الجديد**: إضافته

### مثال:
```javascript
// ملف 30/06
{ accountCode: "1714986", closingBalance: { debit: 1000, credit: 0 } }

// ملف جديد (05/07)
{ accountCode: "1714986", closingBalance: { debit: 500, credit: 0 } }

// النتيجة بعد الدمج
{ accountCode: "1714986", closingBalance: { debit: 1500, credit: 0 } }
```

---

## 📊 معلومات الدمج

بعد الدمج، ستظهر رسالة تحتوي على:
- إجمالي الحسابات
- عدد الحسابات المدمجة
- عدد الحسابات من 30/06 فقط
- عدد الحسابات الجديدة

---

## ⚠️ ملاحظات مهمة

1. **ملف الأرصدة الأساسية ثابت**: لا يتم تعديله عند كل رفع
2. **الزر يدعم HTML فقط**: لا يمكن استخدام ملفات JSON
3. **جمع جميع الحقول**: يتم جمع `openingBalance`, `totals`, `closingBalance`
4. **الحسابات المفقودة**: يتم تجاهلها (لا تسبب أخطاء)

---

## 🛠️ للمطورين

### الدوال الرئيسية:

```javascript
// دمج ملف HTML مع الأرصدة الأساسية
import { mergeHTMLWithBaseBalances } from '@/lib/mergeBalances';
const { data, dateRange, mergeInfo } = await mergeHTMLWithBaseBalances(file);

// التحقق من وجود الملف الأساسي
import { checkBaseBalancesExists } from '@/lib/mergeBalances';
const exists = await checkBaseBalancesExists();
```

### هيكل البيانات:
```javascript
{
  accountCode: "1714986",
  account: "اسم الحساب",
  openingBalance: { debit: 0, credit: 0 },
  totals: { debit: 0, credit: 0 },
  closingBalance: { debit: 0, credit: 0 }
}
```

---

## 🔮 المستقبل

عند العودة للملف الواحد (بدون دمج):
1. احذف زر "دمج مع أرصدة 30/06"
2. استخدم زر "استبدال الحسابات بالملف الجديد" العادي
3. يمكنك الاحتفاظ بملف `base-balances-30-06.json` كنسخة احتياطية

---

## ✅ تم بنجاح!

الميزة جاهزة للاستخدام! 🎉
