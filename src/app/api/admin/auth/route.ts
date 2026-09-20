import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SECRET_TOKEN, getAdminCookieHeader, getAdminSession } from '@/lib/auth';
import { getTrainerByUsername } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const expectedUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // 1. Check Super Admin
    if (cleanUser === expectedUsername && cleanPass === expectedPassword) {
      const response = NextResponse.json({
        success: true,
        role: 'super_admin',
        redirect: '/admin',
        message: 'Super Admin Authenticated successfully',
      });
      response.headers.set('Set-Cookie', getAdminCookieHeader(ADMIN_SECRET_TOKEN));
      return response;
    }

    // 2. Check Dynamic Trainer Account
    const trainer = getTrainerByUsername(cleanUser);
    if (trainer && trainer.password === cleanPass) {
      const trainerToken = `trainer_token_${trainer.username}`;
      const response = NextResponse.json({
        success: true,
        role: 'trainer',
        username: trainer.username,
        displayName: trainer.display_name,
        redirect: `/admin/trainer/${trainer.username}`,
        message: `Trainer ${trainer.display_name} Authenticated successfully`,
      });
      response.headers.set('Set-Cookie', getAdminCookieHeader(trainerToken));
      return response;
    }

    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.headers.set('Set-Cookie', getAdminCookieHeader(null));
  return response;
}

export async function GET() {
  const session = await getAdminSession();
  return NextResponse.json({
    authenticated: session !== null,
    session,
  });
}
