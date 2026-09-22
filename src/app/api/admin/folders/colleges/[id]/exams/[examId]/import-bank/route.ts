import { NextRequest, NextResponse } from 'next/server';
import {
  getExamById,
  importBankQuestionsToCollegeExam,
  getQuestionsByExamId,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; examId: string }> }
) {
  try {
    const { examId: paramExamId } = await params;
    const examId = parseInt(paramExamId, 10);
    if (isNaN(examId)) {
      return NextResponse.json({ success: false, message: 'Invalid Exam ID' }, { status: 400 });
    }

    const exam = getExamById(examId);
    if (!exam) {
      return NextResponse.json({ success: false, message: 'Exam not found' }, { status: 404 });
    }

    const body = await request.json();
    const bankIds: number[] = body.bankIds || [];

    if (!Array.isArray(bankIds) || bankIds.length === 0) {
      return NextResponse.json({ success: false, message: 'No question bank items selected' }, { status: 400 });
    }

    const count = importBankQuestionsToCollegeExam(examId, bankIds);
    const questions = getQuestionsByExamId(examId);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${count} question(s) from Question Bank!`,
      count,
      questions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Error importing questions from bank' },
      { status: 500 }
    );
  }
}
