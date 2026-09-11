import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const rawCountry = (
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-vercel-ip-country') ||
    ''
  ).trim().toUpperCase();

  // Validate ISO 3166-1 alpha-2 format
  const country = /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : null;

  return NextResponse.json({
    country,
    isIndia: country === 'IN'
  });
}
