import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/logout
 * User logout endpoint
 */
export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });

    // Clear auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('POST /api/auth/logout Error:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء تسجيل الخروج'
    }, { status: 500 });
  }
}
