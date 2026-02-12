// app/api/audit/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { runAudit } from '@/lib/audit/runAudit';
import {
  fetchHtml,
  fetchRobotsTxt,
  checkSitemap,
  checkLlmsTxt,
  validateUrl,
  checkLinksForRedirects,
  checkExternalLinks,
  checkSSLCertificate,
  checkSecurityHeaders,
  checkUrlInSitemap,
  checkImageSize,
  checkWwwRedirect,
  checkHttpsRedirect,
  validateSitemapUrls,
  analyzeUrlSeoFriendliness,
  buildSiteTree,
  checkSearchIndexStatus
} from '@/lib/fetch/fetchHtml';

// Rate limiting
const rateLimits = new Map<string, { count: number; ts: number }>();
const RATE_WINDOW_MS = 60000;
const MAX_REQUESTS = 30;
const MAX_HTML_SIZE = 10 * 1024 * 1024; // 10MB max HTML payload

function checkRate(ip: string): boolean {
  const now = Date.now();

  // Periodic cleanup: remove stale entries to prevent unbounded memory growth
  if (rateLimits.size > 1000) {
    for (const [key, value] of rateLimits) {
      if (now - value.ts > RATE_WINDOW_MS) rateLimits.delete(key);
    }
  }

  const r = rateLimits.get(ip);
  if (!r || now - r.ts > RATE_WINDOW_MS) { rateLimits.set(ip, { count: 1, ts: now }); return true; }
  if (r.count >= MAX_REQUESTS) return false;
  r.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    if (!checkRate(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait 1 minute.' }, { status: 429 });
    }
    
    const body = await request.json();
    const { url, html: providedHtml } = body;

    if (!url && !providedHtml) {
      return NextResponse.json({ error: 'URL or HTML is required' }, { status: 400 });
    }

    // Prevent memory exhaustion from oversized HTML payloads
    if (providedHtml && typeof providedHtml === 'string' && providedHtml.length > MAX_HTML_SIZE) {
      return NextResponse.json({ error: `HTML payload too large (max ${MAX_HTML_SIZE / 1024 / 1024}MB)` }, { status: 413 });
    }
    
    let html: string;
    let finalUrl = url || 'pasted-html';
    let fetchMethod: 'url' | 'html' = 'html';
    
    if (providedHtml) {
      html = providedHtml;
      const canonical = providedHtml.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
      const ogUrl = providedHtml.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i);
      finalUrl = canonical?.[1] || ogUrl?.[1] || url || 'pasted-html';
    } else {
      const v = validateUrl(url);
      if (!v.valid) return NextResponse.json({ error: v.error }, { status: 400 });
      
      try {
        const result = await fetchHtml(url);
        html = result.html;
        finalUrl = result.finalUrl;
        fetchMethod = 'url';
        
        if (html.length < 1000 && html.toLowerCase().includes('cloudflare')) {
          return NextResponse.json({ error: 'Site is protected by Cloudflare. Use "Paste HTML" mode instead.', blocked: true }, { status: 403 });
        }
      } catch (e) {
        return NextResponse.json({ error: `URL could not be loaded: ${e instanceof Error ? e.message : 'Error'}` }, { status: 502 });
      }
    }
    
    const result = await runAudit(html, finalUrl);
    result.fetchMethod = fetchMethod;
    
    // Fetch robots.txt, sitemap, llms.txt and check links for redirects
    if (fetchMethod === 'url') {
      try {
        const base = `${new URL(finalUrl).protocol}//${new URL(finalUrl).host}`;

        // Parallel fetch of robots, sitemap, llms.txt
        const [robots, sitemap, llmsTxt] = await Promise.all([
          fetchRobotsTxt(base),
          checkSitemap(base),
          checkLlmsTxt(base)
        ]);

        if (robots) {
          // Only blocks all if User-agent: * has Disallow: / without Allow: / (per Google rules)
          const checkBlocksAll = (content: string): boolean => {
            const lines = content.split('\n').map(l => l.trim().toLowerCase());
            let inWildcard = false, hasDisallowRoot = false, hasAllowRoot = false;
            for (const line of lines) {
              if (line.startsWith('user-agent:')) inWildcard = line.replace('user-agent:', '').trim() === '*';
              else if (inWildcard) {
                if (line.startsWith('disallow:') && line.replace('disallow:', '').trim() === '/') hasDisallowRoot = true;
                if (line.startsWith('allow:') && (line.replace('allow:', '').trim() === '/' || line.replace('allow:', '').trim() === '/*')) hasAllowRoot = true;
              }
            }
            return hasDisallowRoot && !hasAllowRoot;
          };
          result.technical.robotsTxt = { found: true, content: robots, blocksAll: checkBlocksAll(robots), hasSitemap: robots.toLowerCase().includes('sitemap:') };
        }
        result.technical.sitemap = { ...sitemap, urlCount: sitemap.urlCount };
        result.technical.llmsTxt = { found: llmsTxt.found, mentioned: result.technical.llmsTxt?.mentioned || false, content: llmsTxt.content };

        // llms.txt - update passed array and add issue only after actual check
        if (llmsTxt.found) {
          // Add to passed if not already there
          if (!result.passed.includes('llms.txt ✓')) {
            result.passed.push('llms.txt ✓');
          }
        } else if (!result.technical.llmsTxt?.mentioned) {
          // Only show issue if llms.txt not found AND not mentioned in HTML
          result.issues.push({
            id: 'no-llms-txt',
            severity: 'low' as const,
            category: 'AI',
            issue: 'No llms.txt file found',
            issueGe: 'No llms.txt file found',
            location: '/llms.txt',
            fix: 'Create llms.txt for AI crawler guidance',
            fixGe: 'Create llms.txt for AI crawler guidance',
            details: `Low priority. llms.txt is a new standard for AI crawlers (ChatGPT, Claude, etc.). Adding it helps AI systems better understand your site.`
          });
        }

        // Check internal links for redirects AND 404 errors (limit to 15 for performance)
        const paginationLinks = result.links.paginationUrls || [];
        const internalLinks = result.links.internalUrls || [];
        if (internalLinks.length > 0 || paginationLinks.length > 0) {
          const seenInternal = new Set<string>();
          const prioritizedLinks: { href: string; text: string }[] = [];
          const addLink = (link?: { href: string; text: string }) => {
            if (!link?.href || seenInternal.has(link.href)) return;
            seenInternal.add(link.href);
            prioritizedLinks.push(link);
          };

          paginationLinks.forEach(addLink);
          internalLinks.forEach(addLink);

          const maxInternalChecks = 20;
          const linksToCheck = prioritizedLinks.slice(0, maxInternalChecks);
          const redirectResults = await checkLinksForRedirects(linksToCheck, 5);

          if (redirectResults.length > 0) {
            result.links.redirectLinks = redirectResults.length;
            result.links.redirectList = redirectResults.map((r: { href: string; text: string; status: number; location: string }) => ({
              href: r.href, text: r.text, status: r.status, location: r.location
            }));

            // Add redirect issue to the issues list
            result.issues.push({
              id: 'redirect-links',
              severity: 'medium' as const,
              category: 'Links',
              issue: `${redirectResults.length} link(s) pointing to redirects (301/302)`,
              issueGe: `${redirectResults.length} link(s) pointing to redirects (301/302)`,
              location: '<a href>',
              fix: 'Update links to point directly to final URLs',
              fixGe: 'Update links to point directly to final URLs',
              details: `Medium priority. Redirects slow down page loading and leak PageRank. Found: ${redirectResults.slice(0, 3).map(r => `${r.href} → ${r.status}`).join('; ')}`
            });
          }

          // Also check internal links for 404 errors (pagination, etc.)
          const brokenInternalLinks = await checkExternalLinks(linksToCheck, 3);
          const actualBrokenInternal = brokenInternalLinks.filter((r: { status: number; error?: string }) =>
            !r.error?.includes('Blocked') && (r.status === 404 || r.status === 410 || r.status >= 500 || r.status === 0)
          );

          if (actualBrokenInternal.length > 0) {
            result.links.brokenInternalLinks = actualBrokenInternal.length;
            result.links.brokenInternalList = actualBrokenInternal.map((r: { href: string; text: string; status: number; error?: string }) => ({
              href: r.href, text: r.text, status: r.status, error: r.error
            }));

            result.issues.push({
              id: 'broken-internal-links',
              severity: 'critical' as const,
              category: 'Links',
              issue: `${actualBrokenInternal.length} internal link(s) are broken (404/error)`,
              issueGe: `${actualBrokenInternal.length} internal link(s) are broken (404/error)`,
              location: '<a href>',
              fix: 'Fix or remove broken internal links',
              fixGe: 'Fix or remove broken internal links',
              details: `Critical priority. Broken internal links severely harm user experience and SEO. Found: ${actualBrokenInternal.slice(0, 3).map(r => `${r.href} → ${r.status || r.error}`).join('; ')}`
            });

            const paginationSet = new Set(paginationLinks.map((link) => link.href));
            const brokenPagination = actualBrokenInternal.filter((r: { href: string }) => paginationSet.has(r.href));
            if (brokenPagination.length > 0) {
              result.issues.push({
                id: 'broken-pagination-links',
                severity: 'high' as const,
                category: 'Links',
                issue: `${brokenPagination.length} pagination link(s) are broken (404/error)`,
                issueGe: `${brokenPagination.length} pagination link(s) are broken (404/error)`,
                location: 'Pagination navigation',
                fix: 'Update or remove broken pagination URLs',
                fixGe: 'Update or remove broken pagination URLs',
                details: `High priority. Broken pagination blocks crawl depth and user navigation. Found: ${brokenPagination.slice(0, 3).map(r => `${r.href} → ${r.status || r.error}`).join('; ')}`
              });
            }
          }
        }

        // Check external links for 404 errors (limit to 15 for performance)
        if (result.links.externalUrls && result.links.externalUrls.length > 0) {
          const externalLinks = result.links.externalUrls.slice(0, 15);
          const brokenExternalLinks = await checkExternalLinks(externalLinks, 3);

          // Filter out blocked links (999 status) - not real errors
          const actualBroken = brokenExternalLinks.filter((r: { error?: string }) => !r.error?.includes('Blocked'));

          if (actualBroken.length > 0) {
            result.links.brokenExternalLinks = actualBroken.length;
            result.links.brokenExternalList = actualBroken.map((r: { href: string; text: string; status: number; error?: string }) => ({
              href: r.href, text: r.text, status: r.status, error: r.error
            }));

            result.issues.push({
              id: 'broken-external-links',
              severity: 'high' as const,
              category: 'Links',
              issue: `${actualBroken.length} external link(s) are broken (404/error)`,
              issueGe: `${actualBroken.length} external link(s) are broken (404/error)`,
              location: '<a href>',
              fix: 'Remove or update broken external links',
              fixGe: 'Remove or update broken external links',
              details: `High priority. Broken external links harm user experience and SEO. Found: ${actualBroken.slice(0, 3).map(r => `${r.href} → ${r.status || r.error}`).join('; ')}`
            });
          }
        }

        // Check SSL certificate
        const sslResult = await checkSSLCertificate(finalUrl);
        result.security.ssl = {
          valid: sslResult.valid,
          issuer: sslResult.issuer,
          validFrom: sslResult.validFrom,
          validTo: sslResult.validTo,
          daysUntilExpiry: sslResult.daysUntilExpiry,
          error: sslResult.error
        };

        if (!sslResult.valid) {
          result.issues.push({
            id: 'ssl-invalid',
            severity: 'critical' as const,
            category: 'Security',
            issue: `SSL certificate issue: ${sslResult.error || 'Invalid or expired'}`,
            issueGe: `SSL certificate issue: ${sslResult.error || 'Invalid or expired'}`,
            location: 'HTTPS',
            fix: 'Renew or fix SSL certificate',
            fixGe: 'Renew or fix SSL certificate',
            details: `Critical priority. SSL certificate is invalid or expired.`
          });
        } else if (sslResult.daysUntilExpiry !== undefined && sslResult.daysUntilExpiry < 30) {
          result.issues.push({
            id: 'ssl-expiring-soon',
            severity: 'high' as const,
            category: 'Security',
            issue: `SSL certificate expires in ${sslResult.daysUntilExpiry} days`,
            issueGe: `SSL certificate expires in ${sslResult.daysUntilExpiry} days`,
            location: 'HTTPS',
            fix: 'Renew SSL certificate before expiry',
            fixGe: 'Renew SSL certificate before expiry',
            details: `High priority. SSL certificate expires on ${sslResult.validTo}. Issuer: ${sslResult.issuer || 'Unknown'}.`
          });
        }

        // Check security headers
        const securityHeadersResult = await checkSecurityHeaders(finalUrl);
        result.security.securityHeaders = {
          headers: securityHeadersResult.headers,
          score: securityHeadersResult.score,
          issues: securityHeadersResult.issues
        };

        if (securityHeadersResult.issues.length > 0) {
          result.issues.push({
            id: 'security-headers-missing',
            severity: 'medium' as const,
            category: 'Security',
            issue: `Missing ${securityHeadersResult.issues.length} security headers`,
            issueGe: `Missing ${securityHeadersResult.issues.length} security headers`,
            location: 'HTTP Headers',
            fix: 'Add missing security headers to server config',
            fixGe: 'Add missing security headers to server config',
            details: `Medium priority. Security score: ${securityHeadersResult.score}/100. Missing: ${securityHeadersResult.issues.join(', ')}`
          });
        }

        // Check if current page is in sitemap (handles sitemap_index.xml with multiple sitemaps)
        if (sitemap.found && sitemap.url) {
          const base = `${new URL(finalUrl).protocol}//${new URL(finalUrl).host}`;
          const sitemapCheck = await checkUrlInSitemap(base, finalUrl);
          result.technical.sitemap.pageInSitemap = sitemapCheck.inSitemap;

          if (!sitemapCheck.inSitemap && sitemapCheck.found) {
            result.issues.push({
              id: 'page-not-in-sitemap',
              severity: 'medium' as const,
              category: 'Technical',
              issue: 'Current page is not in sitemap.xml',
              issueGe: 'Current page is not in sitemap.xml',
              location: 'sitemap.xml',
              fix: 'Add page URL to sitemap.xml',
              fixGe: 'Add page URL to sitemap.xml',
              details: `Medium priority. Page is not found in sitemap.xml. Being in sitemap improves indexation.`
            });
          }
        }

        // Check image sizes (for large images)
        if (result.images.imageUrls && result.images.imageUrls.length > 0) {
          const imagesToCheck = result.images.imageUrls.slice(0, 10);
          const imageAnalysis = await checkImageSize(imagesToCheck, 3);

          result.images.imageSizeAnalysis = imageAnalysis;

          if (imageAnalysis.largeCount > 0) {
            result.issues.push({
              id: 'large-images',
              severity: 'medium' as const,
              category: 'Images',
              issue: `${imageAnalysis.largeCount} image(s) larger than 500KB`,
              issueGe: `${imageAnalysis.largeCount} image(s) larger than 500KB`,
              location: '<img src>',
              fix: 'Compress images or use responsive sizes',
              fixGe: 'Compress images or use responsive sizes',
              details: `Medium priority. Large images slow down page loading.\nExamples:\n${imageAnalysis.largeList.map(img => `• ${img.src} (${img.size})`).join('\n')}`
            });
          }

          if (imageAnalysis.oldFormatCount > 0) {
            result.issues.push({
              id: 'old-image-formats',
              severity: 'low' as const,
              category: 'Images',
              issue: `${imageAnalysis.oldFormatCount} image(s) using old formats (not WebP/AVIF)`,
              issueGe: `${imageAnalysis.oldFormatCount} image(s) using old formats (not WebP/AVIF)`,
              location: '<img src>',
              fix: 'Convert images to WebP or AVIF format',
              fixGe: 'Convert images to WebP or AVIF format',
              details: `Low priority. WebP and AVIF formats are 25-50% smaller at the same quality.`
            });
          }
        }

        // URL SEO Friendliness Check
        const urlSeoAnalysis = analyzeUrlSeoFriendliness(finalUrl);
        result.urlStructure = {
          ...result.urlStructure,
          seoScore: urlSeoAnalysis.score,
          seoIssues: urlSeoAnalysis.issues,
          details: urlSeoAnalysis.details
        };

        if (urlSeoAnalysis.issues.length > 0) {
          const highIssues = urlSeoAnalysis.issues.filter(i => i.severity === 'high');
          const mediumIssues = urlSeoAnalysis.issues.filter(i => i.severity === 'medium');

          if (highIssues.length > 0) {
            result.issues.push({
              id: 'url-seo-issues-high',
              severity: 'high' as const,
              category: 'URL',
              issue: `URL has ${highIssues.length} SEO problem(s)`,
              issueGe: `URL has ${highIssues.length} SEO problem(s)`,
              location: finalUrl,
              fix: highIssues.map(i => i.recommendation).join('; '),
              fixGe: highIssues.map(i => i.recommendation).join('; '),
              details: `High priority. Problems:\n${highIssues.map(i => `• ${i.issue}: ${i.recommendation}`).join('\n')}`
            });
          }

          if (mediumIssues.length > 0) {
            result.issues.push({
              id: 'url-seo-issues-medium',
              severity: 'medium' as const,
              category: 'URL',
              issue: `URL has ${mediumIssues.length} SEO improvement(s) needed`,
              issueGe: `URL has ${mediumIssues.length} SEO improvement(s) needed`,
              location: finalUrl,
              fix: mediumIssues.map(i => i.recommendation).join('; '),
              fixGe: mediumIssues.map(i => i.recommendation).join('; '),
              details: `Medium priority. Improvements needed:\n${mediumIssues.map(i => `• ${i.issue}: ${i.recommendation}`).join('\n')}`
            });
          }
        }

        // WWW vs Non-WWW Redirect Check
        const wwwCheck = await checkWwwRedirect(finalUrl);
        result.technical.wwwRedirect = wwwCheck;

        if (wwwCheck.bothAccessible && wwwCheck.issue) {
          result.issues.push({
            id: 'www-non-www-both-accessible',
            severity: 'high' as const,
            category: 'Technical',
            issue: 'Both www and non-www versions accessible',
            issueGe: 'Both www and non-www versions accessible',
            location: 'Domain configuration',
            fix: 'Set up 301 redirect from one version to the other',
            fixGe: 'Set up 301 redirect from one version to the other',
            details: `High priority. ${wwwCheck.issue} This causes duplicate content issues and splits link equity.`
          });
        }

        // HTTP vs HTTPS Redirect Check
        const httpsCheck = await checkHttpsRedirect(finalUrl);
        result.technical.httpsRedirect = httpsCheck;

        if (httpsCheck.httpAccessible && !httpsCheck.httpRedirectsToHttps) {
          result.issues.push({
            id: 'http-no-redirect-to-https',
            severity: 'critical' as const,
            category: 'Security',
            issue: 'HTTP version accessible without redirect to HTTPS',
            issueGe: 'HTTP version accessible without redirect to HTTPS',
            location: 'Server configuration',
            fix: 'Set up 301 redirect from HTTP to HTTPS',
            fixGe: 'Set up 301 redirect from HTTP to HTTPS',
            details: `Critical priority. ${httpsCheck.issue || 'HTTP should always redirect to HTTPS for security.'}`
          });
        }

        // Sitemap URL Validation (check for 301s and 404s in sitemap)
        const sitemapValidation = await validateSitemapUrls(base, 20);
        result.technical.sitemapValidation = sitemapValidation;

        if (sitemapValidation.redirects.length > 0) {
          result.issues.push({
            id: 'sitemap-has-redirects',
            severity: 'medium' as const,
            category: 'Sitemap',
            issue: `Sitemap contains ${sitemapValidation.redirects.length} URL(s) that redirect`,
            issueGe: `Sitemap contains ${sitemapValidation.redirects.length} URL(s) that redirect`,
            location: 'sitemap.xml',
            fix: 'Update sitemap to use final destination URLs, not redirecting URLs',
            fixGe: 'Update sitemap to use final destination URLs, not redirecting URLs',
            details: `Medium priority. Sitemap redirects:\n${sitemapValidation.redirects.slice(0, 5).map(r => `• ${r.url} → ${r.status} → ${r.location}`).join('\n')}`
          });
        }

        if (sitemapValidation.notFound.length > 0) {
          result.issues.push({
            id: 'sitemap-has-404s',
            severity: 'high' as const,
            category: 'Sitemap',
            issue: `Sitemap contains ${sitemapValidation.notFound.length} broken URL(s) (404)`,
            issueGe: `Sitemap contains ${sitemapValidation.notFound.length} broken URL(s) (404)`,
            location: 'sitemap.xml',
            fix: 'Remove 404 URLs from sitemap or restore the pages',
            fixGe: 'Remove 404 URLs from sitemap or restore the pages',
            details: `High priority. Broken URLs in sitemap:\n${sitemapValidation.notFound.slice(0, 5).map(r => `• ${r.url} → ${r.status}`).join('\n')}`
          });
        }

        // Build site tree from sitemap
        const siteTree = await buildSiteTree(base, finalUrl, 1000);
        result.technical.siteTree = siteTree;

        // Add site tree issues
        if (siteTree.issues.length > 0) {
          for (const treeIssue of siteTree.issues) {
            result.issues.push({
              id: 'site-tree-issue',
              severity: 'medium' as const,
              category: 'Site Structure',
              issue: treeIssue.issue,
              issueGe: treeIssue.issue,
              location: treeIssue.url,
              fix: 'Add page to sitemap or check site structure',
              fixGe: 'Add page to sitemap or check site structure',
              details: `Medium priority. ${treeIssue.issue}`
            });
          }
        }

        // Check if page is indexed in Google and Bing
        try {
          const indexStatus = await checkSearchIndexStatus(finalUrl);
          result.searchIndex = indexStatus;

          if (!indexStatus.google.indexed && !indexStatus.google.error) {
            result.issues.push({
              id: 'not-indexed-google',
              severity: 'high' as const,
              category: 'Indexing',
              issue: 'Page not found in Google index',
              issueGe: 'Page not found in Google index',
              location: finalUrl,
              fix: 'Submit URL via Google Search Console and ensure page is crawlable',
              fixGe: 'Submit URL via Google Search Console and ensure page is crawlable',
              details: 'High priority. Page does not appear in Google search results for site: query. This may indicate the page is not indexed. Verify in Google Search Console.'
            });
          } else if (indexStatus.google.indexed) {
            result.passed.push('Indexed in Google ✓');
          }

          if (!indexStatus.bing.indexed && !indexStatus.bing.error) {
            result.issues.push({
              id: 'not-indexed-bing',
              severity: 'medium' as const,
              category: 'Indexing',
              issue: 'Page not found in Bing index',
              issueGe: 'Page not found in Bing index',
              location: finalUrl,
              fix: 'Submit URL via Bing Webmaster Tools',
              fixGe: 'Submit URL via Bing Webmaster Tools',
              details: 'Medium priority. Page does not appear in Bing search results. Submit via Bing Webmaster Tools for faster indexing.'
            });
          } else if (indexStatus.bing.indexed) {
            result.passed.push('Indexed in Bing ✓');
          }
        } catch (indexError) {
          console.warn('[Audit] Search index check failed:', indexError instanceof Error ? indexError.message : indexError);
        }

      } catch (enrichError) {
        // Log but don't fail the entire audit — the core result is still valid
        console.warn('[Audit] Post-audit enrichment partially failed:', enrichError instanceof Error ? enrichError.message : enrichError);
      }
    }

    // Recalculate score after all enrichment issues have been added
    let score = 100;
    result.issues.forEach((i: { severity: string }) => {
      switch (i.severity) { case 'critical': score -= 15; break; case 'high': score -= 8; break; case 'medium': score -= 4; break; case 'low': score -= 1; break; }
    });
    score += Math.min(10, result.passed.length * 0.5);
    result.score = Math.max(0, Math.min(100, Math.round(score)));
    result.summary = {
      ...result.summary,
      criticalIssues: result.issues.filter((i: { severity: string }) => i.severity === 'critical').length,
      highIssues: result.issues.filter((i: { severity: string }) => i.severity === 'high').length,
      mediumIssues: result.issues.filter((i: { severity: string }) => i.severity === 'medium').length,
      lowIssues: result.issues.filter((i: { severity: string }) => i.severity === 'low').length,
      totalChecks: result.issues.length + result.passed.length,
      passedChecks: result.passed.length,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Audit]', error);
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({
      error: 'Audit failed to complete',
      details: message,
      hint: 'Check URL accessibility, robots/firewall restrictions, and server logs for the failing request.'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', version: '1.0.0' });
}
