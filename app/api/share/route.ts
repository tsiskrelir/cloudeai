import { NextRequest, NextResponse } from 'next/server';

const sharedAudits = new Map<string, { payload: unknown; createdAt: number }>();
const MAX_ITEMS = 500;
const TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function cleanupExpired() {
  const now = Date.now();
  for (const [key, value] of sharedAudits.entries()) {
    if (now - value.createdAt > TTL_MS) {
      sharedAudits.delete(key);
    }
  }
  if (sharedAudits.size > MAX_ITEMS) {
    const sorted = Array.from(sharedAudits.entries()).sort((a, b) => a[1].createdAt - b[1].createdAt);
    const toRemove = sharedAudits.size - MAX_ITEMS;
    for (let i = 0; i < toRemove; i++) {
      sharedAudits.delete(sorted[i][0]);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { audit } = await request.json();

    if (!audit || typeof audit !== 'object') {
      return NextResponse.json({ error: 'Audit payload is required' }, { status: 400 });
    }

    cleanupExpired();

    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    sharedAudits.set(id, { payload: audit, createdAt: Date.now() });

    return NextResponse.json({ id });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: 'Failed to create share link', details }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    cleanupExpired();
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Share id is required' }, { status: 400 });
    }

    const shared = sharedAudits.get(id);
    if (!shared) {
      return NextResponse.json({ error: 'Shared audit not found or expired' }, { status: 404 });
    }

    return NextResponse.json({ audit: shared.payload });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: 'Failed to load shared audit', details }, { status: 500 });
  }
}
