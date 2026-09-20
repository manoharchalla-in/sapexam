import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import {
  getAllQuestionPapers,
  createQuestionPaper,
  updateQuestionPaper,
  deleteQuestionPaper,
  getQuestionPaperById,
  getQuestionsByPaperId,
  saveQuestionForPaper,
  deleteQuestion,
  reorderQuestions,
} from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const qp = getQuestionPaperById(parseInt(id, 10));
      if (!qp) {
        return NextResponse.json({ error: 'Question Paper not found' }, { status: 404 });
      }
      const questions = getQuestionsByPaperId(qp.id);
      return NextResponse.json({ questionPaper: qp, questions });
    }

    const papers = getAllQuestionPapers();
    return NextResponse.json({ questionPapers: papers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch question papers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await isAdminAuthenticated();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'create_paper') {
      const { title, description, category, duration_minutes, passing_marks, status } = body;
      if (!title || !title.trim()) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      }
      const paper = createQuestionPaper({
        title,
        description,
        category,
        duration_minutes: duration_minutes ? parseInt(duration_minutes, 10) : 30,
        passing_marks: passing_marks ? parseFloat(passing_marks) : 5,
        status: status || 'Draft',
      });
      return NextResponse.json({ success: true, questionPaper: paper });
    }

    if (action === 'save_question') {
      const { id, question_paper_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_answer, marks, explanation, question_order } = body;

      if (!question_paper_id || !question_text || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
        return NextResponse.json({ error: 'Missing required question fields' }, { status: 400 });
      }

      const question = saveQuestionForPaper({
        id: id ? parseInt(id, 10) : undefined,
        question_paper_id: parseInt(question_paper_id, 10),
        question_text,
        question_type: question_type || 'Single Choice',
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        marks: marks ? parseFloat(marks) : 1,
        explanation: explanation || '',
        question_order: question_order ? parseInt(question_order, 10) : 1,
      });

      return NextResponse.json({ success: true, question });
    }

    if (action === 'reorder_questions') {
      const { paperId, questionIds } = body;
      if (!paperId || !Array.isArray(questionIds)) {
        return NextResponse.json({ error: 'Invalid reorder payload' }, { status: 400 });
      }
      reorderQuestions(parseInt(paperId, 10), questionIds.map((q) => parseInt(q, 10)));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Action failed' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await isAdminAuthenticated();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Question paper ID is required' }, { status: 400 });
    }

    // Validation before Publish
    if (data.status === 'Published') {
      const questions = getQuestionsByPaperId(parseInt(id, 10));
      if (questions.length === 0) {
        return NextResponse.json({ error: 'Cannot publish question paper with 0 questions.' }, { status: 400 });
      }
      for (let idx = 0; idx < questions.length; idx++) {
        const q = questions[idx];
        if (!q.question_text || !q.question_text.trim()) {
          return NextResponse.json({ error: `Question ${idx + 1} text cannot be empty.` }, { status: 400 });
        }
        if (!q.option_a || !q.option_b || !q.option_c || !q.option_d) {
          return NextResponse.json({ error: `Question ${idx + 1} has incomplete options.` }, { status: 400 });
        }
        if (!['A', 'B', 'C', 'D'].includes(q.correct_answer.toUpperCase())) {
          return NextResponse.json({ error: `Question ${idx + 1} does not have a valid correct answer.` }, { status: 400 });
        }
      }
    }

    const updated = updateQuestionPaper(parseInt(id, 10), data);
    if (!updated) {
      return NextResponse.json({ error: 'Question paper not found' }, { status: 404 });
    }

    const qp = getQuestionPaperById(parseInt(id, 10));
    return NextResponse.json({ success: true, questionPaper: qp });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await isAdminAuthenticated();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, type, paperId } = body;

    if (type === 'question') {
      if (!id || !paperId) {
        return NextResponse.json({ error: 'Question ID and Paper ID required' }, { status: 400 });
      }
      deleteQuestion(parseInt(id, 10), parseInt(paperId, 10));
      return NextResponse.json({ success: true, message: 'Question deleted' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Question paper ID required' }, { status: 400 });
    }

    const deleted = deleteQuestionPaper(parseInt(id, 10));
    if (!deleted) {
      return NextResponse.json({ error: 'Question paper not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Question paper deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Deletion failed' }, { status: 500 });
  }
}
