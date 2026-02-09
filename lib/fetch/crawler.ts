// lib/fetch/crawler.ts
// Multi-page crawler, PageSpeed API, and Robots.txt Validator

import { requestUrl } from './request';
import { JSDOM } from 'jsdom';

// ============================================
// ROBOTS.TXT VALIDATOR
// ============================================

export interface RobotsRule {
  userAgent: string;
  rules: { type: 'allow' | 'disallow'; path: string }[];
  crawlDelay?: number;
  sitemaps: string[];
}

export interface RobotsValidation {
  isValid: boolean;
  rules: RobotsRule[];
  errors: string[];
  warnings: string[];
  sitemaps: string[];
  blocksGooglebot: boolean;
  blocksAll: boolean;
  allowsPath: (path: string, userAgent?: string) => boolean;
}

export function validateRobotsTxt(content: string): RobotsValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rules: RobotsRule[] = [];
  const sitemaps: string[] = [];
  let isValid = true;

  if (!content || content.trim().length === 0) {
    return {
      isValid: false,
      rules: [],
      errors: ['robots.txt is empty'],
      warnings: [],
      sitemaps: [],
      blocksGooglebot: false,
      blocksAll: false,
      allowsPath: () => true
    };
  }

  const lines = content.split('\n').map(l => l.trim());
  let currentUserAgent: string | null = null;
  let currentRules: { type: 'allow' | 'disallow'; path: string }[] = [];
  let currentCrawlDelay: number | undefined;
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      errors.push(`Line ${lineNumber}: Invalid syntax - missing colon`);
      isValid = false;
      continue;
    }

    const directive = line.substring(0, colonIndex).trim().toLowerCase();
    const value = line.substring(colonIndex + 1).trim();

    switch (directive) {
      case 'user-agent':
        // Save previous user-agent rules
        if (currentUserAgent) {
          rules.push({
            userAgent: currentUserAgent,
            rules: [...currentRules],
            crawlDelay: currentCrawlDelay,
            sitemaps: []
          });
        }
        currentUserAgent = value || '*';
        currentRules = [];
        currentCrawlDelay = undefined;

        if (!value) {
          warnings.push(`Line ${lineNumber}: Empty User-agent value, treating as *`);
        }
        break;

      case 'disallow':
        if (!currentUserAgent) {
          errors.push(`Line ${lineNumber}: Disallow without User-agent`);
          isValid = false;
        } else {
          currentRules.push({ type: 'disallow', path: value });
        }
        break;

      case 'allow':
        if (!currentUserAgent) {
          errors.push(`Line ${lineNumber}: Allow without User-agent`);
          isValid = false;
        } else {
          currentRules.push({ type: 'allow', path: value });
        }
        break;

      case 'crawl-delay':
        const delay = parseFloat(value);
        if (isNaN(delay) || delay < 0) {
          warnings.push(`Line ${lineNumber}: Invalid Crawl-delay value: ${value}`);
        } else {
          currentCrawlDelay = delay;
          if (delay > 10) {
            warnings.push(`Line ${lineNumber}: Crawl-delay of ${delay}s may slow down indexing significantly`);
          }
        }
        break;

      case 'sitemap':
        if (!value.startsWith('http')) {
          errors.push(`Line ${lineNumber}: Sitemap must be absolute URL`);
        } else {
          sitemaps.push(value);
        }
        break;

      case 'host':
        warnings.push(`Line ${lineNumber}: Host directive is deprecated and not supported by most crawlers`);
        break;

      default:
        warnings.push(`Line ${lineNumber}: Unknown directive "${directive}"`);
    }
  }

  // Save last user-agent rules
  if (currentUserAgent) {
    rules.push({
      userAgent: currentUserAgent,
      rules: [...currentRules],
      crawlDelay: currentCrawlDelay,
      sitemaps: []
    });
  }

  // Check for common issues
  const hasWildcard = rules.some(r => r.userAgent === '*');
  if (!hasWildcard && rules.length > 0) {
    warnings.push('No rules for User-agent: * - other bots may have unrestricted access');
  }

  // Check if Googlebot is blocked
  const googlebotRules = rules.find(r => r.userAgent.toLowerCase().includes('googlebot'));
  const wildcardRules = rules.find(r => r.userAgent === '*');

  const blocksGooglebot = googlebotRules?.rules.some(r => r.type === 'disallow' && r.path === '/') ||
    (!googlebotRules && wildcardRules?.rules.some(r => r.type === 'disallow' && r.path === '/')) || false;

  const blocksAll = wildcardRules?.rules.some(r => r.type === 'disallow' && r.path === '/') || false;

  if (blocksAll) {
    warnings.push('robots.txt blocks all crawlers from the entire site (Disallow: /)');
  }

  // Function to check if a path is allowed
  const allowsPath = (path: string, userAgent: string = 'Googlebot'): boolean => {
    const applicableRules = rules.find(r =>
      r.userAgent.toLowerCase() === userAgent.toLowerCase() ||
      r.userAgent === '*'
    );

    if (!applicableRules) return true;

    // Check rules in order - more specific paths take precedence
    const matchingRules = applicableRules.rules
      .filter(r => path.startsWith(r.path) || r.path === '' || (r.path.endsWith('*') && path.startsWith(r.path.slice(0, -1))))
      .sort((a, b) => b.path.length - a.path.length);

    if (matchingRules.length === 0) return true;
    return matchingRules[0].type === 'allow';
  };

  return {
    isValid: isValid && errors.length === 0,
    rules,
    errors,
    warnings,
    sitemaps,
    blocksGooglebot,
    blocksAll,
    allowsPath
  };
}

