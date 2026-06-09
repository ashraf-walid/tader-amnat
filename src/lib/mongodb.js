import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

const uri = MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // 🚀 Connection Pooling للأداء العالي
      maxPoolSize: 10, // عدد الاتصالات المتزامنة (افتراضي: 100، نخفضه لتوفير الموارد)
      minPoolSize: 2, // الحد الأدنى من الاتصالات الجاهزة
      serverSelectionTimeoutMS: 5000, // وقت الانتظار لاختيار Server
      socketTimeoutMS: 45000, // وقت انتهاء Socket
      family: 4, // استخدام IPv4 فقط (أسرع)
    };

    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      console.log('📊 Connection Pool: min=2, max=10');
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection error:', error.message);
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ Failed to establish MongoDB connection:', e);
    throw e;
  }

  return cached.conn;
}
