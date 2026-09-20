import { NextResponse } from 'next/server';

export async function GET() {
  const attempts: any[] = [];
  return NextResponse.json({ attempts });
}
