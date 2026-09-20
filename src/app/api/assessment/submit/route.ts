import { NextRequest, NextResponse } from 'next/server';
import { validateCandidateInput } from '@/lib/validation';
import {
  saveAssessmentResult,
  getAttemptNumberForEmail,
  getRecordBySessionId,
  getQuestionPaperById,
  getQuestionsByPaperId,
} from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      candidate_name,
      candidate_email,
      campus_name,
      trainer_name,
      question_paper_id,
      answers,
      session_id,
    } = body;

    const validation = validateCandidateInput(candidate_name, candidate_email);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid candidate details', details: validation },
        { status: 400 }
      );
    }

    if (session_id) {
      const existing = getRecordBySessionId(session_id);
      if (existing) {
        return NextResponse.json({
          id: existing.id,
          score: existing.score,
          total_questions: existing.total_questions,
          percentage: existing.percentage,
          correct_answers: existing.correct_answers,
          incorrect_answers: existing.incorrect_answers,
          unanswered_answers: existing.unanswered_answers,
          submitted_at: existing.submitted_at,
          alreadySubmitted: true,
        });
      }
    }

    let paperId = question_paper_id ? parseInt(String(question_paper_id), 10) : 1;
    let paper = getQuestionPaperById(paperId);
    if (!paper) {
      paperId = 1;
      paper = getQuestionPaperById(1);
    }

    const paperQuestions = getQuestionsByPaperId(paperId);
    const userAnswers: Record<string, string> = answers && typeof answers === 'object' ? answers : {};

    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    paperQuestions.forEach((q) => {
      const qMarks = q.marks || 1;
      maxScore += qMarks;

      const chosen = (userAnswers[String(q.id)] || userAnswers[q.id] || '').trim().toUpperCase();
      if (!chosen) {
        unansweredCount++;
      } else if (chosen === q.correct_answer.trim().toUpperCase()) {
        correctCount++;
        totalScore += qMarks;
      } else {
        incorrectCount++;
      }
    });

    const totalQuestions = paperQuestions.length || 10;
    const finalMaxScore = maxScore || totalQuestions;
    const percentage = Math.round((totalScore / finalMaxScore) * 100 * 100) / 100;
    const attemptNumber = getAttemptNumberForEmail(validation.cleanEmail, paperId);
    const resultId = `ast_${crypto.randomBytes(8).toString('hex')}`;
    const submittedAt = new Date().toISOString();

    const savedRecord = saveAssessmentResult({
      id: resultId,
      candidate_name: validation.cleanName,
      candidate_email: validation.cleanEmail,
      campus_name: campus_name || '',
      trainer_name: trainer_name || '',
      question_paper_id: paperId,
      question_paper_title: paper?.title || 'SAP ABAP Assessment',
      attempt_number: attemptNumber,
      score: totalScore,
      total_questions: totalQuestions,
      percentage,
      correct_answers: correctCount,
      incorrect_answers: incorrectCount,
      unanswered_answers: unansweredCount,
      answers: JSON.stringify(userAnswers),
      session_id: session_id || undefined,
      submitted_at: submittedAt,
    });

    return NextResponse.json({
      id: savedRecord.id,
      score: savedRecord.score,
      total_questions: savedRecord.total_questions,
      percentage: savedRecord.percentage,
      correct_answers: savedRecord.correct_answers,
      incorrect_answers: savedRecord.incorrect_answers,
      unanswered_answers: savedRecord.unanswered_answers,
      submitted_at: savedRecord.submitted_at,
    });
  } catch (err: any) {
    console.error('Assessment submission error:', err);
    return NextResponse.json(
      { error: 'Failed to process assessment submission. Please try again.' },
      { status: 500 }
    );
  }
}
