import mongoose from 'mongoose';

const AccountDataSchema = new mongoose.Schema({
  account: String,
  accountCode: String,
  openingBalance: {
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 }
  },
  totals: {
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 }
  },
  closingBalance: {
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 }
  },
  transactions: [{
    type: { type: String },
    amount: Number,
    date: Date
  }]
}, { timestamps: true });

export default mongoose.models.AccountData || mongoose.model('AccountData', AccountDataSchema);