// ============================================
// PAGESPEED INSIGHTS API
// ============================================

export interface PageSpeedResult {
  score: number;
  metrics: {
    fcp: number; // First Contentful Paint (ms)
    lcp: number; // Largest Contentful Paint (ms)
    cls: number; // Cumulative Layout Shift
    tbt: number; // Total Blocking Time (ms)
    si: number;  // Speed Index (ms)
    tti: number; // Time to Interactive (ms)
  };
  opportunities: {
    id: string;
    title: string;
    description: string;
    savings: string;
  }[];
  diagnostics: {
    id: string;
    title: string;
    description: string;
  }[];
  error?: string;
}

export async function getPageSpeedInsights(url: string, strategy: 'mobile' | 'desktop' = 'mobile'): Promise<PageSpeedResult> {
  try {
    // Use Google PageSpeed Insights API (free, no key required for basic usage)
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`PageSpeed API error: ${response.status}`);
    }

    const data = await response.json();

    const lighthouse = data.lighthouseResult;
    if (!lighthouse) {
      throw new Error('No Lighthouse data returned');
    }

    const audits = lighthouse.audits || {};
    const categories = lighthouse.categories || {};

    // Extract metrics
    const metrics = {
      fcp: Math.round(audits['first-contentful-paint']?.numericValue || 0),
      lcp: Math.round(audits['largest-contentful-paint']?.numericValue || 0),
      cls: parseFloat((audits['cumulative-layout-shift']?.numericValue || 0).toFixed(3)),
      tbt: Math.round(audits['total-blocking-time']?.numericValue || 0),
      si: Math.round(audits['speed-index']?.numericValue || 0),
      tti: Math.round(audits['interactive']?.numericValue || 0)
    };

    // Extract opportunities
    const opportunities: PageSpeedResult['opportunities'] = [];
    const opportunityIds = ['render-blocking-resources', 'unused-css-rules', 'unused-javascript', 'modern-image-formats', 'offscreen-images', 'unminified-css', 'unminified-javascript', 'efficient-animated-content', 'duplicated-javascript', 'legacy-javascript'];

    for (const id of opportunityIds) {
      const audit = audits[id];
      if (audit && audit.score !== null && audit.score < 1) {
        opportunities.push({
          id,
          title: audit.title || id,
          description: audit.description || '',
          savings: audit.displayValue || ''
        });
      }
    }

    // Extract diagnostics
    const diagnostics: PageSpeedResult['diagnostics'] = [];
    const diagnosticIds = ['dom-size', 'critical-request-chains', 'font-display', 'uses-passive-event-listeners', 'no-document-write', 'js-libraries', 'main-thread-tasks'];

    for (const id of diagnosticIds) {
      const audit = audits[id];
      if (audit && audit.score !== null && audit.score < 1) {
        diagnostics.push({
          id,
          title: audit.title || id,
          description: audit.description || ''
        });
      }
    }

    return {
      score: Math.round((categories.performance?.score || 0) * 100),
      metrics,
      opportunities: opportunities.slice(0, 5),
      diagnostics: diagnostics.slice(0, 5)
    };
  } catch (error) {
    return {
      score: 0,
      metrics: { fcp: 0, lcp: 0, cls: 0, tbt: 0, si: 0, tti: 0 },
      opportunities: [],
      diagnostics: [],
      error: error instanceof Error ? error.message : 'PageSpeed API failed'
    };
  }
}

