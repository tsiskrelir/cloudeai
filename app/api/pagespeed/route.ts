// app/api/pagespeed/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getPageSpeedInsights } from '@/lib/fetch/crawler';

export async function POST(request: NextRequest) {
  try {
    const { url, strategy = 'mobile' } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const result = await getPageSpeedInsights(url, strategy);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[PageSpeed]', error);
    return NextResponse.json({ error: 'PageSpeed analysis failed' }, { status: 500 });
  }
}
