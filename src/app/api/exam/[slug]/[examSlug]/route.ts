import { NextRequest, NextResponse } from 'next/server';
import {
  getExamByCollegeAndExamSlug,
  getQuestionsByExamId,
  getStudentByRollOrEmail,
  getStudentAttemptForExam,
  recordExamAttemptStart,
  submitCollegeExamAttempt,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; examSlug: string }> }
) {
  try {
    const { slug: collegeSlug, examSlug } = await params;
    const examWithCollege = getExamByCollegeAndExamSlug(collegeSlug, examSlug);

    if (!examWithCollege) {
      return NextResponse.json(
        { success: false, message: 'Assessment not found for the specified college and exam path' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      exam: {
        id: examWithCollege.id,
        name: examWithCollege.name,
        code: examWithCollege.code,
        subject: examWithCollege.subject,
        description: examWithCollege.description,
        college_id: examWithCollege.college.id,
        college_name: examWithCollege.college.name,
        college_code: examWithCollege.college.code,
        duration_minutes: examWithCollege.duration_minutes,
        total_questions: examWithCollege.total_questions,
        total_marks: examWithCollege.total_marks,
        passing_marks: examWithCollege.passing_marks,
        instructions: examWithCollege.instructions,
        status: examWithCollege.status,
        public_token: examWithCollege.public_token,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Error fetching exam' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; examSlug: string }> }
) {
  try {
    const { slug: collegeSlug, examSlug } = await params;
    const examWithCollege = getExamByCollegeAndExamSlug(collegeSlug, examSlug);

    if (!examWithCollege) {
      return NextResponse.json(
        { success: false, message: 'Assessment not found for this institution path' },
        { status: 404 }
      );
    }

    if (examWithCollege.status !== 'Published') {
      return NextResponse.json({
        success: false,
        message: `This assessment is currently in ${examWithCollege.status} mode and is not active for submissions.`,
      }, { status: 403 });
    }

    const body = await request.json();
    const action = body.action || 'verify_student';

    // ----------------------------------------------------
    // ACTION 1: VERIFY STUDENT CREDENTIALS
    // ----------------------------------------------------
    if (action === 'verify_student') {
      const username = (body.username || body.identifier || body.rollNumber || body.email || '').trim();
      const password = (body.password || '').trim();

      if (!username) {
        return NextResponse.json({
          success: false,
          message: 'Please enter your Username or Roll Number.',
        }, { status: 400 });
      }

      if (!password) {
        return NextResponse.json({
          success: false,
          message: 'Please enter your Exam Login Password.',
        }, { status: 400 });
      }

      // Check student in database belonging to THIS college ONLY
      const student = getStudentByRollOrEmail(examWithCollege.college_id, username);
      if (!student) {
        return NextResponse.json({
          success: false,
          notRegistered: true,
          message: `Candidate record not found for ${examWithCollege.college_name}. Please register your student credentials first using the college registration link.`,
        }, { status: 404 });
      }

      // Validate Password
      const validPassword = student.password_hash || '123456';
      if (password !== validPassword) {
        return NextResponse.json({
          success: false,
          message: 'Invalid Password. Please enter the correct password assigned to your student credentials.',
        }, { status: 401 });
      }

      // Check existing attempt
      const previousAttempt = getStudentAttemptForExam(examWithCollege.id, student.id);
      if (previousAttempt && previousAttempt.status === 'Submitted') {
        return NextResponse.json({
          success: false,
          alreadySubmitted: true,
          message: 'You have already completed this assessment. Multiple attempts are not permitted.',
          result: {
            score: previousAttempt.obtained_marks,
            totalMarks: previousAttempt.total_marks,
            percentage: previousAttempt.percentage,
            resultStatus: previousAttempt.result_status,
            submittedAt: previousAttempt.submitted_at,
          },
        }, { status: 403 });
      }

      return NextResponse.json({
        success: true,
        message: 'Candidate verified successfully',
        student: {
          id: student.id,
          name: student.name,
          roll_number: student.roll_number,
          email: student.email,
          department: student.department,
          branch: student.branch,
          year: student.year,
          section: student.section,
          college_id: student.college_id,
          college_name: student.college_name,
        },
      });
    }

    // ----------------------------------------------------
    // ACTION 2: START EXAM (Initialize session & send questions)
    // ----------------------------------------------------
    if (action === 'start_exam') {
      const studentId = parseInt(body.studentId, 10);
      if (isNaN(studentId)) {
        return NextResponse.json({ success: false, message: 'Valid Student ID required' }, { status: 400 });
      }

      // Start attempt record
      const attempt = recordExamAttemptStart({
        exam_id: examWithCollege.id,
        student_id: studentId,
        college_id: examWithCollege.college_id,
      });

      // Fetch questions and sanitize (strip out correct_answer and explanation)
      const rawQuestions = getQuestionsByExamId(examWithCollege.id);
      const safeQuestions = rawQuestions.map((q) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        marks: q.marks,
        order_index: q.order_index,
      }));

      return NextResponse.json({
        success: true,
        attemptId: attempt.id,
        startedAt: attempt.started_at,
        durationMinutes: examWithCollege.duration_minutes,
        questions: safeQuestions,
      });
    }

    // ----------------------------------------------------
    // ACTION 3: SUBMIT EXAM (Server-side evaluation)
    // ----------------------------------------------------
    if (action === 'submit_exam') {
      const { attemptId, answers, timeTakenSeconds } = body;
      if (!attemptId) {
        return NextResponse.json({ success: false, message: 'Attempt ID is required' }, { status: 400 });
      }

      const evaluatedAttempt = submitCollegeExamAttempt(
        attemptId,
        answers || {},
        timeTakenSeconds || 0
      );

      if (!evaluatedAttempt) {
        return NextResponse.json({ success: false, message: 'Failed to process evaluation' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Exam submitted and evaluated successfully',
        result: evaluatedAttempt,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action requested' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Error processing request' }, { status: 500 });
  }
}
