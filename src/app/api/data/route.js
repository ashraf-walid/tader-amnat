import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const DATA_FILE = path.join(process.cwd(), 'data_storage.json');

export async function GET() {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(content);
    return NextResponse.json({
      data: data,
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.log('GET /api/data: No file found or error, returning empty');
    return NextResponse.json({ data: [], timestamp: Date.now() });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('POST /api/data: Saved', data.length, 'items');
    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (error) {
    console.error('POST /api/data Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
