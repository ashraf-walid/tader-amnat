import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema(
  {
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
      default: "",
    },
    officeName: {
      type: String,
      trim: true,
      default: "",
    },
    accountCode: {
      type: Number,
      default: null,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "employee", "client"],
      default: "client",
    },
    attempts: {
      type: Number,
      default: null,
      min: 0,
    },
    calculationsCount: {
      type: Number,
      default: 0,
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
    isPwaInstalled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// ─── Database Indexes for High Performance ───────────────────────────────────────
// 1️⃣ username: automatically indexed because of unique: true
// 2️⃣ _id: automatically indexed by MongoDB
// 3️⃣ Additional indexes for common queries:

UserSchema.index({ createdAt: -1 }); // Sort accounts by creation date
UserSchema.index({ role: 1 }); // Search by role (admin, client, etc.)
UserSchema.index({ accountCode: 1 }); // Search by account code
UserSchema.index({ isActive: 1, attempts: -1 }); // Search active accounts by attempts
UserSchema.index({ username: 1, role: 1 }); // Compound index for combined search

// Hash password before saving
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
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

export default mongoose.models.User || mongoose.model("User", UserSchema);
