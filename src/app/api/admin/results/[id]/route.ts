import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { getRecordById, getQuestionsByPaperId, getQuestionPaperById } from '@/lib/db';

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

  const paperId = record.question_paper_id || 1;
  const paper = getQuestionPaperById(paperId);
  const dbQuestions = getQuestionsByPaperId(paperId);

  const review = dbQuestions.map((q) => {
    const qKey = String(q.id);
    const userAnswerKey = (parsedAnswers[qKey] || parsedAnswers[q.id as any] || '').trim().toUpperCase();
    const isCorrect = userAnswerKey === q.correct_answer.trim().toUpperCase();
    const isUnanswered = !userAnswerKey;

    const options = [
      { key: 'A', text: q.option_a },
      { key: 'B', text: q.option_b },
      { key: 'C', text: q.option_c },
      { key: 'D', text: q.option_d },
    ];

    const userAnswerOption = options.find((o) => o.key === userAnswerKey);
    const correctAnswerOption = options.find((o) => o.key === q.correct_answer.toUpperCase());

    return {
      id: q.id,
      question: q.question_text,
      options,
      userAnswerKey,
      userAnswerText: userAnswerOption ? `${userAnswerOption.key}. ${userAnswerOption.text}` : 'Unanswered',
      correctAnswerKey: q.correct_answer.toUpperCase(),
      correctAnswerText: correctAnswerOption ? `${correctAnswerOption.key}. ${correctAnswerOption.text}` : '',
      explanation: q.explanation || '',
      status: isUnanswered ? 'unanswered' : isCorrect ? 'correct' : 'incorrect',
    };
  });

  return NextResponse.json({
    id: record.id,
    candidate_name: record.candidate_name,
    candidate_email: record.candidate_email,
    campus_name: record.campus_name || 'N/A',
    trainer_name: record.trainer_name || 'N/A',
    question_paper_id: record.question_paper_id,
    question_paper_title: record.question_paper_title || paper?.title || 'SAP ABAP Assessment',
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
