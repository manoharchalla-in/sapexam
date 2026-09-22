import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import {
  getAllExamTemplates,
  getExamTemplateById,
  createExamTemplate,
  updateExamTemplate,
  deleteExamTemplate,
  createQuestionPaperFromTemplate,
} from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const template = getExamTemplateById(parseInt(id, 10));
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ template });
    }

    const templates = getAllExamTemplates();
    return NextResponse.json({ templates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch templates' }, { status: 500 });
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

    if (action === 'generate_paper') {
      const { templateId, title, description, category, duration_minutes, passing_marks, status } = body;
      if (!templateId) {
        return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
      }
      const paper = createQuestionPaperFromTemplate(parseInt(templateId, 10), {
        title,
        description,
        category,
        duration_minutes: duration_minutes ? parseInt(duration_minutes, 10) : undefined,
        passing_marks: passing_marks ? parseFloat(passing_marks) : undefined,
        status: status || 'Draft',
      });
      if (!paper) {
        return NextResponse.json({ error: 'Failed to generate question paper from template' }, { status: 404 });
      }
      return NextResponse.json({ success: true, questionPaper: paper, message: 'Question Paper successfully generated from template' });
    }

    // Default action: Create new Exam Template
    const { title, description, category, total_questions, duration_minutes, passing_marks, max_marks, difficulty, config_json } = body;
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Template title is required' }, { status: 400 });
    }

    const newTemplate = createExamTemplate({
      title: title.trim(),
      description,
      category: category || 'SAP ABAP',
      total_questions: total_questions ? parseInt(total_questions, 10) : 10,
      duration_minutes: duration_minutes ? parseInt(duration_minutes, 10) : 30,
      passing_marks: passing_marks ? parseFloat(passing_marks) : 5,
      max_marks: max_marks ? parseFloat(max_marks) : 10,
      difficulty: difficulty || 'Intermediate',
      config_json: typeof config_json === 'string' ? config_json : JSON.stringify(config_json || {}),
    });

    return NextResponse.json({ success: true, template: newTemplate, message: 'Template created successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
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
      return NextResponse.json({ error: 'Template id is required' }, { status: 400 });
    }

    const updated = updateExamTemplate(parseInt(id, 10), data);
    if (!updated) {
      return NextResponse.json({ error: 'Template not found or update failed' }, { status: 404 });
    }

    const template = getExamTemplateById(parseInt(id, 10));
    return NextResponse.json({ success: true, template, message: 'Template updated successfully' });
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
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template id is required' }, { status: 400 });
    }

    const deleted = deleteExamTemplate(parseInt(id, 10));
    if (!deleted) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Template deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Deletion failed' }, { status: 500 });
  }
}
