import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/accounts/[id]/attempts
 * Update user's login attempts
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { attempts } = body;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'معرف الحساب غير صحيح'
      }, { status: 400 });
    }

    if (typeof attempts !== 'number' || attempts < 0) {
      return NextResponse.json({
        success: false,
        error: 'عدد المحاولات غير صحيح'
      }, { status: 400 });
    }

    await connectToDatabase();

    // Use findByIdAndUpdate to bypass the bcrypt pre-save hook
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { attempts } },
      { returnDocument: 'after', runValidators: true, select: 'username attempts role' }
    );

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'الحساب غير موجود'
      }, { status: 404 });
    }

    console.log(`✅ User attempts updated: ${user.username} → ${attempts}`);

    return NextResponse.json({
      success: true,
      attempts: user.attempts,
      username: user.username,
      message: `تم منح ${attempts} محاولات للمستخدم ${user.username}`
    });

  } catch (error) {
    console.error('PATCH /api/accounts/[id]/attempts Error:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في تحديث المحاولات',
      message: error.message
    }, { status: 500 });
  }
}
