import { NextResponse } from 'next/server';

export async function GET() {
  const templates = [
    {
      id: 1,
      title: 'SAP ABAP Standard Technical Test',
      description: 'Default 10-question evaluation covering ABAP Syntax, SE11, SE38, Internal Tables.',
      category: 'SAP ABAP',
      total_questions: 10,
      duration_minutes: 30,
      passing_marks: 5,
      created_at: new Date().toISOString(),
    },
  ];
  return NextResponse.json({ templates });
}
