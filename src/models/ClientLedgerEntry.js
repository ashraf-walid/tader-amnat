import mongoose from "mongoose";

/**
 * Entries that will make up each client's statement.
 *
 * Today only "balance" entries from the accounts module are written: the
 * closing balance of the uploaded accounting file, without manual additions
 * or deductions. Transactions from an external source will be added later
 * as kind "transaction" with their own source, in this same collection.
 */
const ClientLedgerEntrySchema = new mongoose.Schema(
  {
    accountCode: { type: String, required: true },
    accountName: { type: String, default: "" },
    kind: { type: String, enum: ["balance", "transaction"], required: true },
    source: { type: String, required: true },
    // Net closing balance: debit minus credit (positive means "ليك")
    balance: { type: Number },
    dateRange: { type: String, default: "" },
    recordedAt: { type: Date, default: Date.now },
    recordedBy: { type: String, default: "" },
  },
  { timestamps: false },
);

ClientLedgerEntrySchema.index({ accountCode: 1, kind: 1, recordedAt: -1 });

export default mongoose.models.ClientLedgerEntry ||
  mongoose.model("ClientLedgerEntry", ClientLedgerEntrySchema);
