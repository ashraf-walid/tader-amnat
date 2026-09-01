/**
 * Script to reset calculation logs, user attempts, and calculations count
 * Run: node scripts/reset-logs-and-attempts.js
 */

import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Read environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');

  envLines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex !== -1) {
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = value;
    }
  });
}


const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ خطأ: لم يتم العثور على متغير MONGODB_URI في ملف .env.local');
  process.exit(1);
}

// Schemas
const CalculationLogSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    username: String,
    role: String,
    officeName: String,
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    username: String,
    attempts: Number,
    calculationsCount: Number,
  },
  { timestamps: true }
);

const CalculationLog =
  mongoose.models.CalculationLog ||
  mongoose.model('CalculationLog', CalculationLogSchema);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function resetData() {
  try {
    console.log('🔄 جاري الاتصال بقاعدة البيانات MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ تم الاتصال بنجاح.\n');

    // 1. Delete calculationlogs
    console.log('🗑️  جاري مسح جميع السجلات من calculationlogs...');
    const deleteResult = await CalculationLog.deleteMany({});
    console.log(`✅ تم حذف ${deleteResult.deletedCount} سجل من calculationlogs بنجاح.\n`);

    // 2. Reset attempts and calculationsCount in users collection
    console.log('🔄 جاري تصفير attempts و calculationsCount لجميع المستخدمين...');
    const updateResult = await User.updateMany(
      {},
      { $set: { attempts: 0, calculationsCount: 0 } }
    );
    console.log(`✅ تم تحديث وتصفير ${updateResult.modifiedCount} حساب مستخدم بنجاح.\n`);

    console.log('═════════════════════════════════════════');
    console.log('🎉 تمت عملية التصفير بالكامل بنجاح!');
    console.log('═════════════════════════════════════════');
  } catch (error) {
    console.error('❌ حدث خطأ أثناء تنفيذ عملية التصفير:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات.');
    process.exit(0);
  }
}

resetData();
