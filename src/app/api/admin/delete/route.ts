import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { deleteAssessmentResult, deleteAllAssessmentResults } from '@/lib/db';

export async function DELETE(req: NextRequest) {
  const auth = await isAdminAuthenticated();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    if (id === 'ALL' || id === 'all') {
      const deletedCount = deleteAllAssessmentResults();
      return NextResponse.json({ success: true, message: `All ${deletedCount} records deleted successfully` });
    }

    const success = deleteAssessmentResult(id);
    if (success) {
      return NextResponse.json({ success: true, message: 'Result deleted' });
    } else {
      return NextResponse.json({ error: 'Result not found or already deleted' }, { status: 404 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
