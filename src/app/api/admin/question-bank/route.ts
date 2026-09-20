import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'sapexam.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS question_bank (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'Single Choice',
    configuration TEXT DEFAULT '{}',
    correct_answer TEXT NOT NULL,
    marks REAL NOT NULL DEFAULT 1,
    negative_marks REAL DEFAULT 0,
    difficulty TEXT DEFAULT 'Medium',
    topic TEXT DEFAULT 'General',
    explanation TEXT DEFAULT '',
    status TEXT DEFAULT 'Active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const typeFilter = searchParams.get('typeFilter') || 'all';

    let sql = `SELECT * FROM question_bank WHERE status = 'Active'`;
    const params: any[] = [];

    if (search) {
      sql += ` AND question_text LIKE ?`;
      params.push(`%${search}%`);
    }

    if (typeFilter !== 'all') {
      sql += ` AND question_type = ?`;
      params.push(typeFilter);
    }

    sql += ` ORDER BY id DESC`;

    const questions = db.prepare(sql).all(...params);
    return NextResponse.json({ questions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      question_text,
      question_type,
      configuration,
      correct_answer,
      marks,
      negative_marks,
      explanation,
    } = body;

    const now = new Date().toISOString();
    const configStr = typeof configuration === 'object' ? JSON.stringify(configuration) : configuration || '{}';

    const stmt = db.prepare(`
      INSERT INTO question_bank (question_text, question_type, configuration, correct_answer, marks, negative_marks, explanation, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const res = stmt.run(
      question_text,
      question_type || 'Single Choice',
      configStr,
      correct_answer || 'A',
      marks || 1,
      negative_marks || 0,
      explanation || '',
      now,
      now
    );

    return NextResponse.json({ success: true, id: res.lastInsertRowid });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    db.prepare(`UPDATE question_bank SET status = 'Archived' WHERE id = ?`).run(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
