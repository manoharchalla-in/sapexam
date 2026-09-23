import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, getAdminCookieHeader, DEFAULT_ADMIN_ACCOUNTS } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUsername } = await req.json();
    const cleanTarget = (targetUsername || '').trim().toLowerCase();

    if (!cleanTarget) {
      return NextResponse.json({ error: 'Target admin username required' }, { status: 400 });
    }

    const adminConfig = DEFAULT_ADMIN_ACCOUNTS[cleanTarget] || {
      username: cleanTarget,
      displayName: cleanTarget.charAt(0).toUpperCase() + cleanTarget.slice(1),
      panelTitle: `${cleanTarget.charAt(0).toUpperCase() + cleanTarget.slice(1)}'s Admin Panel`,
      initials: cleanTarget.slice(0, 2).toUpperCase(),
    };

    const token = `admin_token_${cleanTarget}`;
    const response = NextResponse.json({
      success: true,
      switchedTo: cleanTarget,
      displayName: adminConfig.displayName,
      redirect: cleanTarget === 'admin' ? '/admin/superadmin' : '/admin',
      message: `Switched active workspace to ${adminConfig.displayName}`,
    });

    response.headers.set('Set-Cookie', getAdminCookieHeader(token));
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to switch workspace' }, { status: 500 });
  }
}
