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

    // 1. Check Specific Default Super Admin Accounts (nani, nokaraju, dakshiyani, apparaju)
    const defaultAccounts = ['nani', 'nokaraju', 'dakshiyani', 'apparaju'];
    if (defaultAccounts.includes(cleanUser)) {
      const validPasswords = ['123456', 'admin123', '123', `${cleanUser}123`, `${cleanUser}1234`];
      if (validPasswords.includes(cleanPass) || cleanPass === expectedPassword) {
        const token = `admin_token_${cleanUser}`;
        const displayName = cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1);
        const response = NextResponse.json({
          success: true,
          role: 'super_admin',
          username: cleanUser,
          displayName,
          panelTitle: `${displayName}'s Admin Panel`,
          redirect: '/admin',
          message: `${displayName}'s Admin Authenticated successfully`,
        });
        response.headers.set('Set-Cookie', getAdminCookieHeader(token));
        return response;
      }
    }

    // 2. Check Standard Super Admin
    if (cleanUser === expectedUsername && (cleanPass === expectedPassword || cleanPass === '123' || cleanPass === '123456')) {
      const response = NextResponse.json({
        success: true,
        role: 'super_admin',
        username: 'admin',
        displayName: 'Super Admin',
        panelTitle: 'Main Admin Panel',
        redirect: '/admin',
        message: 'Super Admin Authenticated successfully',
      });
      response.headers.set('Set-Cookie', getAdminCookieHeader('admin_token_admin'));
      return response;
    }

    // 3. Check Dynamic Trainer Account
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
