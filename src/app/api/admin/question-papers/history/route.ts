import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { getQuestionPaperHistory, getQuestionPaperAttempts, getQuestionPaperById } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await isAdminAuthenticated();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const paperId = searchParams.get('paperId');

  if (!paperId) {
    return NextResponse.json({ error: 'paperId is required' }, { status: 400 });
  }

  const id = parseInt(paperId, 10);
  const paper = getQuestionPaperById(id);
  if (!paper) {
    return NextResponse.json({ error: 'Question paper not found' }, { status: 404 });
  }

  const history = getQuestionPaperHistory(id);
  const attempts = getQuestionPaperAttempts(id);

  const totalAttempts = attempts.length;
  const passedAttempts = attempts.filter((a) => a.score >= paper.passing_marks).length;
  const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
  const totalScore = attempts.reduce((acc, a) => acc + a.score, 0);
  const avgScore = totalAttempts > 0 ? Number((totalScore / totalAttempts).toFixed(1)) : 0;
  const highestScore = attempts.reduce((max, a) => Math.max(max, a.score), 0);

  return NextResponse.json({
    paper,
    history,
    attempts,
    stats: {
      totalAttempts,
      passedAttempts,
      passRate,
      avgScore,
      highestScore,
    },
  });
}
