import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { getAllResultsForExport } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await isAdminAuthenticated();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  const format = searchParams.get('format') || 'csv';
  const search = searchParams.get('search') || undefined;
  const scoreFilter = searchParams.get('scoreFilter') || 'all';
  const percentageFilter = searchParams.get('percentageFilter') || 'all';
  const dateFilter = searchParams.get('dateFilter') || undefined;
  const sortBy = (searchParams.get('sortBy') as any) || 'date';
  const sortOrder = (searchParams.get('sortOrder') as any) || 'desc';

  const records = getAllResultsForExport({
    search,
    scoreFilter,
    percentageFilter,
    dateFilter,
    sortBy,
    sortOrder,
  });

  const formattedRecords = records.map((r) => ({
    id: r.id,
    candidate_name: r.candidate_name,
    candidate_email: r.candidate_email,
    campus_name: r.campus_name || 'N/A',
    trainer_name: r.trainer_name || 'N/A',
    attempt_number: r.attempt_number,
    score: r.score,
    total_questions: r.total_questions,
    percentage: r.percentage,
    correct_answers: r.correct_answers,
    incorrect_answers: r.incorrect_answers,
    unanswered_answers: r.unanswered_answers,
    submitted_at: r.submitted_at,
  }));

  if (format === 'json') {
    return new NextResponse(JSON.stringify(formattedRecords, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="sap_abap_assessment_results_${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  }

  if (format === 'excel') {
    const headers = ['Candidate Name', 'Email ID', 'Campus Name', 'Trainer Name', 'Attempt #', 'Score', 'Total Questions', 'Percentage', 'Correct', 'Incorrect', 'Unanswered', 'Submitted At'];
    const rows = formattedRecords.map((r) => [
      r.candidate_name,
      r.candidate_email,
      r.campus_name,
      r.trainer_name,
      r.attempt_number,
      r.score,
      r.total_questions,
      `${r.percentage}%`,
      r.correct_answers,
      r.incorrect_answers,
      r.unanswered_answers,
      new Date(r.submitted_at).toLocaleString(),
    ]);

    const tsvContent = [headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n');
    return new NextResponse(tsvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/tab-separated-values; charset=utf-8',
        'Content-Disposition': `attachment; filename="sap_abap_assessment_results_${new Date().toISOString().slice(0, 10)}.xls"`,
      },
    });
  }

  const headers = ['Candidate Name', 'Email ID', 'Campus Name', 'Trainer Name', 'Attempt #', 'Score', 'Total Questions', 'Percentage', 'Correct', 'Incorrect', 'Unanswered', 'Submitted At'];

  const escapeCSV = (field: any) => {
    const str = String(field ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = formattedRecords.map((r) => [
    escapeCSV(r.candidate_name),
    escapeCSV(r.candidate_email),
    escapeCSV(r.campus_name),
    escapeCSV(r.trainer_name),
    escapeCSV(r.attempt_number),
    escapeCSV(r.score),
    escapeCSV(r.total_questions),
    escapeCSV(`${r.percentage}%`),
    escapeCSV(r.correct_answers),
    escapeCSV(r.incorrect_answers),
    escapeCSV(r.unanswered_answers),
    escapeCSV(new Date(r.submitted_at).toLocaleString()),
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sap_abap_assessment_results_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
