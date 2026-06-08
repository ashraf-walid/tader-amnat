const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { type: String, default: 'client' },
  attempts: { type: Number, default: 5 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const id = '6a22c3b631668a371fe73160';
    console.log(`Searching for user with ID: ${id}`);
    const user = await User.findById(id);
    if (!user) {
      console.log('User not found!');
    } else {
      console.log('User found:', user.username, 'Attempts:', user.attempts);
      user.attempts = 10;
      await user.save();
      console.log('User attempts updated successfully!');
    }
  } catch (error) {
    console.error('Error during execution:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected!');
  }
}

run();
