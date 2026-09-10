import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const country = (
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country-code') ||
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('x-real-ip-country') ||
    request.headers.get('geoip-country-code') ||
    ''
  ).toUpperCase();

  return NextResponse.json({
    country: country || null,
    isIndia: country === 'IN'
  });
}
