import { NextResponse } from 'next/server';
import { listPublicRohByYear } from '@/server/public/queries/rollOfHonourPublic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearRaw = searchParams.get('year');
  const currentYear = new Date().getFullYear();

  const year = Number(yearRaw);
  const isValidYear =
    Number.isInteger(year) && Number.isFinite(year) && year >= 1960 && year <= currentYear + 10;

  if (!isValidYear) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
  }

  const data = await listPublicRohByYear({ year });
  return NextResponse.json({ year, entries: data.entries, nextCursor: data.nextCursor });
}
