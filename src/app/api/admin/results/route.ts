import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { getAdminResults, getAdminDashboardStats } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await isAdminAuthenticated();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  const search = searchParams.get('search') || undefined;
  const trainerFilter = searchParams.get('trainerFilter') || 'all';
  const campusFilter = searchParams.get('campusFilter') || 'all';
  const paperFilter = searchParams.get('paperFilter') || 'all';
  const scoreFilter = searchParams.get('scoreFilter') || 'all';
  const percentageFilter = searchParams.get('percentageFilter') || 'all';
  const dateFilter = searchParams.get('dateFilter') || undefined;
  const sortBy = (searchParams.get('sortBy') as any) || 'date';
  const sortOrder = (searchParams.get('sortOrder') as any) || 'desc';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const data = getAdminResults({
    search,
    trainerFilter,
    campusFilter,
    paperFilter,
    scoreFilter,
    percentageFilter,
    dateFilter,
    sortBy,
    sortOrder,
    page,
    limit,
  });

  const stats = getAdminDashboardStats(trainerFilter, campusFilter);

  return NextResponse.json({
    ...data,
    stats,
  });
}
