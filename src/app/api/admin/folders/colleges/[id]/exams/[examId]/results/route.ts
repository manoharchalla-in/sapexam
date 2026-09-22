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

    const allAttempts = getAttemptsByExamId(examId, {
      search,
      status: 'all',
      sortBy,
      sortOrder,
    });

    const liveAttempts = allAttempts.filter((a) => a.status === 'In Progress');
    const results = allAttempts.filter((a) => a.status === 'Submitted');

    // Filter results if status was specified
    const filteredResults =
      status !== 'all'
        ? results.filter((r) => r.result_status.toUpperCase() === status.toUpperCase())
        : results;

    // Compute comprehensive analytics for this specific exam
    const totalSubmissions = results.length;
    const passedCount = results.filter((r) => r.result_status === 'PASS').length;
    const failedCount = totalSubmissions - passedCount;
    const passRate = totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;
    const scores = results.map((r) => r.obtained_marks);
    const avgScore =
      totalSubmissions > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / totalSubmissions) * 10) / 10
        : 0;
    const highestScore = totalSubmissions > 0 ? Math.max(...scores) : 0;
    const lowestScore = totalSubmissions > 0 ? Math.min(...scores) : 0;
    const avgPercentage =
      totalSubmissions > 0
        ? Math.round(results.reduce((a, b) => a + (b.percentage || 0), 0) / totalSubmissions)
        : 0;
    const avgTimeMinutes =
      totalSubmissions > 0
        ? Math.round(
            results.reduce((a, b) => a + (b.time_taken_seconds || 0) / 60, 0) / totalSubmissions
          )
        : 0;

    const scoreDistribution = {
      grade90_100: results.filter((r) => r.percentage >= 90).length,
      grade75_89: results.filter((r) => r.percentage >= 75 && r.percentage < 90).length,
      grade50_74: results.filter((r) => r.percentage >= 50 && r.percentage < 75).length,
      gradeBelow50: results.filter((r) => r.percentage < 50).length,
    };

    return NextResponse.json({
      success: true,
      exam,
      results: filteredResults,
      liveAttempts,
      analytics: {
        totalSubmissions,
        activeLiveCount: liveAttempts.length,
        passedCount,
        failedCount,
        passRate,
        avgScore,
        highestScore,
        lowestScore,
        avgPercentage,
        avgTimeMinutes,
        scoreDistribution,
      },
      stats: {
        totalAttempts: totalSubmissions,
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
