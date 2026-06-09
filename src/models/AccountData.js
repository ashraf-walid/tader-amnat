import mongoose from "mongoose";

const AccountDataSchema = new mongoose.Schema(
  {
    account: String,
    accountCode: String,
    openingBalance: {
      debit: { type: Number, default: 0 },
      credit: { type: Number, default: 0 },
    },
    totals: {
      debit: { type: Number, default: 0 },
      credit: { type: Number, default: 0 },
    },
    closingBalance: {
      debit: { type: Number, default: 0 },
      credit: { type: Number, default: 0 },
    },
    transactions: [
      {
        type: { type: String },
        amount: Number,
        date: Date,
      },
    ],
  },
  { timestamps: true },
);

// ─── Database Indexes للأداء العالي ───────────────────────────────────────
// 1️⃣ Indexes للاستعلامات الشائعة:

AccountDataSchema.index({ accountCode: 1 }); // للترتيب والبحث حسب كود الحساب
AccountDataSchema.index({ account: "text" }); // للبحث النصي في اسم الحساب
AccountDataSchema.index({ "transactions.date": -1 }); // للبحث في تواريخ المعاملات
AccountDataSchema.index({ accountCode: 1, account: "text" }); // Compound index للبحث المركب

export default mongoose.models.AccountData ||
  mongoose.model("AccountData", AccountDataSchema);
