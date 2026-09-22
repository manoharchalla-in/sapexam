import { NextRequest, NextResponse } from 'next/server';
import {
  getExamById,
  getQuestionsByExamId,
  saveQuestionForExam,
  deleteExamQuestion,
  reorderExamQuestions,
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

    const exam = getExamById(examId);
    if (!exam) {
      return NextResponse.json({ success: false, message: 'Exam not found' }, { status: 404 });
    }

    const questions = getQuestionsByExamId(examId);
    return NextResponse.json({ success: true, exam, questions, total: questions.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Error fetching questions' }, { status: 500 });
  }
}

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

    const body = await request.json();

    if (body.action === 'reorder' && Array.isArray(body.questionIds)) {
      reorderExamQuestions(examId, body.questionIds);
      return NextResponse.json({ success: true, message: 'Questions reordered successfully' });
    }

    if (!body.question_text || !body.question_text.trim()) {
      return NextResponse.json({ success: false, message: 'Question Text is required' }, { status: 400 });
    }
    if (!body.option_a || !body.option_b || !body.option_c || !body.option_d) {
      return NextResponse.json({ success: false, message: 'All 4 options (A, B, C, D) are required' }, { status: 400 });
    }
    if (!body.correct_answer) {
      return NextResponse.json({ success: false, message: 'Correct Answer is required (A, B, C, or D)' }, { status: 400 });
    }

    const saved = saveQuestionForExam({
      id: body.id ? parseInt(body.id, 10) : undefined,
      exam_id: examId,
      question_text: body.question_text.trim(),
      question_type: body.question_type || 'Single Choice',
      option_a: body.option_a.trim(),
      option_b: body.option_b.trim(),
      option_c: body.option_c.trim(),
      option_d: body.option_d.trim(),
      correct_answer: body.correct_answer.trim().toUpperCase(),
      marks: parseFloat(body.marks || '1'),
      explanation: body.explanation?.trim() || '',
      order_index: body.order_index ? parseInt(body.order_index, 10) : 1,
    });

    return NextResponse.json({
      success: true,
      message: body.id ? 'Question updated successfully' : 'Question added successfully',
      question: saved,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Error saving question' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; examId: string }> }
) {
  try {
    const { examId: paramExamId } = await params;
    const examId = parseInt(paramExamId, 10);
    const { searchParams } = new URL(request.url);
    const questionIdStr = searchParams.get('questionId');
    const questionId = parseInt(questionIdStr || '', 10);

    if (isNaN(examId) || isNaN(questionId)) {
      return NextResponse.json({ success: false, message: 'Valid Exam ID and Question ID are required' }, { status: 400 });
    }

    const deleted = deleteExamQuestion(questionId, examId);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Question deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Error deleting question' }, { status: 500 });
  }
}
