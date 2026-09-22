import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { getAllCampuses, createCampus, deleteCampus } from '@/lib/db';

export async function GET() {
  try {
    const campuses = getAllCampuses();
    return NextResponse.json({
      campuses: campuses.map((c) => ({
        id: c.id,
        name: c.name,
        created_at: c.created_at,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch campuses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await isAdminAuthenticated();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Campus name is required' }, { status: 400 });
    }

    const campus = createCampus(name.trim());
    return NextResponse.json({ success: true, campus });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create campus' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await isAdminAuthenticated();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, name } = await req.json();
    if (!id && !name) {
      return NextResponse.json({ error: 'Campus ID or Name is required' }, { status: 400 });
    }

    const deleted = deleteCampus(id || name);
    if (!deleted) {
      return NextResponse.json({ error: 'Campus not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Campus deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete campus' }, { status: 500 });
  }
}
