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
  analyzeUrlSeoFriendliness
} from '@/lib/fetch/fetchHtml';

// Rate limiting
const rateLimits = new Map<string, { count: number; ts: number }>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const r = rateLimits.get(ip);
  if (!r || now - r.ts > 60000) { rateLimits.set(ip, { count: 1, ts: now }); return true; }
  if (r.count >= 30) return false;
  r.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    if (!checkRate(ip)) {
      return NextResponse.json({ error: 'ლიმიტი ამოიწურა. დაელოდეთ 1 წუთი.' }, { status: 429 });
    }
    
    const { url, html: providedHtml } = await request.json();
    
    if (!url && !providedHtml) {
      return NextResponse.json({ error: 'URL ან HTML აუცილებელია' }, { status: 400 });
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
          return NextResponse.json({ error: 'საიტი დაცულია. გამოიყენეთ "HTML ჩასმა" რეჟიმი.', blocked: true }, { status: 403 });
        }
      } catch (e) {
        return NextResponse.json({ error: `URL ვერ ჩაიტვირთა: ${e instanceof Error ? e.message : 'შეცდომა'}` }, { status: 502 });
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
          result.technical.robotsTxt = { found: true, content: robots, blocksAll: robots.includes('Disallow: /'), hasSitemap: robots.toLowerCase().includes('sitemap:') };
        }
        result.technical.sitemap = { ...sitemap, urlCount: sitemap.urlCount };
        result.technical.llmsTxt = { found: llmsTxt.found, mentioned: result.technical.llmsTxt?.mentioned || false, content: llmsTxt.content };

        // llms.txt issue - only add after actual check
        if (!llmsTxt.found && !result.technical.llmsTxt?.mentioned) {
          result.issues.push({
            id: 'no-llms-txt',
            severity: 'low' as const,
            category: 'AI',
            issue: 'No llms.txt file found',
            issueGe: 'llms.txt ფაილი ვერ მოიძებნა',
            location: '/llms.txt',
            fix: 'Create llms.txt for AI crawler guidance',
            fixGe: 'შექმენით llms.txt AI კრაულერებისთვის',
            details: `დაბალი პრიორიტეტი. llms.txt არის ახალი სტანდარტი AI კრაულერებისთვის (ChatGPT, Claude და ა.შ.). მისი დამატება ეხმარება AI სისტემებს თქვენი საიტის უკეთ გაგებაში.`
          });
        }

        // Check internal links for redirects (limit to 10 for performance)
        if (result.links.internalUrls && result.links.internalUrls.length > 0) {
          const linksToCheck = result.links.internalUrls.slice(0, 10);
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
              category: 'ბმულები',
              issue: `${redirectResults.length} link(s) pointing to redirects (301/302)`,
              issueGe: `${redirectResults.length} ბმული მიმართავს გადამისამართებაზე (301/302)`,
              location: '<a href>',
              fix: 'Update links to point directly to final URLs',
              fixGe: 'განაახლეთ ბმულები საბოლოო URL-ებზე',
              details: `საშუალო პრიორიტეტი. გადამისამართებები ანელებს გვერდის ჩატვირთვას და კარგავს PageRank-ს. ნაპოვნი: ${redirectResults.slice(0, 3).map(r => `${r.href} → ${r.status}`).join('; ')}`
            });
          }
        }

        // Check external links for 404 errors (limit to 15 for performance)
        if (result.links.externalUrls && result.links.externalUrls.length > 0) {
          const externalLinks = result.links.externalUrls.slice(0, 15);
          const brokenExternalLinks = await checkExternalLinks(externalLinks, 3);

          if (brokenExternalLinks.length > 0) {
            result.links.brokenExternalLinks = brokenExternalLinks.length;
            result.links.brokenExternalList = brokenExternalLinks.map((r: { href: string; text: string; status: number; error?: string }) => ({
              href: r.href, text: r.text, status: r.status, error: r.error
            }));

            result.issues.push({
              id: 'broken-external-links',
              severity: 'high' as const,
              category: 'ბმულები',
              issue: `${brokenExternalLinks.length} external link(s) are broken (404/error)`,
              issueGe: `${brokenExternalLinks.length} გარე ბმული გატეხილია (404/შეცდომა)`,
              location: '<a href>',
              fix: 'Remove or update broken external links',
              fixGe: 'წაშალეთ ან განაახლეთ გატეხილი გარე ბმულები',
              details: `მაღალი პრიორიტეტი. გატეხილი გარე ბმულები აუარესებს მომხმარებლის გამოცდილებას და SEO-ს. ნაპოვნი: ${brokenExternalLinks.slice(0, 3).map(r => `${r.href} → ${r.status || r.error}`).join('; ')}`
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
            category: 'უსაფრთხოება',
            issue: `SSL certificate issue: ${sslResult.error || 'Invalid or expired'}`,
            issueGe: `SSL სერტიფიკატის პრობლემა: ${sslResult.error || 'არავალიდური ან ვადაგასული'}`,
            location: 'HTTPS',
            fix: 'Renew or fix SSL certificate',
            fixGe: 'განაახლეთ ან გაასწორეთ SSL სერტიფიკატი',
            details: `კრიტიკული პრიორიტეტი. SSL სერტიფიკატი არავალიდურია ან ვადაგასულია.`
          });
        } else if (sslResult.daysUntilExpiry !== undefined && sslResult.daysUntilExpiry < 30) {
          result.issues.push({
            id: 'ssl-expiring-soon',
            severity: 'high' as const,
            category: 'უსაფრთხოება',
            issue: `SSL certificate expires in ${sslResult.daysUntilExpiry} days`,
            issueGe: `SSL სერტიფიკატი იწურება ${sslResult.daysUntilExpiry} დღეში`,
            location: 'HTTPS',
            fix: 'Renew SSL certificate before expiry',
            fixGe: 'განაახლეთ SSL სერტიფიკატი ვადის გასვლამდე',
            details: `მაღალი პრიორიტეტი. SSL სერტიფიკატი იწურება ${sslResult.validTo}-ზე. გასდეთ ${sslResult.issuer || 'გამცემი'}.`
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
            category: 'უსაფრთხოება',
            issue: `Missing ${securityHeadersResult.issues.length} security headers`,
            issueGe: `აკლია ${securityHeadersResult.issues.length} უსაფრთხოების ჰედერი`,
            location: 'HTTP Headers',
            fix: 'Add missing security headers to server config',
            fixGe: 'დაამატეთ აკლებული უსაფრთხოების ჰედერები სერვერის კონფიგურაციაში',
            details: `საშუალო პრიორიტეტი. უსაფრთხოების ქულა: ${securityHeadersResult.score}/100. აკლია: ${securityHeadersResult.issues.join(', ')}`
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
              category: 'ტექნიკური',
              issue: 'Current page is not in sitemap.xml',
              issueGe: 'მიმდინარე გვერდი არ არის sitemap.xml-ში',
              location: 'sitemap.xml',
              fix: 'Add page URL to sitemap.xml',
              fixGe: 'დაამატეთ გვერდის URL sitemap.xml-ში',
              details: `საშუალო პრიორიტეტი. გვერდი არ არის ნაპოვნი sitemap.xml-ში. sitemap-ში არსებობა აუმჯობესებს ინდექსაციას.`
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
              category: 'სურათები',
              issue: `${imageAnalysis.largeCount} image(s) larger than 500KB`,
              issueGe: `${imageAnalysis.largeCount} სურათი 500KB-ზე მეტია`,
              location: '<img src>',
              fix: 'Compress images or use responsive sizes',
              fixGe: 'შეკუმშეთ სურათები ან გამოიყენეთ რესპონსიული ზომები',
              details: `საშუალო პრიორიტეტი. დიდი სურათები ანელებს გვერდის ჩატვირთვას. მაგ: ${imageAnalysis.largeList.slice(0, 2).map(img => `${img.src.split('/').pop()} (${img.size})`).join(', ')}`
            });
          }

          if (imageAnalysis.oldFormatCount > 0) {
            result.issues.push({
              id: 'old-image-formats',
              severity: 'low' as const,
              category: 'სურათები',
              issue: `${imageAnalysis.oldFormatCount} image(s) using old formats (not WebP/AVIF)`,
              issueGe: `${imageAnalysis.oldFormatCount} სურათი იყენებს ძველ ფორმატებს (არა WebP/AVIF)`,
              location: '<img src>',
              fix: 'Convert images to WebP or AVIF format',
              fixGe: 'გადაიყვანეთ სურათები WebP ან AVIF ფორმატში',
              details: `დაბალი პრიორიტეტი. WebP და AVIF ფორმატები 25-50%-ით პატარაა იგივე ხარისხზე.`
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
              issueGe: `URL-ს აქვს ${highIssues.length} SEO პრობლემა`,
              location: finalUrl,
              fix: highIssues.map(i => i.recommendation).join('; '),
              fixGe: highIssues.map(i => i.recommendation).join('; '),
              details: `მაღალი პრიორიტეტი. პრობლემები:\n${highIssues.map(i => `• ${i.issue}: ${i.recommendation}`).join('\n')}`
            });
          }

          if (mediumIssues.length > 0) {
            result.issues.push({
              id: 'url-seo-issues-medium',
              severity: 'medium' as const,
              category: 'URL',
              issue: `URL has ${mediumIssues.length} SEO improvement(s) needed`,
              issueGe: `URL-ს სჭირდება ${mediumIssues.length} SEO გაუმჯობესება`,
              location: finalUrl,
              fix: mediumIssues.map(i => i.recommendation).join('; '),
              fixGe: mediumIssues.map(i => i.recommendation).join('; '),
              details: `საშუალო პრიორიტეტი. გაუმჯობესებები:\n${mediumIssues.map(i => `• ${i.issue}: ${i.recommendation}`).join('\n')}`
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
            issueGe: 'ორივე www და non-www ვერსია ხელმისაწვდომია',
            location: 'Domain configuration',
            fix: 'Set up 301 redirect from one version to the other',
            fixGe: 'დააყენეთ 301 გადამისამართება ერთი ვერსიიდან მეორეზე',
            details: `მაღალი პრიორიტეტი. ${wwwCheck.issue} This causes duplicate content issues and splits link equity.`
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
            issueGe: 'HTTP ვერსია ხელმისაწვდომია HTTPS-ზე გადამისამართების გარეშე',
            location: 'Server configuration',
            fix: 'Set up 301 redirect from HTTP to HTTPS',
            fixGe: 'დააყენეთ 301 გადამისამართება HTTP-დან HTTPS-ზე',
            details: `კრიტიკული პრიორიტეტი. ${httpsCheck.issue || 'HTTP should always redirect to HTTPS for security.'}`
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
            issueGe: `Sitemap შეიცავს ${sitemapValidation.redirects.length} URL-ს რომელიც გადამისამართებაა`,
            location: 'sitemap.xml',
            fix: 'Update sitemap to use final destination URLs, not redirecting URLs',
            fixGe: 'განაახლეთ sitemap საბოლოო URL-ებით, არა გადამისამართებით',
            details: `საშუალო პრიორიტეტი. Sitemap-ში გადამისამართებები:\n${sitemapValidation.redirects.slice(0, 5).map(r => `• ${r.url} → ${r.status} → ${r.location}`).join('\n')}`
          });
        }

        if (sitemapValidation.notFound.length > 0) {
          result.issues.push({
            id: 'sitemap-has-404s',
            severity: 'high' as const,
            category: 'Sitemap',
            issue: `Sitemap contains ${sitemapValidation.notFound.length} broken URL(s) (404)`,
            issueGe: `Sitemap შეიცავს ${sitemapValidation.notFound.length} გატეხილ URL-ს (404)`,
            location: 'sitemap.xml',
            fix: 'Remove 404 URLs from sitemap or restore the pages',
            fixGe: 'წაშალეთ 404 URL-ები sitemap-იდან ან აღადგინეთ გვერდები',
            details: `მაღალი პრიორიტეტი. Sitemap-ში გატეხილი URL-ები:\n${sitemapValidation.notFound.slice(0, 5).map(r => `• ${r.url} → ${r.status}`).join('\n')}`
          });
        }

      } catch {}
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Audit]', error);
    return NextResponse.json({ error: 'აუდიტი ვერ შესრულდა' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', version: '1.0.0' });
}
