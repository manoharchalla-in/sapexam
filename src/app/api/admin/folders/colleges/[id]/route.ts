import { NextRequest, NextResponse } from 'next/server';
import { getCollegeById, updateCollege, deleteCollege } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: 'Invalid College ID' }, { status: 400 });
    }

    const college = getCollegeById(id);
    if (!college) {
      return NextResponse.json({ success: false, message: 'College not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, college });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Error fetching college' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: 'Invalid College ID' }, { status: 400 });
    }

    const body = await request.json();
    const updated = updateCollege(id, {
      name: body.name,
      code: body.code,
      description: body.description,
    });

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Failed to update college or not found' }, { status: 404 });
    }

    const college = getCollegeById(id);
    return NextResponse.json({ success: true, message: 'College updated successfully', college });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Error updating college' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: 'Invalid College ID' }, { status: 400 });
    }

    const deleted = deleteCollege(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'College not found or could not be deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'College folder deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Error deleting college' }, { status: 500 });
  }
}
