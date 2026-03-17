import { NextRequest, NextResponse } from 'next/server';

const MAX_URLS = 100;
const MAX_CHILD_SITEMAPS = 3;

function extractLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc[^>]*>([\s\S]*?)<\/loc>/g)].map(m => m[1].trim());
}

async function fetchXml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SEO-Audit-Tool/1.0 (sitemap-crawler)' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let url: string;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return NextResponse.json({ error: 'URL must use http or https' }, { status: 400 });
  }

  const xml = await fetchXml(url);
  if (!xml) {
    return NextResponse.json({ error: `Could not fetch sitemap from ${url}` }, { status: 400 });
  }

  let urls: string[];

  if (xml.includes('<sitemapindex')) {
    // Sitemap index — fetch child sitemaps
    const childSitemapUrls = extractLocs(xml);
    const chunks = await Promise.all(
      childSitemapUrls.slice(0, MAX_CHILD_SITEMAPS).map(async (childUrl) => {
        const childXml = await fetchXml(childUrl);
        return childXml ? extractLocs(childXml) : [];
      })
    );
    urls = chunks.flat();
  } else {
    urls = extractLocs(xml);
  }

  // Keep only valid http(s) URLs and deduplicate
  const validUrls = [...new Set(
    urls.filter(u => { try { const p = new URL(u); return ['http:', 'https:'].includes(p.protocol); } catch { return false; } })
  )];

  return NextResponse.json({
    urls: validUrls.slice(0, MAX_URLS),
    total: validUrls.length,
    truncated: validUrls.length > MAX_URLS,
  });
}
