// app/api/crawl/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { crawlSite, parseSitemap, validateRobotsTxt } from '@/lib/fetch/crawler';
import { fetchRobotsTxt } from '@/lib/fetch/fetchHtml';

export async function POST(request: NextRequest) {
  try {
    const { url, maxPages = 30, maxDepth = 3 } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

    // Fetch and validate robots.txt
    const robotsTxt = await fetchRobotsTxt(baseUrl);
    const robotsValidation = robotsTxt ? validateRobotsTxt(robotsTxt) : null;

    // Parse sitemap
    const sitemapData = await parseSitemap(baseUrl, 1000);

    // Crawl site
    const crawlResult = await crawlSite(url, Math.min(maxPages, 50), Math.min(maxDepth, 4));

    return NextResponse.json({
      crawl: crawlResult,
      sitemap: sitemapData,
      robots: robotsValidation ? {
        content: robotsTxt,
        validation: {
          isValid: robotsValidation.isValid,
          errors: robotsValidation.errors,
          warnings: robotsValidation.warnings,
          sitemaps: robotsValidation.sitemaps,
          blocksGooglebot: robotsValidation.blocksGooglebot,
          blocksAll: robotsValidation.blocksAll,
          rules: robotsValidation.rules.map(r => ({
            userAgent: r.userAgent,
            rules: r.rules,
            crawlDelay: r.crawlDelay
          }))
        }
      } : null
    });
  } catch (error) {
    console.error('[Crawl]', error);
    return NextResponse.json({ error: 'Crawl failed' }, { status: 500 });
  }
}
