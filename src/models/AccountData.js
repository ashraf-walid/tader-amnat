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

// ─── Database Indexes for High Performance ───────────────────────────────────────
// 1️⃣ Indexes for common queries:

AccountDataSchema.index({ accountCode: 1 }); // Sort and search by account code
AccountDataSchema.index({ account: "text" }); // Text search in account name
AccountDataSchema.index({ "transactions.date": -1 }); // Search transaction dates
AccountDataSchema.index({ accountCode: 1, account: "text" }); // Compound index for combined search

export default mongoose.models.AccountData ||
  mongoose.model("AccountData", AccountDataSchema);
