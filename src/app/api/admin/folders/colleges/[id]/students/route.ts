import { NextRequest, NextResponse } from 'next/server';
import {
  getCollegeById,
  getStudentsByCollegeId,
  createCollegeStudent,
  updateCollegeStudent,
  deleteCollegeStudent,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const collegeId = parseInt(paramId, 10);
    if (isNaN(collegeId)) {
      return NextResponse.json({ success: false, message: 'Invalid College ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || 'all';
    const branch = searchParams.get('branch') || 'all';
    const year = searchParams.get('year') || 'all';

    const college = getCollegeById(collegeId);
    if (!college) {
      return NextResponse.json({ success: false, message: 'College not found' }, { status: 404 });
    }

    const students = getStudentsByCollegeId(collegeId, {
      search,
      department,
      branch,
      year,
    });

    return NextResponse.json({
      success: true,
      college,
      students,
      total: students.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Error fetching students' }, { status: 500 });
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
      return NextResponse.json({ success: false, message: 'Student Name is required' }, { status: 400 });
    }
    if (!body.roll_number || !body.roll_number.trim()) {
      return NextResponse.json({ success: false, message: 'Roll Number is required' }, { status: 400 });
    }
    if (!body.email || !body.email.trim()) {
      return NextResponse.json({ success: false, message: 'Email Address is required' }, { status: 400 });
    }

    const newStudent = createCollegeStudent({
      college_id: collegeId,
      name: body.name.trim(),
      roll_number: body.roll_number.trim(),
      registration_number: body.registration_number?.trim() || '',
      email: body.email.trim(),
      mobile: body.mobile?.trim() || '',
      department: body.department?.trim() || '',
      branch: body.branch?.trim() || '',
      year: body.year?.trim() || '',
      section: body.section?.trim() || '',
      gender: body.gender?.trim() || '',
      dob: body.dob?.trim() || '',
      username: body.username?.trim() || body.roll_number.trim(),
      password: body.password?.trim() || '123456',
    });

    return NextResponse.json({
      success: true,
      message: 'Student registered successfully in ' + college.name,
      student: newStudent,
    });
  } catch (error: any) {
    if (error?.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { success: false, message: 'A student with this Roll Number or Email already exists in this college' },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, message: error?.message || 'Error registering student' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    if (!body.studentId) {
      return NextResponse.json({ success: false, message: 'Student ID is required' }, { status: 400 });
    }

    const updated = updateCollegeStudent(body.studentId, {
      name: body.name,
      roll_number: body.roll_number,
      registration_number: body.registration_number,
      email: body.email,
      mobile: body.mobile,
      department: body.department,
      branch: body.branch,
      year: body.year,
      section: body.section,
      gender: body.gender,
      dob: body.dob,
      username: body.username,
      password_hash: body.password,
    });

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Student not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Student details updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Error updating student' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIdStr = searchParams.get('studentId');
    const studentId = parseInt(studentIdStr || '', 10);
    if (isNaN(studentId)) {
      return NextResponse.json({ success: false, message: 'Valid Student ID is required' }, { status: 400 });
    }

    const deleted = deleteCollegeStudent(studentId);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Student record deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Error deleting student' }, { status: 500 });
  }
}
