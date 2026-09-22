import { NextRequest, NextResponse } from 'next/server';
import { getCollegeBySlug, createCollegeStudent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ college: string }> }
) {
  try {
    const { college: collegeSlug } = await params;
    const college = getCollegeBySlug(collegeSlug);

    if (!college) {
      return NextResponse.json({ success: false, message: 'Institutional registration link not found or invalid' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      college: {
        id: college.id,
        folder_id: college.folder_id,
        name: college.name,
        code: college.code,
        description: college.description,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Error fetching institution' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ college: string }> }
) {
  try {
    const { college: collegeSlug } = await params;
    const college = getCollegeBySlug(collegeSlug);

    if (!college) {
      return NextResponse.json({ success: false, message: 'Institutional registration link not found' }, { status: 404 });
    }

    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, message: 'Student Full Name is required' }, { status: 400 });
    }
    if (!body.roll_number || !body.roll_number.trim()) {
      return NextResponse.json({ success: false, message: 'Roll Number is required' }, { status: 400 });
    }
    if (!body.email || !body.email.trim()) {
      return NextResponse.json({ success: false, message: 'Student Email Address is required' }, { status: 400 });
    }

    const student = createCollegeStudent({
      college_id: college.id,
      name: body.name.trim(),
      roll_number: body.roll_number.trim(),
      registration_number: body.registration_number?.trim() || '',
      email: body.email.trim(),
      mobile: body.mobile?.trim() || '',
      department: body.department?.trim() || 'Computer Science',
      branch: body.branch?.trim() || 'CSE',
      year: body.year?.trim() || '4th Year',
      section: body.section?.trim() || 'A',
      gender: body.gender?.trim() || 'Male',
      dob: body.dob?.trim() || '',
      username: body.username?.trim() || body.roll_number.trim(),
      password: body.password?.trim() || '123',
    });

    return NextResponse.json({
      success: true,
      message: `Registration successful! Your student credentials have been registered with ${college.name}.`,
      student: {
        id: student.id,
        name: student.name,
        roll_number: student.roll_number,
        email: student.email,
        college_name: college.name,
      },
    });
  } catch (error: any) {
    if (error?.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        {
          success: false,
          message: 'A candidate with this Roll Number or Email is already registered under this institution.',
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, message: error?.message || 'Error processing student registration' }, { status: 500 });
  }
}
