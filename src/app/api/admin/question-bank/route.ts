import { NextRequest, NextResponse } from 'next/server';
import { getQuestionBankList, saveQuestionToBank } from '@/lib/db';
import Database from 'better-sqlite3';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const topic = searchParams.get('topic') || searchParams.get('typeFilter') || 'all';

    const questions = getQuestionBankList({
      search: search || undefined,
      topic: topic !== 'all' ? topic : undefined,
    });

    return NextResponse.json({ questions, total: questions.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = saveQuestionToBank({
      question_text: body.question_text,
      question_type: body.question_type || 'Single Choice',
      option_a: body.option_a || '',
      option_b: body.option_b || '',
      option_c: body.option_c || '',
      option_d: body.option_d || '',
      correct_answer: body.correct_answer || 'A',
      marks: body.marks || 1,
      difficulty: body.difficulty || 'Medium',
      topic: body.topic || 'SAP ABAP Fundamentals',
      explanation: body.explanation || '',
    });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'sapexam.db');
    const db = new Database(dbPath);
    const { id } = await req.json();
    db.prepare(`UPDATE question_bank SET status = 'Archived' WHERE id = ?`).run(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
