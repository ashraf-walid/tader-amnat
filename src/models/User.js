import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

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
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to decrement attempts
UserSchema.methods.decrementAttempts = async function () {
  if (this.attempts > 0) {
    this.attempts -= 1;
    await this.save();
  }
  return this.attempts;
};

// Method to reset attempts
UserSchema.methods.resetAttempts = async function (newAttempts = 5) {
  this.attempts = newAttempts;
  await this.save();
  return this.attempts;
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
