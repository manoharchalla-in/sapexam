import { NextRequest, NextResponse } from 'next/server';
import {
  getCollegeById,
  getExamsByCollegeId,
  createCollegeExam,
  updateCollegeExam,
  deleteCollegeExam,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const exams = getExamsByCollegeId(collegeId);

    return NextResponse.json({
      success: true,
      college,
      exams,
      total: exams.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Error fetching exams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, message: 'Exam Name is required' }, { status: 400 });
    }

    const exam = createCollegeExam({
      college_id: collegeId,
      name: body.name.trim(),
      code: body.code?.trim(),
      subject: body.subject?.trim() || 'SAP ABAP',
      description: body.description || '',
      duration_minutes: parseInt(body.duration_minutes || '30', 10),
      start_time: body.start_time || '',
      end_time: body.end_time || '',
      total_questions: parseInt(body.total_questions || '10', 10),
      total_marks: parseFloat(body.total_marks || '10'),
      passing_marks: parseFloat(body.passing_marks || '5'),
      instructions: body.instructions || 'Answer all questions within the allocated time.',
      status: body.status || 'Draft',
    });

    return NextResponse.json({
      success: true,
      message: 'Exam created successfully with Exam Paper & Results folders',
      exam,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Error creating exam' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    if (!body.examId) {
      return NextResponse.json({ success: false, message: 'Exam ID is required' }, { status: 400 });
    }

    const updated = updateCollegeExam(body.examId, {
      name: body.name,
      code: body.code,
      subject: body.subject,
      description: body.description,
      duration_minutes: body.duration_minutes !== undefined ? parseInt(body.duration_minutes, 10) : undefined,
      start_time: body.start_time,
      end_time: body.end_time,
      total_questions: body.total_questions !== undefined ? parseInt(body.total_questions, 10) : undefined,
      total_marks: body.total_marks !== undefined ? parseFloat(body.total_marks) : undefined,
      passing_marks: body.passing_marks !== undefined ? parseFloat(body.passing_marks) : undefined,
      instructions: body.instructions,
      status: body.status,
    });

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Exam not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Exam details updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Error updating exam' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const examIdStr = searchParams.get('examId');
    const examId = parseInt(examIdStr || '', 10);
    if (isNaN(examId)) {
      return NextResponse.json({ success: false, message: 'Valid Exam ID is required' }, { status: 400 });
    }

    const deleted = deleteCollegeExam(examId);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Exam not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Exam folder deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Error deleting exam' }, { status: 500 });
  }
}
