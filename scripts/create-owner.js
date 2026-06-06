/**
 * Script to create the initial owner account
 * Run: node scripts/create-owner.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI;

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'employee', 'client'],
    default: 'client',
  },
  attempts: {
    type: Number,
    default: 5,
    min: 0,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createOwner() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if owner already exists
    const existingOwner = await User.findOne({ role: 'owner' });
    if (existingOwner) {
      console.log('⚠️  Owner account already exists:', existingOwner.username);
      console.log('If you want to create a new owner, delete the existing one first.');
      process.exit(0);
    }

    // Default owner credentials (change these!)
    const username = process.env.OWNER_USERNAME || 'admin';
    const password = process.env.OWNER_PASSWORD || 'admin123';
    const phone = process.env.OWNER_PHONE || '01000980788';

    console.log('\n📝 Creating owner account with credentials:');
    console.log('   Username:', username);
    console.log('   Password:', password);
    console.log('   Phone:', phone);
    console.log('\n⚠️  IMPORTANT: Change these credentials immediately after first login!\n');

    // Create owner
    const owner = new User({
      username: username.toLowerCase().trim(),
      password: password, // Will be hashed by pre-save hook
      phone: phone,
      role: 'owner',
      attempts: 999, // Unlimited attempts for owner
      isActive: true,
    });

    await owner.save();

    console.log('✅ Owner account created successfully!');
    console.log('\n🔐 Login credentials:');
    console.log('   URL: http://localhost:3000/login');
    console.log('   Username:', username);
    console.log('   Password:', password);
    console.log('\n⚠️  Remember to change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating owner:', error);
    process.exit(1);
  }
}

createOwner();
