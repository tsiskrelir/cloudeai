import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// File-based persistent storage for shared audits.
// Works reliably in dev and traditional hosting; on Vercel /tmp survives
// across warm invocations (better than in-memory Maps which are per-import).
// For true production persistence, swap this module for Redis / Vercel KV / a DB.

const STORE_DIR = path.join(process.env.VERCEL ? '/tmp' : process.cwd(), '.shared-audits');
const MAX_ITEMS = 500;
const TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

async function ensureDir() {
  try {
    await fs.mkdir(STORE_DIR, { recursive: true });
  } catch {
    // directory already exists
  }
}

async function writeEntry(id: string, payload: unknown) {
  await ensureDir();
  const entry = { payload, createdAt: Date.now() };
  await fs.writeFile(path.join(STORE_DIR, `${id}.json`), JSON.stringify(entry), 'utf-8');
}

async function readEntry(id: string): Promise<{ payload: unknown; createdAt: number } | null> {
  try {
    const raw = await fs.readFile(path.join(STORE_DIR, `${id}.json`), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function cleanupExpired() {
  try {
    await ensureDir();
    const files = await fs.readdir(STORE_DIR);
    const now = Date.now();
    const entries: { file: string; createdAt: number }[] = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = await fs.readFile(path.join(STORE_DIR, file), 'utf-8');
        const data = JSON.parse(raw);
        if (now - data.createdAt > TTL_MS) {
          await fs.unlink(path.join(STORE_DIR, file));
        } else {
          entries.push({ file, createdAt: data.createdAt });
        }
      } catch {
        // Remove corrupted files
        try { await fs.unlink(path.join(STORE_DIR, file)); } catch { /* ignore */ }
      }
    }

    // Enforce max items limit
    if (entries.length > MAX_ITEMS) {
      entries.sort((a, b) => a.createdAt - b.createdAt);
      const toRemove = entries.length - MAX_ITEMS;
      for (let i = 0; i < toRemove; i++) {
        try { await fs.unlink(path.join(STORE_DIR, entries[i].file)); } catch { /* ignore */ }
      }
    }
  } catch {
    // If cleanup fails, continue silently
  }
}

export async function POST(request: NextRequest) {
  try {
    const { audit } = await request.json();

    if (!audit || typeof audit !== 'object') {
      return NextResponse.json({ error: 'Audit payload is required' }, { status: 400 });
    }

    // Run cleanup in background (don't block the response)
    cleanupExpired();

    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    await writeEntry(id, audit);

    return NextResponse.json({ id });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: 'Failed to create share link', details }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Share id is required' }, { status: 400 });
    }

    // Sanitize id to prevent path traversal
    const safeId = id.replace(/[^a-zA-Z0-9]/g, '');
    if (!safeId) {
      return NextResponse.json({ error: 'Invalid share id' }, { status: 400 });
    }

    const entry = await readEntry(safeId);
    if (!entry) {
      return NextResponse.json({ error: 'Shared audit not found or expired' }, { status: 404 });
    }

    // Check TTL
    if (Date.now() - entry.createdAt > TTL_MS) {
      // Expired — clean up and return 404
      try { await fs.unlink(path.join(STORE_DIR, `${safeId}.json`)); } catch { /* ignore */ }
      return NextResponse.json({ error: 'Shared audit has expired' }, { status: 404 });
    }

    return NextResponse.json({ audit: entry.payload });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: 'Failed to load shared audit', details }, { status: 500 });
  }
}
