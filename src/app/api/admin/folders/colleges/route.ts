import { NextRequest, NextResponse } from 'next/server';
import { getAllColleges, createCollege } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const colleges = getAllColleges(search);
    return NextResponse.json({ success: true, colleges });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Failed to fetch colleges' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, message: 'College Name is required' }, { status: 400 });
    }

    const college = createCollege({
      name: body.name.trim(),
      code: body.code?.trim(),
      description: body.description?.trim(),
    });

    return NextResponse.json({
      success: true,
      message: 'College folder created successfully with default subfolders',
      college,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Failed to create college folder' }, { status: 500 });
  }
}
