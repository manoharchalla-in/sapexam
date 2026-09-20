import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { getRecordById } from '@/lib/db';
import { SAP_ABAP_QUESTIONS } from '@/lib/questions';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await isAdminAuthenticated();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const record = getRecordById(id);

  if (!record) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  }

  let parsedAnswers: Record<string, string> = {};
  try {
    parsedAnswers = JSON.parse(record.answers || '{}');
  } catch {
    parsedAnswers = {};
  }

  const review = SAP_ABAP_QUESTIONS.map((q) => {
    const qKey = String(q.id);
    const userAnswerKey = parsedAnswers[qKey] || null;
    const isCorrect = userAnswerKey === q.correctAnswer;
    const isUnanswered = !userAnswerKey;

    const userAnswerOption = q.options.find((o) => o.key === userAnswerKey);
    const correctAnswerOption = q.options.find((o) => o.key === q.correctAnswer);

    return {
      id: q.id,
      question: q.question,
      options: q.options,
      userAnswerKey,
      userAnswerText: userAnswerOption ? `${userAnswerOption.key}. ${userAnswerOption.text}` : 'Unanswered',
      correctAnswerKey: q.correctAnswer,
      correctAnswerText: correctAnswerOption ? `${correctAnswerOption.key}. ${correctAnswerOption.text}` : '',
      status: isUnanswered ? 'unanswered' : isCorrect ? 'correct' : 'incorrect',
    };
  });

  return NextResponse.json({
    id: record.id,
    candidate_name: record.candidate_name,
    candidate_email: record.candidate_email,
    campus_name: record.campus_name || 'N/A',
    trainer_name: record.trainer_name || 'N/A',
    attempt_number: record.attempt_number,
    score: record.score,
    total_questions: record.total_questions,
    percentage: record.percentage,
    correct_answers: record.correct_answers,
    incorrect_answers: record.incorrect_answers,
    unanswered_answers: record.unanswered_answers,
    submitted_at: record.submitted_at,
    created_at: record.created_at,
    review,
  });
}
