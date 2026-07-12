import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req) {
  try {
    const decoded = requireAuth(req);
    const userId = decoded.id || decoded.userId;

    const { isPwa } = await req.json();

    if (isPwa) {
      await connectToDatabase();
      // Conditional update: only updates if isPwaInstalled is not already true.
      // This saves unnecessary database write operations.
      const result = await User.updateOne(
        { _id: userId, isPwaInstalled: { $ne: true } },
        { isPwaInstalled: true }
      );
      
      return NextResponse.json({ 
        success: true, 
        updated: result.modifiedCount > 0 
      });
    }

    return NextResponse.json({ success: true, updated: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: "غير مسجل الدخول" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