// ============================================
// MULTI-PAGE CRAWLER
// ============================================

export interface CrawlPage {
  url: string;
  status: number;
  title: string;
  depth: number;
  internalLinks: number;
  externalLinks: number;
  wordCount: number;
  hasH1: boolean;
  hasMetaDesc: boolean;
  issues: string[];
  responseTime: number;
}

export interface CrawlResult {
  pages: CrawlPage[];
  totalPages: number;
  totalInternalLinks: number;
  totalExternalLinks: number;
  brokenLinks: { url: string; status: number; foundOn: string }[];
  redirects: { from: string; to: string; status: number }[];
  duplicateTitles: { title: string; urls: string[] }[];
  duplicateDescriptions: { description: string; urls: string[] }[];
  orphanPages: string[];
  deepPages: { url: string; depth: number }[];
  crawlTime: number;
  errors: string[];
}

export async function crawlSite(
  startUrl: string,
  maxPages: number = 50,
  maxDepth: number = 3,
  onProgress?: (current: number, total: number, url: string) => void
): Promise<CrawlResult> {
  const startTime = Date.now();
  const visited = new Set<string>();
  const queue: { url: string; depth: number; parent: string }[] = [];
  const pages: CrawlPage[] = [];
  const brokenLinks: CrawlResult['brokenLinks'] = [];
  const redirects: CrawlResult['redirects'] = [];
  const titleMap = new Map<string, string[]>();
  const descMap = new Map<string, string[]>();
  const linkedPages = new Set<string>();
  const errors: string[] = [];

  try {
    const parsedStart = new URL(startUrl);
    const baseHost = parsedStart.host;
    const baseProtocol = parsedStart.protocol;

    // Normalize URL
    const normalizeUrl = (url: string): string => {
      try {
        const parsed = new URL(url);
        // Remove trailing slash, hash, and common tracking params
        let normalized = `${parsed.protocol}//${parsed.host}${parsed.pathname}`.replace(/\/$/, '') || `${parsed.protocol}//${parsed.host}`;
        return normalized.toLowerCase();
      } catch {
        return url.toLowerCase();
      }
    };

    // Start with initial URL
    queue.push({ url: normalizeUrl(startUrl), depth: 0, parent: '' });

    while (queue.length > 0 && pages.length < maxPages) {
      const { url, depth, parent } = queue.shift()!;

      if (visited.has(url)) continue;
      if (depth > maxDepth) continue;

      visited.add(url);

      if (onProgress) {
        onProgress(pages.length + 1, maxPages, url);
      }

      try {
        const pageStart = Date.now();

        // First do a HEAD request to check status
        const headRes = await requestUrl({
          url,
          method: 'HEAD',
          timeout: 10000,
          followRedirects: false,
          readBody: false
        });

        // Handle redirects
        if (headRes.status >= 300 && headRes.status < 400) {
          const location = headRes.headers.location;
          if (location) {
            const redirectTo = location.startsWith('http') ? location : new URL(location, url).href;
            redirects.push({ from: url, to: redirectTo, status: headRes.status });

            // Follow redirect if same domain
            const redirectHost = new URL(redirectTo).host;
            if (redirectHost === baseHost && !visited.has(normalizeUrl(redirectTo))) {
              queue.push({ url: normalizeUrl(redirectTo), depth, parent });
            }
          }
          continue;
        }

        // Handle broken links
        if (headRes.status >= 400) {
          brokenLinks.push({ url, status: headRes.status, foundOn: parent });
          continue;
        }

        // Fetch full page
        const res = await requestUrl({
          url,
          method: 'GET',
          timeout: 15000,
          readBody: true
        });

        const responseTime = Date.now() - pageStart;
        const html = res.body || '';

        // Parse page
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        // Extract page info
        const title = doc.querySelector('title')?.textContent?.trim() || '';
        const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const h1 = doc.querySelector('h1');
        const bodyText = doc.body?.textContent || '';
        const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;

        // Track duplicates
        if (title) {
          if (!titleMap.has(title)) titleMap.set(title, []);
          titleMap.get(title)!.push(url);
        }
        if (metaDesc) {
          if (!descMap.has(metaDesc)) descMap.set(metaDesc, []);
          descMap.get(metaDesc)!.push(url);
        }

        // Extract links
        const links = doc.querySelectorAll('a[href]');
        let internalCount = 0;
        let externalCount = 0;

        links.forEach(link => {
          const href = link.getAttribute('href');
          if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

          try {
            const linkUrl = href.startsWith('http') ? href : new URL(href, url).href;
            const linkHost = new URL(linkUrl).host;

            if (linkHost === baseHost) {
              internalCount++;
              const normalizedLink = normalizeUrl(linkUrl);
              linkedPages.add(normalizedLink);

              // Add to queue if not visited
              if (!visited.has(normalizedLink) && depth + 1 <= maxDepth) {
                queue.push({ url: normalizedLink, depth: depth + 1, parent: url });
              }
            } else {
              externalCount++;
            }
          } catch {}
        });

        // Identify issues
        const issues: string[] = [];
        if (!title) issues.push('Missing title');
        else if (title.length < 30) issues.push('Title too short');
        else if (title.length > 60) issues.push('Title too long');
        if (!metaDesc) issues.push('Missing meta description');
        else if (metaDesc.length < 120) issues.push('Meta description too short');
        else if (metaDesc.length > 160) issues.push('Meta description too long');
        if (!h1) issues.push('Missing H1');
        if (wordCount < 300) issues.push('Thin content');
        if (responseTime > 3000) issues.push('Slow response');

        pages.push({
          url,
          status: res.status,
          title,
          depth,
          internalLinks: internalCount,
          externalLinks: externalCount,
          wordCount,
          hasH1: !!h1,
          hasMetaDesc: !!metaDesc,
          issues,
          responseTime
        });

      } catch (error) {
        errors.push(`Failed to crawl ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Find duplicate titles and descriptions
    const duplicateTitles = Array.from(titleMap.entries())
      .filter(([_, urls]) => urls.length > 1)
      .map(([title, urls]) => ({ title, urls }));

    const duplicateDescriptions = Array.from(descMap.entries())
      .filter(([_, urls]) => urls.length > 1)
      .map(([description, urls]) => ({ description, urls }));

    // Find orphan pages (in sitemap but not linked internally)
    const orphanPages = pages
      .filter(p => p.depth > 0 && !linkedPages.has(normalizeUrl(p.url)))
      .map(p => p.url);

    // Find deep pages
    const deepPages = pages
      .filter(p => p.depth > 2)
      .map(p => ({ url: p.url, depth: p.depth }));

    return {
      pages,
      totalPages: pages.length,
      totalInternalLinks: pages.reduce((sum, p) => sum + p.internalLinks, 0),
      totalExternalLinks: pages.reduce((sum, p) => sum + p.externalLinks, 0),
      brokenLinks,
      redirects,
      duplicateTitles,
      duplicateDescriptions,
      orphanPages,
      deepPages,
      crawlTime: Date.now() - startTime,
      errors
    };
  } catch (error) {
    return {
      pages: [],
      totalPages: 0,
      totalInternalLinks: 0,
      totalExternalLinks: 0,
      brokenLinks: [],
      redirects: [],
      duplicateTitles: [],
      duplicateDescriptions: [],
      orphanPages: [],
      deepPages: [],
      crawlTime: Date.now() - startTime,
      errors: [error instanceof Error ? error.message : 'Crawl failed']
    };
  }
}

// ============================================
// SITEMAP PARSER
// ============================================

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

export interface SitemapData {
  urls: SitemapUrl[];
  sitemapIndexUrls: string[];
  totalUrls: number;
  errors: string[];
}

export async function parseSitemap(baseUrl: string, maxUrls: number = 1000): Promise<SitemapData> {
  const urls: SitemapUrl[] = [];
  const sitemapIndexUrls: string[] = [];
  const errors: string[] = [];

  const sitemapLocations = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/sitemap/`,
    `${baseUrl}/sitemaps/sitemap.xml`
  ];

  for (const sitemapUrl of sitemapLocations) {
    try {
      const res = await requestUrl({ url: sitemapUrl, timeout: 15000, readBody: true });

      if (res.status !== 200 || !res.body) continue;

      const content = res.body;

      // Check if it's a sitemap index
      if (content.includes('<sitemapindex')) {
        const sitemapMatches = content.match(/<loc>([^<]+)<\/loc>/g) || [];
        for (const match of sitemapMatches.slice(0, 10)) {
          const childUrl = match.replace(/<\/?loc>/g, '');
          sitemapIndexUrls.push(childUrl);

          // Fetch child sitemap
          try {
            const childRes = await requestUrl({ url: childUrl, timeout: 10000, readBody: true });
            if (childRes.status === 200 && childRes.body) {
              parseUrlset(childRes.body, urls, maxUrls);
            }
          } catch (e) {
            errors.push(`Failed to fetch child sitemap: ${childUrl}`);
          }

          if (urls.length >= maxUrls) break;
        }
      } else if (content.includes('<urlset')) {
        parseUrlset(content, urls, maxUrls);
      }

      if (urls.length > 0) break;
    } catch {}
  }

  return {
    urls: urls.slice(0, maxUrls),
    sitemapIndexUrls,
    totalUrls: urls.length,
    errors
  };
}

function parseUrlset(content: string, urls: SitemapUrl[], maxUrls: number): void {
  // Simple XML parsing for sitemap
  const urlMatches = content.match(/<url>[\s\S]*?<\/url>/g) || [];

  for (const urlBlock of urlMatches) {
    if (urls.length >= maxUrls) break;

    const locMatch = urlBlock.match(/<loc>([^<]+)<\/loc>/);
    const lastmodMatch = urlBlock.match(/<lastmod>([^<]+)<\/lastmod>/);
    const changefreqMatch = urlBlock.match(/<changefreq>([^<]+)<\/changefreq>/);
    const priorityMatch = urlBlock.match(/<priority>([^<]+)<\/priority>/);

    if (locMatch) {
      urls.push({
        loc: locMatch[1].trim(),
        lastmod: lastmodMatch?.[1]?.trim(),
        changefreq: changefreqMatch?.[1]?.trim(),
        priority: priorityMatch ? parseFloat(priorityMatch[1]) : undefined
      });
    }
  }
}
