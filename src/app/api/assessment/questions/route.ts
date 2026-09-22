import { NextRequest, NextResponse } from 'next/server';
import { getQuestionPaperByPublicToken, getQuestionsByPaperId } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let token = searchParams.get('token');

  if (!token) {
    token = 'sap-abap-assessment-01';
  }

  let paper = getQuestionPaperByPublicToken(token);
  if (!paper) {
    // If not found by token, try paper id 1 or first published
    paper = getQuestionPaperByPublicToken('sap-abap-assessment-01');
  }
  if (!paper) {
    return NextResponse.json({ error: 'Assessment paper not found' }, { status: 404 });
  }

  if (paper.status !== 'Published') {
    return NextResponse.json(
      { error: 'This assessment is currently unavailable.', status: paper.status },
      { status: 403 }
    );
  }

  const rawQuestions = getQuestionsByPaperId(paper.id);
  // Never expose correct_answer or explanation to candidate front-end
  const questions = rawQuestions.map((q) => ({
    id: q.id,
    question: q.question_text,
    marks: q.marks,
    options: [
      { key: 'A', text: q.option_a },
      { key: 'B', text: q.option_b },
      { key: 'C', text: q.option_c },
      { key: 'D', text: q.option_d },
    ],
  }));

  return NextResponse.json({
    questionPaper: {
      id: paper.id,
      title: paper.title,
      description: paper.description,
      category: paper.category,
      duration_minutes: paper.duration_minutes,
      passing_marks: paper.passing_marks,
      max_marks: paper.max_marks,
      total_questions: questions.length,
      public_token: paper.public_token,
    },
    questions,
  });
}
