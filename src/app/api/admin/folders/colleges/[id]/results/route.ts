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

    const allCollegeResults = getResultsByCollegeId(collegeId, { examId: 'all' });
    const rawExams = getExamsByCollegeId(collegeId);

    const exams = rawExams.map((ex) => {
      const exResults = allCollegeResults.filter((r) => r.exam_id === ex.id);
      const subCount = exResults.length;
      const passCount = exResults.filter((r) => r.result_status === 'PASS').length;
      const failCount = exResults.filter((r) => r.result_status === 'FAIL').length;
      const rate = subCount > 0 ? Math.round((passCount / subCount) * 100) : 0;
      const avg =
        subCount > 0
          ? Math.round(exResults.reduce((acc, r) => acc + (r.obtained_marks || 0), 0) / subCount)
          : 0;

      return {
        ...ex,
        total_submissions: subCount,
        passed_count: passCount,
        failed_count: failCount,
        pass_rate: rate,
        avg_score: avg,
      };
    });

    // Calculate Summary Stats for current query
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
