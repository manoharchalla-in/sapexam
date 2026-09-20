import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'sapexam.db');
const db = new Database(dbPath);

export async function GET() {
  try {
    const totalRow = db.prepare(`SELECT COUNT(*) as count, AVG(score) as avgScore FROM assessment_results`).get() as any;
    const passedRow = db.prepare(`SELECT COUNT(*) as count FROM assessment_results WHERE score >= 5`).get() as any;

    const totalAttempts = totalRow?.count || 0;
    const averageScore = Math.round((totalRow?.avgScore || 0) * 10) / 10;
    const passedCount = passedRow?.count || 0;
    const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;

    return NextResponse.json({
      analytics: {
        totalAttempts,
        averageScore,
        passedCount,
        passRate,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
