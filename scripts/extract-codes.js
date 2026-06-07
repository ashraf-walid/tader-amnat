const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

// Define the Schema
const AccountDataSchema = new mongoose.Schema({
  accountCode: String,
});

const AccountData = mongoose.models.AccountData || mongoose.model('AccountData', AccountDataSchema);

// Current Priority Codes (hardcoded for simplicity in the script)
const PRIORITY_CODES = [
  '1714986', '1714994', '17142002', '17142003', '17142005', '17142006', 
  '17142007', '17142008', '17142009', '17142010', '17142011', '17142012', '17142013', 
  '17142015', '17142016', '17142019', '17142020', '17142021', '17142022', '17142023', 
  '17142024', '17142025', '17142026', '17142027', '17142028', '17142029', '17142030', 
  '17142033', '17142034', '17142035', '17142036', '17142037', '17142038', '17142039', 
  '17142040', '17142042', '17142047', '17142048', '17142055', '17142056', '17142059', 
  '17142060', '17142063', '17142067', '17142074', '17142075', '17142076', '17142077', 
  '17142083', '17142084', '17142090', '17142093', '17142094', '17142095', '17142098', 
  '17142099', '17142100', '17142105', '17142108', '17142114', '17142117', '17142118', 
  '17142121', '17142122', '17142123', '17142124', '17142126', '17142127', '17142128', 
  '17142131', '17142135', '17142138', '17142143', '17142144', '17142147', '17142150', 
  '17142151', '17142152', '17142154', '17142158', '17142165', '1714893',  '17142167', 
  '17142001', '17142004', '17142014', '17142043', '17142044', '17142045', '17142046',
  '17142054', '17142058', '17142061', '17142065', '17142054', '17142058', '17142061', 
  '17142065', '17142073', '17142082', '17142085', '17142096', '17142148', '17142162',
];

async function extractCodes() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const allAccounts = await AccountData.find({}, 'accountCode');
    const allCodes = allAccounts.map(a => a.accountCode).filter(Boolean);
    
    // Remove duplicates
    const uniqueCodes = [...new Set(allCodes)];
    
    // Filter out priority codes
    const nonPriorityCodes = uniqueCodes.filter(code => !PRIORITY_CODES.includes(code));

    console.log('\n--- EXTRACTED NON-PRIORITY CODES ---');
    console.log(JSON.stringify(nonPriorityCodes, null, 2));
    console.log('\nTotal non-priority codes found:', nonPriorityCodes.length);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

extractCodes();
