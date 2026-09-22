import { NextRequest, NextResponse } from 'next/server';
import {
  getExamById,
  getAttemptsByExamId,
  getAttemptById,
  deleteExamAttempt,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; examId: string }> }
) {
  try {
    const { examId: paramExamId } = await params;
    const examId = parseInt(paramExamId, 10);
    if (isNaN(examId)) {
      return NextResponse.json({ success: false, message: 'Invalid Exam ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const exam = getExamById(examId);
    if (!exam) {
      return NextResponse.json({ success: false, message: 'Exam not found' }, { status: 404 });
    }

    const results = getAttemptsByExamId(examId, {
      search,
      status,
      sortBy,
      sortOrder,
    });

    // Compute stats
    const totalAttempts = results.length;
    const passedCount = results.filter((r) => r.result_status === 'PASS').length;
    const failedCount = totalAttempts - passedCount;
    const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;
    const scores = results.map((r) => r.obtained_marks);
    const avgScore = totalAttempts > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / totalAttempts) * 10) / 10 : 0;
    const highestScore = totalAttempts > 0 ? Math.max(...scores) : 0;
    const lowestScore = totalAttempts > 0 ? Math.min(...scores) : 0;

    return NextResponse.json({
      success: true,
      exam,
      results,
      stats: {
        totalAttempts,
        passedCount,
        failedCount,
        passRate,
        avgScore,
        highestScore,
        lowestScore,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Error fetching results' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; examId: string }> }
) {
  try {
    const { examId: paramExamId } = await params;
    const { searchParams } = new URL(request.url);
    const attemptId = searchParams.get('attemptId');
    if (!attemptId) {
      return NextResponse.json({ success: false, message: 'Attempt ID is required' }, { status: 400 });
    }

    const deleted = deleteExamAttempt(attemptId);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Attempt record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Result record deleted / reset successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Error deleting result' }, { status: 500 });
  }
}
