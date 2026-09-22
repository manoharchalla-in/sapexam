import { NextRequest, NextResponse } from 'next/server';
import { getCollegeById, getResultsByCollegeId, getExamsByCollegeId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const collegeId = parseInt(paramId, 10);
    if (isNaN(collegeId)) {
      return NextResponse.json({ success: false, message: 'Invalid College ID' }, { status: 400 });
    }

    const college = getCollegeById(collegeId);
    if (!college) {
      return NextResponse.json({ success: false, message: 'College not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const examIdParam = searchParams.get('examId');
    const examId = examIdParam && examIdParam !== 'all' ? parseInt(examIdParam, 10) : 'all';
    const status = searchParams.get('status') || 'all';

    const results = getResultsByCollegeId(collegeId, {
      search,
      examId,
      status,
    });

    const exams = getExamsByCollegeId(collegeId);

    // Calculate Summary Stats
    const totalSubmissions = results.length;
    const passedCount = results.filter((r) => r.result_status === 'PASS').length;
    const failedCount = results.filter((r) => r.result_status === 'FAIL').length;
    const passRate = totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;
    const avgScore =
      totalSubmissions > 0
        ? Math.round(results.reduce((acc, r) => acc + (r.obtained_marks || 0), 0) / totalSubmissions)
        : 0;

    return NextResponse.json({
      success: true,
      college,
      exams,
      results,
      stats: {
        totalSubmissions,
        passedCount,
        failedCount,
        passRate,
        avgScore,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Error fetching results' }, { status: 500 });
  }
}
