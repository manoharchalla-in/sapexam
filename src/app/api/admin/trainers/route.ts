import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { getAllTrainers, createTrainer, updateTrainerPassword, deleteTrainer } from '@/lib/db';

export async function GET() {
  try {
    const trainers = getAllTrainers();
    return NextResponse.json({
      trainers: trainers.map((t) => ({
        id: t.id,
        username: t.username,
        display_name: t.display_name,
        password: t.password,
        created_at: t.created_at,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch trainers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await isAdminAuthenticated();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { displayName, password } = await req.json();
    if (!displayName || !displayName.trim()) {
      return NextResponse.json({ error: 'Trainer name is required' }, { status: 400 });
    }

    const trainer = createTrainer(displayName, password || '123');
    return NextResponse.json({ success: true, trainer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create trainer' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await isAdminAuthenticated();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const updated = updateTrainerPassword(username, password);
    if (!updated) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update password' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await isAdminAuthenticated();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const deleted = deleteTrainer(username);
    if (!deleted) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Trainer deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete trainer' }, { status: 500 });
  }
}
