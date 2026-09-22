import { NextRequest, NextResponse } from 'next/server';
import { saveQuestionToBank } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; examId: string }> }
) {
  try {
    const body = await request.json();
    if (!body.question_text || !body.question_text.trim()) {
      return NextResponse.json({ success: false, message: 'Question Text is required' }, { status: 400 });
    }

    const bankId = saveQuestionToBank({
      question_text: body.question_text,
      question_type: body.question_type || 'Single Choice',
      option_a: body.option_a,
      option_b: body.option_b,
      option_c: body.option_c,
      option_d: body.option_d,
      correct_answer: body.correct_answer || 'A',
      marks: body.marks || 1,
      difficulty: body.difficulty || 'Medium',
      topic: body.topic || 'SAP ABAP Fundamentals',
      explanation: body.explanation || '',
    });

    return NextResponse.json({
      success: true,
      message: 'Question successfully saved to Question Bank!',
      bankId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Error saving question to bank' },
      { status: 500 }
    );
  }
}
