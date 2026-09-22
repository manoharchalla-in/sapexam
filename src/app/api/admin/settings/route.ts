import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { getPortalSettings, updatePortalSettings } from '@/lib/db';

export async function GET() {
  try {
    const settings = getPortalSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await isAdminAuthenticated();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const settings = body.settings || body;
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 });
    }

    updatePortalSettings(settings);
    const updated = getPortalSettings();
    return NextResponse.json({ success: true, settings: updated, message: 'Settings saved successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update settings' }, { status: 500 });
  }
}
