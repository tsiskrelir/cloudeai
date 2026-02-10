'use client';

import React, { useState, useCallback } from 'react';

// Types matching the updated audit system
interface AuditIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  issueGe: string;
  location: string;
  fix: string;
  fixGe: string;
  current?: string;
  details?: string;
}

interface HreflangTag { hreflang: string; href: string; }
interface SchemaItem { index: string; type: string; valid: boolean; issues: string[]; }
interface KeywordDensity { word: string; count: number; percentage: number; }
interface ReadabilityData { fleschScore: number; fleschGrade: string; avgSentenceLength: number; avgSyllablesPerWord: number; complexWordPercentage: number; }
interface AriaData { landmarks: { main: number; nav: number; header: number; footer: number; aside: number; search: number; form: number; region: number }; ariaLabels: number; ariaDescribedby: number; ariaLabelledby: number; ariaHidden: number; ariaLive: number; ariaExpanded: number; roles: string[]; missingLandmarks: string[]; }
interface DOMData { totalElements: number; maxDepth: number; averageDepth: number; totalNodes: number; textNodes: number; commentNodes: number; inlineStyles: number; inlineScripts: number; emptyElements: number; deprecatedElements: string[]; duplicateIds: string[]; elementCounts: Record<string, number>; }

// PageSpeed types
interface PageSpeedMetrics { fcp: number; lcp: number; cls: number; tbt: number; si: number; tti: number; }
interface PageSpeedResult { score: number; metrics: PageSpeedMetrics; opportunities: { id: string; title: string; description: string; savings: string }[]; diagnostics: { id: string; title: string; description: string }[]; error?: string; }

// Crawler types
interface CrawlPage { url: string; status: number; title: string; depth: number; internalLinks: number; externalLinks: number; wordCount: number; hasH1: boolean; hasMetaDesc: boolean; issues: string[]; responseTime: number; }
interface CrawlResult { pages: CrawlPage[]; totalPages: number; totalInternalLinks: number; totalExternalLinks: number; brokenLinks: { url: string; status: number; foundOn: string }[]; redirects: { from: string; to: string; status: number }[]; duplicateTitles: { title: string; urls: string[] }[]; duplicateDescriptions: { description: string; urls: string[] }[]; orphanPages: string[]; deepPages: { url: string; depth: number }[]; crawlTime: number; errors: string[]; }

// Robots.txt types
interface RobotsRule { userAgent: string; rules: { type: 'allow' | 'disallow'; path: string }[]; crawlDelay?: number; }
interface RobotsValidation { isValid: boolean; errors: string[]; warnings: string[]; sitemaps: string[]; blocksGooglebot: boolean; blocksAll: boolean; rules: RobotsRule[]; }

// Sitemap types
interface SitemapUrl { loc: string; lastmod?: string; changefreq?: string; priority?: number; }
interface SitemapData { urls: SitemapUrl[]; sitemapIndexUrls: string[]; totalUrls: number; errors: string[]; }

interface SiteTreeNode {
  path: string;
  fullUrl: string;
  children: SiteTreeNode[];
  isCurrentPage?: boolean;
  status?: number;
  inSitemap?: boolean;
}

interface AuditResult {
  url: string;
  score: number;
  timestamp: string;
  fetchMethod: 'url' | 'html';
  summary: { criticalIssues: number; highIssues: number; mediumIssues: number; lowIssues: number; totalChecks: number; passedChecks: number; };
  technical: {
    title: { value: string; length: number; isOptimal: boolean };
    metaDesc: { value: string; length: number; isOptimal: boolean };
    canonical: { href: string | null; count: number; isCrossDomain: boolean };
    robots: { meta: string | null; hasNoindex: boolean; hasNofollow: boolean };
    robotsTxt: { found: boolean; content: string | null; blocksAll: boolean; hasSitemap: boolean };
    sitemap: { found: boolean; url: string | null; urlCount?: number; pageInSitemap?: boolean };
    siteTree?: {
      tree: SiteTreeNode;
      totalUrls: number;
      displayedUrls?: number;
      sitemapUrls: string[];
      currentPagePath: string[];
      issues: { url: string; issue: string; status?: number }[];
    };
    llmsTxt: { found: boolean; mentioned: boolean; content?: string };
    language: string | null;
    charset: string | null;
    viewport: { content: string | null; isMobileOptimized: boolean };
    favicon: boolean;
    appleTouchIcon: boolean;
    manifestJson: boolean;
    themeColor: string | null;
    wwwRedirect?: { wwwRedirectsToNonWww: boolean; nonWwwRedirectsToWww: boolean; bothAccessible: boolean; preferredVersion: string; issue?: string };
    httpsRedirect?: { httpRedirectsToHttps: boolean; httpsAccessible: boolean; httpAccessible: boolean; issue?: string };
    sitemapValidation?: { checked: number; redirects: { url: string; status: number; location: string }[]; notFound: { url: string; status: number }[]; errors: { url: string; error: string }[] };
  };
  international: { hreflangs: HreflangTag[]; hasXDefault: boolean; hasSelfReference: boolean; canonicalInHreflang: boolean; langMatchesHreflang: boolean; issues: string[]; };
  content: { headings: { h1: string[]; h2: string[]; h3: string[]; h4: string[]; h5: string[]; h6: string[] }; wordCount: number; characterCount: number; sentenceCount: number; paragraphCount: number; readingTime: number; titleH1Duplicate: boolean; duplicateParagraphs: number; aiScore: number; aiPhrases: string[]; readability: ReadabilityData; keywordDensity: KeywordDensity[]; };
  links: { total: number; internal: number; external: number; broken: number; brokenList: { href: string; text: string; reason?: string; htmlTag?: string }[]; brokenExternalLinks?: number; brokenExternalList?: { href: string; text: string; status: number; error?: string }[]; brokenInternalLinks?: number; brokenInternalList?: { href: string; text: string; status: number; error?: string }[]; genericAnchors: number; genericAnchorsList: { text: string; href: string }[]; nofollow: number; sponsored: number; ugc: number; unsafeExternalCount: number; hasFooterLinks: boolean; hasNavLinks: boolean; internalUrls?: { href: string; text: string }[]; externalUrls?: { href: string; text: string }[]; paginationUrls?: { href: string; text: string }[]; };
  images: {
    total: number;
    withoutAlt: number;
    withEmptyAlt: number;
    withoutDimensions: number;
    lazyLoaded: number;
    lazyAboveFold: number;
    clickableWithoutAlt: number;
    decorativeCount: number;
    largeImages: number;
    modernFormats: number;
    srcsetCount: number;
    imageSizeAnalysis?: {
      checked: number;
      largeCount: number;
      oldFormatCount: number;
      largeList: { src: string; size: string; type: string | null }[];
      oldFormatList: { src: string; type: string | null }[];
    };
    imageList?: {
      src: string;
      alt: string;
      width: string | null;
      height: string | null;
      id: string | null;
      className: string | null;
      format: string | null;
      hasAlt: boolean;
      hasDimensions: boolean;
    }[];
    pngList?: {
      src: string;
      alt: string;
      width: string | null;
      height: string | null;
      id: string | null;
      className: string | null;
      format: string | null;
      hasAlt: boolean;
      hasDimensions: boolean;
    }[];
    withoutAltList?: { src: string; context: string; elementId?: string | null; snippet?: string }[];
    withoutDimensionsList?: { src: string; alt: string; elementId?: string | null; snippet?: string }[];
    emptyAltList?: { src: string; context: string; elementId?: string | null; snippet?: string }[];
  };
  schema: { count: number; types: string[]; valid: number; invalid: number; details: SchemaItem[]; missingContext: number; hasWebSiteSearch: boolean; hasBreadcrumb: boolean; hasOrganization: boolean; hasFAQ: boolean; hasHowTo: boolean; };
  social: { og: { title: string | null; description: string | null; image: string | null; url: string | null; type: string | null; siteName: string | null; locale: string | null }; twitter: { card: string | null; site: string | null; creator: string | null; title: string | null; description: string | null; image: string | null }; isComplete: boolean; hasArticleTags: boolean; };
  accessibility: { buttonsWithoutLabel: number; inputsWithoutLabel: number; linksWithoutText: number; iframesWithoutTitle: number; skippedHeadings: string[]; hasSkipLink: boolean; hasLangAttribute: boolean; clickableImagesWithoutAlt: number; positiveTabindex: number; hasMainLandmark: boolean; hasNavLandmark: boolean; hasFocusVisible: boolean; colorContrastIssues: number; contrastIssuesList?: { type: string; count: number; details: { element: string; foreground: string; background: string; ratio: number; wcagAA: boolean; wcagAAA: boolean; css?: string }[] }[]; aria: AriaData; tablesWithoutHeaders: number; autoplayMedia: number; };
  dom: DOMData;
  performance: { totalScripts: number; totalStylesheets: number; renderBlockingScripts: number; renderBlockingStyles: number; asyncScripts: number; deferScripts: number; moduleScripts: number; inlineScripts: number; inlineStyles: number; preloads: number; preloadsWithoutAs: number; preconnects: number; prefetches: number; dnsPrefetches: number; fontsWithoutDisplay: number; webFonts: number; criticalCssInlined: boolean; hasServiceWorker: boolean; htmlSize: number; estimatedWeight: string; };
  security: { isHttps: boolean; mixedContentCount: number; mixedContentUrls: string[]; protocolRelativeCount: number; unsafeExternalLinks: number; hasCSP: boolean; hasXFrameOptions: boolean; hasXContentTypeOptions: boolean; hasReferrerPolicy: boolean; hasCORS: boolean; formWithoutAction: number; passwordFieldWithoutAutocomplete: number; };
  platform: { cms: string[]; frameworks: string[]; analytics: string[]; advertising: string[]; renderMethod: string; isCSR: boolean; isPWA: boolean; hasAMP: boolean; };
  trustSignals: { hasAboutPage: boolean; hasContactPage: boolean; hasPrivacyPage: boolean; hasTermsPage: boolean; hasCookiePolicy: boolean; hasAuthor: boolean; hasPublishDate: boolean; hasModifiedDate: boolean; hasCopyright: boolean; hasAddress: boolean; hasPhone: boolean; hasEmail: boolean; socialLinksCount: number; socialPlatforms: string[]; hasSSLBadge: boolean; hasPaymentBadges: boolean; hasReviews: boolean; hasCertifications: boolean; };
  mobile?: { hasViewport: boolean; viewportContent: string | null; hasWidthDeviceWidth: boolean; hasInitialScale: boolean; hasUserScalable: boolean; smallTapTargets: number; tapTargetsList: { element: string; size: string }[]; smallTextElements: number; usesRelativeFontSizes: boolean; hasMediaQueries: boolean; mediaQueryCount: number; hasFlexbox: boolean; hasGrid: boolean; horizontalScrollRisk: boolean; fixedWidthElements: number; fixedWidthList?: { width: string; context: string; elementId?: string | null; snippet?: string }[]; hasThemeColor: boolean; hasAppleMobileWebAppCapable: boolean; hasAppleTouchIcon: boolean; hasManifest: boolean; responsiveImagesCount: number; totalImages: number; score: number; issues: string[] };
  externalResources: { cssFiles: { url: string; isThirdParty: boolean }[]; cssCount: number; jsFiles: { url: string; isThirdParty: boolean; async: boolean; defer: boolean; module: boolean }[]; jsCount: number; fontFiles: { url: string; format: string | null }[]; fontCount: number; googleFonts: string[]; thirdPartyDomains: string[]; thirdPartyCount: number; suggestedPreconnects: string[] };
  issues: AuditIssue[];
  passed: string[];
}

// Brand Colors
const COLORS = {
  primary: '#11225c',
  primaryLight: '#1a3380',
  accent: '#99ff00',
  secondary: '#00ccff',
  highlight: '#ff00ff',
};

// Icons
const Icons = {
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Globe: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
  Code: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,
  Download: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Alert: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Check: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  ChevronDown: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  ChevronUp: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  Loader: () => <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Link: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
  Image: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Share: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
  Shield: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  Zap: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Lock: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Languages: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>,
  FileText: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Eye: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Users: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Brain: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  Sitemap: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>,
  Folder: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  File: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  DOM: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>,
  Chart: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Speed: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Robot: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Crawler: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c0 1.657-4.03 3-9 3s-9-1.343-9-3m18 0c0-1.657-4.03-3-9-3s-9 1.343-9 3m9 9a9 9 0 01-9-9m9 9c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>,
  Tree: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  External: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>,
  Play: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

// Chart Components
const DonutChart = ({ value, size = 120, strokeWidth = 10, color }: { value: number; size?: number; strokeWidth?: number; color: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
    </svg>
  );
};

const BarChart = ({ data, maxValue }: { data: { label: string; value: number; color: string }[]; maxValue?: number }) => {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-20 text-sm text-gray-600 truncate">{item.label}</div>
          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }} />
          </div>
          <div className="w-10 text-sm font-medium text-right">{item.value}</div>
        </div>
      ))}
    </div>
  );
};

const PieChart = ({ data, size = 120 }: { data: { label: string; value: number; color: string }[]; size?: number }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  let currentAngle = 0;
  const segments = data.map(d => {
    const angle = (d.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { ...d, startAngle, angle };
  });

  const describeArc = (startAngle: number, endAngle: number, radius: number) => {
    const start = { x: size / 2 + radius * Math.cos((Math.PI * startAngle) / 180), y: size / 2 + radius * Math.sin((Math.PI * startAngle) / 180) };
    const end = { x: size / 2 + radius * Math.cos((Math.PI * endAngle) / 180), y: size / 2 + radius * Math.sin((Math.PI * endAngle) / 180) };
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${size / 2} ${size / 2} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
  };

  return (
    <svg width={size} height={size}>
      {segments.map((seg, i) => seg.value > 0 && (
        <path key={i} d={describeArc(seg.startAngle - 90, seg.startAngle + seg.angle - 90, size / 2 - 5)} fill={seg.color} className="transition-all duration-500" />
      ))}
    </svg>
  );
};

const HorizontalBar = ({ value, max, color, label }: { value: number; max: number; color: string; label: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm"><span className="text-gray-600">{label}</span><span className="font-medium">{value}</span></div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }} />
    </div>
  </div>
);

// Site Tree Component
const SiteTreeView = ({ node, level = 0 }: { node: SiteTreeNode; level?: number }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="font-mono text-sm">
      <div
        className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-gray-100 ${node.isCurrentPage ? 'bg-yellow-100 font-bold' : ''}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          <span className="text-gray-400">{isExpanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />}</span>
        ) : (
          <span className="w-5" />
        )}
        <span style={{ color: hasChildren ? COLORS.primary : COLORS.secondary }}>
          {hasChildren ? <Icons.Folder /> : <Icons.File />}
        </span>
        <span className={node.isCurrentPage ? 'text-yellow-700' : 'text-gray-700'}>
          {node.path || '/'}
        </span>
        {node.isCurrentPage && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded" style={{ backgroundColor: COLORS.accent, color: COLORS.primary }}>
            Current Page
          </span>
        )}
        {node.status && node.status !== 200 && (
          <span className={`ml-2 px-2 py-0.5 text-xs rounded ${node.status === 301 || node.status === 302 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
            {node.status}
          </span>
        )}
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child, i) => (
            <SiteTreeView key={i} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function SEOChecker() {
  const [url, setUrl] = useState('');
  const [htmlInput, setHtmlInput] = useState('');
  const [inputMode, setInputMode] = useState<'url' | 'html'>('url');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<AuditResult | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);

  // Multi-URL analysis state
  const [multiResults, setMultiResults] = useState<AuditResult[]>([]);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [totalUrls, setTotalUrls] = useState(0);

  const allSections = ['overview', 'issues', 'passed', 'sitemap', 'technical', 'content', 'security', 'international', 'links', 'images', 'schema', 'social', 'platform', 'accessibility', 'dom', 'performance', 'ai', 'trust', 'mobile', 'robots', 'loaded-files'];
  const imageList = results?.images.imageList || [];
  const imagesWithoutAlt = imageList.filter((img) => !img.hasAlt);
  const imagesWithoutDimensions = imageList.filter((img) => !img.hasDimensions);
  const pngImages = results?.images.pngList || [];
  const largeImages = results?.images.imageSizeAnalysis?.largeList || [];

  const handleAnalyze = async () => {
    setError('');
    setResults(null);
    setMultiResults([]);
    setLoading(true);

    try {
      if (inputMode === 'url') {
        // Multi-URL support: split by newlines and filter empty
        const urls = url.split('\n').map(u => u.trim()).filter(u => u && u.startsWith('http'));
        if (urls.length === 0) {
          throw new Error('Please enter at least one valid URL');
        }

        setTotalUrls(urls.length);
        const results: AuditResult[] = [];

        for (let i = 0; i < urls.length; i++) {
          setCurrentUrlIndex(i + 1);
          try {
            const res = await fetch('/api/audit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: urls[i] })
            });
            const data = await res.json();
            if (res.ok) {
              results.push(data);
            }
          } catch {
            // Continue with next URL on error
          }
        }

        if (results.length === 0) {
          throw new Error('Failed to analyze any URLs');
        }

        setMultiResults(results);
        setResults(results[0]); // Show first result by default
        setExpanded(allSections.reduce((acc, s) => ({ ...acc, [s]: true }), {}));
      } else {
        // HTML mode - single page
        const res = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: htmlInput, url })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Audit failed');
        setResults(data);
        setMultiResults([data]);
        setExpanded(allSections.reduce((acc, s) => ({ ...acc, [s]: true }), {}));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
      setCurrentUrlIndex(0);
      setTotalUrls(0);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && (file.type === 'text/html' || file.name.endsWith('.html'))) {
      const reader = new FileReader();
      reader.onload = (ev) => { setHtmlInput(ev.target?.result as string); setInputMode('html'); };
      reader.readAsText(file);
    }
  }, []);

  // Sort issues by severity (critical first)
  const sortedIssues = (issues: AuditIssue[]) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...issues].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  };

  const exportData = (format: 'json' | 'csv' | 'html' | 'pdf') => {
    if (!results) return;
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `seo-audit-${new Date().toISOString().split('T')[0]}.json`; a.click();
    } else if (format === 'csv') {
      const rows = [['Category', 'Issue', 'Severity', 'Location', 'Fix']];
      results.issues.forEach(i => rows.push([i.category, i.issue, i.severity, i.location, i.fix]));
      const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `seo-audit-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    } else {
      const reportEl = document.getElementById('seo-audit-report');
      if (!reportEl) return;
      const styles = Array.from(document.styleSheets).map((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((rule) => rule.cssText).join('\n');
        } catch {
          return '';
        }
      }).join('\n');
      const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SEO Audit Export</title>
  <style>
    body { margin: 0; background: #ffffff; }
    ${styles}
  </style>
</head>
<body>
  ${reportEl.outerHTML}
</body>
</html>`;
      if (format === 'pdf') {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 300);
      } else {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `seo-audit-${new Date().toISOString().split('T')[0]}.html`; a.click();
      }
    }
  };

  const toggleAllSections = (expandAll: boolean) => {
    setExpanded(allSections.reduce((acc, sectionId) => ({ ...acc, [sectionId]: expandAll }), {}));
  };

  const getScoreColor = (s: number) => s >= 90 ? '#10b981' : s >= 70 ? '#f59e0b' : s >= 50 ? '#f97316' : '#ef4444';
  const getSeverityStyle = (sev: string) => ({ critical: 'bg-red-100 text-red-800 border-red-200', high: 'bg-orange-100 text-orange-800 border-orange-200', medium: 'bg-yellow-100 text-yellow-800 border-yellow-200', low: 'bg-blue-100 text-blue-800 border-blue-200' }[sev] || 'bg-gray-100');
  const getSeverityLabel = (sev: string) => ({ critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }[sev] || sev);

  const Section = ({ title, icon: Icon, id, children, badge }: { title: string; icon: React.FC; id: string; children: React.ReactNode; badge?: React.ReactNode }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <button onClick={() => setExpanded(s => ({ ...s, [id]: !s[id] }))} className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50">
        <div className="flex items-center gap-3"><Icon /><span className="font-semibold text-gray-800">{title}</span>{badge}</div>
        {expanded[id] ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
      </button>
      {expanded[id] && <div className="px-5 pb-5 border-t border-gray-100">{children}</div>}
    </div>
  );

  const CheckBadge = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className={`flex items-center gap-1.5 text-sm ${ok ? 'text-green-700' : 'text-red-700'}`}>
      {ok ? <Icons.Check /> : <Icons.Alert />} {label}
    </div>
  );

  return (
    <div id="seo-audit-report" className="min-h-screen" style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 50%, ${COLORS.primary} 100%)` }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(90deg, #e5e7eb 0%, ${COLORS.secondary} 55%, ${COLORS.primaryLight} 100%)` }} className="text-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <div className="flex items-center justify-start">
              <img
                src="https://www.web-seo.pro/wp-content/uploads/2024/07/webseologo.png"
                alt="Web & SEO logo"
                className="w-16 h-16 object-contain"
              />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold" style={{ color: COLORS.primary }}>SEO Audit Tool</h1>
              <p style={{ color: COLORS.primaryLight }} className="mt-1">Complete On-Page & Technical SEO Analysis</p>
            </div>
            <div className="w-12 h-12" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Input */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex gap-3 mb-5">
            <button onClick={() => { setInputMode('url'); setResults(null); setError(''); }} className="px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all" style={inputMode === 'url' ? { backgroundColor: COLORS.primary, color: COLORS.accent } : { backgroundColor: '#f3f4f6', color: '#4b5563' }}><Icons.Globe /> By URL</button>
            <button onClick={() => { setInputMode('html'); setResults(null); setError(''); }} className="px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all" style={inputMode === 'html' ? { backgroundColor: COLORS.primary, color: COLORS.accent } : { backgroundColor: '#f3f4f6', color: '#4b5563' }}><Icons.Code /> Paste HTML</button>
          </div>

          {inputMode === 'url' ? (
            <div>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: COLORS.secondary }}><Icons.Globe /></div>
                  <textarea
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter one or more URLs (one per line)&#10;https://example.com&#10;https://example.com/page2"
                    className="w-full pl-12 pr-4 py-3 border-2 rounded-xl outline-none focus:ring-2 min-h-[100px] resize-y"
                    style={{ borderColor: COLORS.primary }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mt-3">
                <p className="text-sm text-gray-500">Enter multiple URLs (one per line) for batch analysis. If protected by Cloudflare, use &quot;Paste HTML&quot; mode.</p>
                <button onClick={handleAnalyze} disabled={loading || !url} className="px-8 py-3 font-semibold rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-all hover:opacity-90" style={{ backgroundColor: COLORS.accent, color: COLORS.primary }}>{loading ? <Icons.Loader /> : <Icons.Search />} Analyze</button>
              </div>
            </div>
          ) : (
            <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}>
              <div className="flex gap-3 mb-3">
                <div className="flex-1 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Icons.Globe /></div>
                  <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL (optional)" className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl outline-none" style={{ borderColor: url ? COLORS.primary : undefined }} />
                </div>
              </div>
              <textarea value={htmlInput} onChange={(e) => setHtmlInput(e.target.value)} placeholder={`Paste HTML code here...\n\nHow to get HTML:\n1. Open the page in browser\n2. Press Ctrl+U (Windows) or Cmd+Option+U (Mac)\n3. Select all (Ctrl+A) and copy (Ctrl+C)\n4. Paste here\n\nOr drag and drop an HTML file here`} className={`w-full h-48 px-4 py-3 border-2 rounded-xl font-mono text-sm resize-none ${isDragging ? 'border-dashed' : 'border-gray-200'}`} style={isDragging ? { borderColor: COLORS.secondary, backgroundColor: 'rgba(0, 204, 255, 0.1)' } : {}} />
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500">{htmlInput ? `${htmlInput.length.toLocaleString()} characters` : ''}</span>
                <button onClick={handleAnalyze} disabled={loading || !htmlInput} className="px-8 py-3 font-semibold rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-all hover:opacity-90" style={{ backgroundColor: COLORS.accent, color: COLORS.primary }}>{loading ? <Icons.Loader /> : <Icons.Search />} Analyze</button>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-center gap-3">
            <button onClick={() => toggleAllSections(true)} className="px-4 py-2 rounded-lg font-medium text-sm transition-opacity hover:opacity-90" style={{ background: 'linear-gradient(90deg, #1d4ed8 0%, #ff00ff 100%)', color: '#ffffff' }}>Open all sections</button>
            <button onClick={() => toggleAllSections(false)} className="px-4 py-2 rounded-lg font-medium text-sm transition-opacity hover:opacity-90" style={{ background: 'linear-gradient(90deg, #1d4ed8 0%, #ff00ff 100%)', color: '#ffffff' }}>Collapse all sections</button>
          </div>
          <div className="mt-2 text-center text-sm" style={{ color: COLORS.primary }}>
            Use this toggle to quickly expand or collapse every report block.
          </div>

          {/* Multi-URL Progress */}
          {loading && totalUrls > 1 && (
            <div className="mt-5 p-4 rounded-xl" style={{ backgroundColor: `${COLORS.secondary}15` }}>
              <div className="flex items-center gap-3">
                <Icons.Loader />
                <span style={{ color: COLORS.primary }}>Analyzing URL {currentUrlIndex} of {totalUrls}...</span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(currentUrlIndex / totalUrls) * 100}%`, backgroundColor: COLORS.accent }} />
              </div>
            </div>
          )}

          {error && <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"><span className="text-red-600"><Icons.Alert /></span><span className="text-red-700">{error}</span></div>}
        </div>

        {/* Multi-URL Results Selector */}
        {multiResults.length > 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-medium" style={{ color: COLORS.primary }}>Results for:</span>
              {multiResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setResults(r)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${results?.url === r.url ? 'text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  style={results?.url === r.url ? { backgroundColor: COLORS.primary } : {}}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${r.score >= 70 ? 'bg-green-500' : r.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    {new URL(r.url).pathname || '/'}
                    <span className="opacity-70">({r.score})</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Score Overview with Charts */}
            <Section title="Overview" icon={Icons.Chart} id="overview">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                {/* Score Donut */}
                <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                  <div className="relative">
                    <DonutChart value={results.score} size={140} strokeWidth={12} color={getScoreColor(results.score)} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold" style={{ color: getScoreColor(results.score) }}>{results.score}</div>
                        <div className="text-gray-500 text-sm">/ 100</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <div className="font-semibold text-gray-800">{results.score >= 90 ? 'Excellent!' : results.score >= 70 ? 'Good' : results.score >= 50 ? 'Average' : 'Needs Improvement'}</div>
                    <div className="text-sm text-gray-500 mt-1 truncate max-w-xs">{results.url}</div>
                  </div>
                </div>

                {/* Issues Bar Chart */}
                <div className="p-6 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-4">Issues by Severity</h3>
                  <BarChart data={[
                    { label: 'Critical', value: results.summary.criticalIssues, color: '#ef4444' },
                    { label: 'High', value: results.summary.highIssues, color: '#f97316' },
                    { label: 'Medium', value: results.summary.mediumIssues, color: '#eab308' },
                    { label: 'Low', value: results.summary.lowIssues, color: '#3b82f6' },
                  ]} />
                </div>

                {/* Links Pie Chart */}
                {(() => {
                  // Combine all broken link sources: empty hrefs + internal 404 + external 404
                  const emptyHrefs = results.links.brokenList?.length || 0;
                  const brokenInternal = results.links.brokenInternalList?.length || 0;
                  const brokenExternal = results.links.brokenExternalList?.length || 0;
                  const brokenCount = emptyHrefs + brokenInternal + brokenExternal;
                  return (
                    <div className="p-6 bg-gray-50 rounded-xl">
                      <h3 className="font-semibold text-gray-800 mb-4">Links Distribution</h3>
                      <div className="flex items-center justify-center gap-4">
                        <PieChart data={[
                          { label: 'Internal', value: results.links.internal, color: COLORS.accent },
                          { label: 'External', value: results.links.external, color: COLORS.secondary },
                          { label: 'Broken', value: brokenCount, color: '#ef4444' },
                        ]} size={100} />
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.accent }} /><span>Internal: {results.links.internal}</span></div>
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.secondary }} /><span>External: {results.links.external}</span></div>
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span>Broken: {brokenCount}</span></div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-6">
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: `${COLORS.primary}10` }}><div className="text-2xl font-bold" style={{ color: COLORS.primary }}>{results.summary.totalChecks}</div><div className="text-xs text-gray-600">Checks</div></div>
                <div className="p-3 bg-green-50 rounded-lg text-center"><div className="text-2xl font-bold text-green-700">{results.summary.passedChecks}</div><div className="text-xs text-green-600">Passed</div></div>
                <div className="p-3 bg-red-50 rounded-lg text-center"><div className="text-2xl font-bold text-red-700">{results.issues.length}</div><div className="text-xs text-red-600">Issues</div></div>
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: `${COLORS.secondary}15` }}><div className="text-2xl font-bold" style={{ color: COLORS.primary }}>{results.content.wordCount}</div><div className="text-xs text-gray-600">Words</div></div>
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: `${COLORS.highlight}10` }}><div className="text-2xl font-bold" style={{ color: COLORS.highlight }}>{results.images.total}</div><div className="text-xs text-gray-600">Images</div></div>
                <div className="p-3 bg-amber-50 rounded-lg text-center"><div className="text-2xl font-bold text-amber-700">{results.schema.count}</div><div className="text-xs text-amber-600">Schema</div></div>
                <div className="p-3 bg-teal-50 rounded-lg text-center"><div className="text-2xl font-bold text-teal-700">{(results.content.readability?.fleschScore || 0).toFixed(1)}</div><div className="text-xs text-teal-600">Flesch Score</div></div>
              </div>

              {/* Export Buttons */}
              <div className="flex gap-2 mt-6">
                <button onClick={() => exportData('json')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm"><Icons.Download /> Export JSON</button>
                <button onClick={() => exportData('csv')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm"><Icons.Download /> Export CSV</button>
                <button onClick={() => exportData('html')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm"><Icons.Download /> Export HTML</button>
                <button onClick={() => exportData('pdf')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm"><Icons.Download /> Export PDF</button>
              </div>
            </Section>

            {/* Issues - Sorted by severity (Critical first) */}
            <Section title="Issues Found" icon={Icons.Alert} id="issues" badge={<span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-sm">{results.issues.length}</span>}>
              <div className="space-y-3 mt-4">
                {sortedIssues(results.issues).map((issue, i) => (
                  <div key={i} className={`p-4 rounded-lg border ${getSeverityStyle(issue.severity)}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium">{issue.issue}</div>
                        <div className="text-sm mt-1 opacity-80"><code className="bg-white/50 px-1 rounded">{issue.location}</code></div>
                        {issue.current && <div className="text-xs mt-1 opacity-70 truncate max-w-md">Current: {issue.current}</div>}
                        {issue.details && <div className="text-xs mt-1 opacity-70">{issue.details}</div>}

                        {/* Show broken links list with full HTML and reason */}
                        {issue.id === 'broken-links' && results.links.brokenList && results.links.brokenList.length > 0 && (
                          <div className="mt-2 p-2 bg-white/30 rounded text-xs space-y-2">
                            <div className="font-medium">Broken Links:</div>
                            {results.links.brokenList.map((link: { href: string; text: string; reason?: string; htmlTag?: string }, j: number) => (
                              <div key={j} className="space-y-1 p-2 bg-white/40 rounded border-l-2 border-red-500">
                                <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs overflow-x-auto whitespace-pre">
                                  {link.htmlTag || `<a href="${link.href}">${link.text || '(no text)'}</a>`}
                                </code>
                                {link.reason && (
                                  <div className="text-red-700 font-medium">Warning: {link.reason}</div>
                                )}
                                <div className="text-gray-600 text-xs">
                                  <strong>Recommendation:</strong> {
                                    link.href === '""' || link.href === '' ? 'Add a valid URL or use <button> for interactive elements' :
                                    link.href?.startsWith('javascript:') ? 'Use <button> instead of JavaScript - better for SEO and accessibility' :
                                    'Fix or remove this link'
                                  }
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Show generic anchors list */}
                        {issue.id === 'generic-anchors' && results.links.genericAnchorsList && results.links.genericAnchorsList.length > 0 && (
                          <div className="mt-2 p-2 bg-white/30 rounded text-xs space-y-1">
                            <div className="font-medium">Generic Anchors:</div>
                            {results.links.genericAnchorsList.slice(0, 5).map((link: { text: string; href: string }, j: number) => (
                              <div key={j} className="flex gap-2 items-center">
                                <span className="text-yellow-600">•</span>
                                <code className="bg-white/50 px-1 rounded">&quot;{link.text}&quot;</code>
                                <span className="opacity-60 truncate max-w-xs">→ {link.href}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Show mixed content URLs */}
                        {issue.id === 'mixed-content' && results.security.mixedContentUrls && results.security.mixedContentUrls.length > 0 && (
                          <div className="mt-2 p-2 bg-white/30 rounded text-xs space-y-1">
                            <div className="font-medium">HTTP resources on HTTPS page:</div>
                            {results.security.mixedContentUrls.map((mixedUrl: string, j: number) => (
                              <div key={j} className="flex gap-2 items-center">
                                <span className="text-red-600">•</span>
                                <code className="bg-white/50 px-1 rounded truncate max-w-md">{mixedUrl}</code>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Show duplicate IDs */}
                        {issue.id === 'duplicate-ids' && results.dom.duplicateIds && results.dom.duplicateIds.length > 0 && (
                          <div className="mt-2 p-2 bg-white/30 rounded text-xs">
                            <span className="font-medium">Duplicate IDs: </span>
                            {results.dom.duplicateIds.map((id: string, j: number) => (
                              <code key={j} className="bg-white/50 px-1 rounded mx-0.5">#{id}</code>
                            ))}
                          </div>
                        )}

                        {/* Show deprecated elements */}
                        {issue.id === 'deprecated' && results.dom.deprecatedElements && results.dom.deprecatedElements.length > 0 && (
                          <div className="mt-2 p-2 bg-white/30 rounded text-xs">
                            <span className="font-medium">Deprecated tags: </span>
                            {results.dom.deprecatedElements.map((el: string, j: number) => (
                              <code key={j} className="bg-white/50 px-1 rounded mx-0.5">&lt;{el}&gt;</code>
                            ))}
                          </div>
                        )}

                        {/* Show skipped headings */}
                        {issue.id === 'skipped-headings' && results.accessibility.skippedHeadings && results.accessibility.skippedHeadings.length > 0 && (
                          <div className="mt-2 p-2 bg-white/30 rounded text-xs">
                            <span className="font-medium">Skipped: </span>
                            {results.accessibility.skippedHeadings.map((skip: string, j: number) => (
                              <code key={j} className="bg-white/50 px-1 rounded mx-0.5">{skip}</code>
                            ))}
                          </div>
                        )}

                        {/* Show missing landmarks */}
                        {issue.id === 'missing-landmarks' && results.accessibility.aria?.missingLandmarks && (
                          <div className="mt-2 p-2 bg-white/30 rounded text-xs">
                            <span className="font-medium">Missing: </span>
                            {results.accessibility.aria.missingLandmarks.map((lm: string, j: number) => (
                              <code key={j} className="bg-white/50 px-1 rounded mx-0.5">{lm}</code>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded bg-white/50 whitespace-nowrap">{getSeverityLabel(issue.severity)}</span>
                    </div>
                    <div className="text-sm mt-2 opacity-90"><strong>Fix:</strong> {issue.fix}</div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Passed */}
            <Section title="Passed Checks" icon={Icons.Check} id="passed" badge={<span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-sm">{results.passed.length}</span>}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
                {results.passed.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg text-sm"><Icons.Check /> {p}</div>
                ))}
              </div>
            </Section>

            {/* Sitemap & Site Tree - Always show */}
            <Section title="Sitemap & Site Structure" icon={Icons.Sitemap} id="sitemap" badge={results.technical.siteTree ? <span className="px-2 py-0.5 rounded-full text-sm" style={{ backgroundColor: `${COLORS.secondary}20`, color: COLORS.primary }}>{results.technical.siteTree.totalUrls} URLs</span> : null}>
              <div className="mt-4 space-y-4">
                {/* Sitemap Status */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-lg text-center ${results.technical.sitemap?.found ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className={`text-2xl font-bold ${results.technical.sitemap?.found ? 'text-green-700' : 'text-red-700'}`}>{results.technical.sitemap?.found ? '✓' : '✗'}</div>
                    <div className="text-sm text-gray-500">Sitemap Found</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <div className="text-2xl font-bold" style={{ color: COLORS.primary }}>{results.technical.sitemap?.urlCount || 0}</div>
                    <div className="text-sm text-gray-500">URLs in Sitemap</div>
                  </div>
                  <div className={`p-4 rounded-lg text-center ${results.technical.sitemap?.pageInSitemap ? 'bg-green-50' : 'bg-yellow-50'}`}>
                    <div className={`text-2xl font-bold ${results.technical.sitemap?.pageInSitemap ? 'text-green-700' : 'text-yellow-700'}`}>{results.technical.sitemap?.pageInSitemap ? '✓' : '✗'}</div>
                    <div className="text-sm text-gray-500">Page in Sitemap</div>
                  </div>
                  <div className={`p-4 rounded-lg text-center ${results.technical.robotsTxt?.found ? 'bg-green-50' : 'bg-yellow-50'}`}>
                    <div className={`text-2xl font-bold ${results.technical.robotsTxt?.found ? 'text-green-700' : 'text-yellow-700'}`}>{results.technical.robotsTxt?.found ? '✓' : '✗'}</div>
                    <div className="text-sm text-gray-500">Robots.txt</div>
                  </div>
                </div>

                {/* Sitemap URL */}
                {results.technical.sitemap?.url && (
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${COLORS.secondary}10` }}>
                    <span className="text-sm text-gray-600">Sitemap URL: </span>
                    <code className="text-sm" style={{ color: COLORS.primary }}>{results.technical.sitemap.url}</code>
                  </div>
                )}

                {/* Site Tree if available */}
                {results.technical.siteTree && (
                  <>
                    {/* Site tree stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg text-center" style={{ backgroundColor: `${COLORS.primary}10` }}>
                        <div className="text-2xl font-bold" style={{ color: COLORS.primary }}>{results.technical.siteTree.totalUrls}</div>
                        <div className="text-sm text-gray-500">Total in Sitemap</div>
                      </div>
                      <div className="p-4 rounded-lg text-center" style={{ backgroundColor: `${COLORS.accent}15` }}>
                        <div className="text-2xl font-bold" style={{ color: COLORS.primary }}>{results.technical.siteTree.displayedUrls || results.technical.siteTree.sitemapUrls.length}</div>
                        <div className="text-sm text-gray-500">Displayed</div>
                      </div>
                      <div className="p-4 rounded-lg text-center bg-gray-50">
                        <div className="text-2xl font-bold text-gray-700">{results.technical.siteTree.sitemapUrls.length}</div>
                        <div className="text-sm text-gray-500">Tree URLs</div>
                      </div>
                      <div className={`p-4 rounded-lg text-center ${results.technical.siteTree.issues.length > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                        <div className={`text-2xl font-bold ${results.technical.siteTree.issues.length > 0 ? 'text-red-700' : 'text-green-700'}`}>{results.technical.siteTree.issues.length}</div>
                        <div className="text-sm text-gray-500">Issues</div>
                      </div>
                    </div>

                    {/* Show note when URLs are limited */}
                    {results.technical.siteTree.totalUrls > (results.technical.siteTree.displayedUrls || results.technical.siteTree.sitemapUrls.length) && (
                      <div className="p-3 rounded-lg bg-blue-50 text-sm text-blue-700">
                        Showing {results.technical.siteTree.displayedUrls || results.technical.siteTree.sitemapUrls.length} of {results.technical.siteTree.totalUrls} total URLs in sitemap for performance.
                      </div>
                    )}

                    {/* Current page path */}
                    {results.technical.siteTree.currentPagePath.length > 0 && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: `${COLORS.accent}15` }}>
                        <div className="text-sm font-medium mb-2" style={{ color: COLORS.primary }}>Current Page Location:</div>
                        <div className="flex items-center gap-2 flex-wrap font-mono text-sm">
                          {results.technical.siteTree.currentPagePath.map((segment, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && <Icons.ChevronRight />}
                              <span className={i === results.technical.siteTree!.currentPagePath.length - 1 ? 'font-bold' : ''} style={{ color: i === results.technical.siteTree!.currentPagePath.length - 1 ? COLORS.primary : '#6b7280' }}>{segment || '/'}</span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Site tree visualization */}
                    <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-auto border" style={{ borderColor: `${COLORS.primary}20` }}>
                      <div className="text-sm font-medium mb-3" style={{ color: COLORS.primary }}>Site Structure Tree:</div>
                      <SiteTreeView node={results.technical.siteTree.tree} />
                    </div>

                    {/* Sitemap issues */}
                    {results.technical.siteTree.issues.length > 0 && (
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-sm font-medium text-red-800 mb-2">Sitemap Issues Found:</div>
                        <div className="space-y-2">
                          {results.technical.siteTree.issues.map((issue, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className={issue.status === 404 ? 'text-red-600' : 'text-yellow-600'}>•</span>
                              <code className="bg-white/50 px-2 py-1 rounded truncate max-w-md">{issue.url}</code>
                              <span className="text-gray-600">— {issue.issue}</span>
                              {issue.status && <span className={`px-2 py-0.5 rounded text-xs ${issue.status === 404 ? 'bg-red-200 text-red-700' : 'bg-yellow-200 text-yellow-700'}`}>{issue.status}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* No site tree available message */}
                {!results.technical.siteTree && results.fetchMethod === 'html' && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${COLORS.secondary}10` }}>
                    <div className="text-sm" style={{ color: COLORS.primary }}>
                      <strong>Note:</strong> Site tree visualization requires URL mode. Use &quot;By URL&quot; input to see the full site structure.
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* Content & Readability */}
            <Section title="Content & Readability" icon={Icons.FileText} id="content">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {/* Readability Gauge */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-medium text-gray-700 mb-4">Flesch Reading Score</h4>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <DonutChart value={results.content.readability?.fleschScore || 0} size={100} strokeWidth={10} color={results.content.readability?.fleschScore >= 60 ? '#10b981' : results.content.readability?.fleschScore >= 30 ? '#f59e0b' : '#ef4444'} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">{(results.content.readability?.fleschScore || 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{results.content.readability?.fleschGrade || '—'}</div>
                      <div className="text-sm text-gray-500 mt-1">Avg sentence length: {results.content.readability?.avgSentenceLength || 0}</div>
                      <div className="text-sm text-gray-500">Complex words: {results.content.readability?.complexWordPercentage || 0}%</div>
                    </div>
                  </div>
                </div>

                {/* Word Stats */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-medium text-gray-700 mb-4">Content Statistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><div className="text-2xl font-bold text-gray-800">{results.content.wordCount.toLocaleString()}</div><div className="text-sm text-gray-500">Words</div></div>
                    <div><div className="text-2xl font-bold text-gray-800">{results.content.sentenceCount || 0}</div><div className="text-sm text-gray-500">Sentences</div></div>
                    <div><div className="text-2xl font-bold text-gray-800">{results.content.paragraphCount || 0}</div><div className="text-sm text-gray-500">Paragraphs</div></div>
                    <div><div className="text-2xl font-bold text-gray-800">~{results.content.readingTime}</div><div className="text-sm text-gray-500">Min to read</div></div>
                  </div>
                </div>

                {/* Keyword Density */}
                {results.content.keywordDensity && results.content.keywordDensity.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-xl lg:col-span-2">
                    <h4 className="font-medium text-gray-700 mb-4">Keyword Density (Top 10)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {results.content.keywordDensity.slice(0, 10).map((kw, i) => (
                        <div key={i} className="bg-white p-3 rounded-lg text-center">
                          <div className="font-medium text-gray-800 truncate">{kw.word}</div>
                          <div className="text-sm text-gray-500">{kw.count}x ({kw.percentage}%)</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Headings */}
                <div className="p-4 bg-gray-50 rounded-xl lg:col-span-2">
                  <h4 className="font-medium text-gray-700 mb-4">Heading Structure</h4>
                  <BarChart data={[
                    { label: 'H1', value: results.content.headings.h1.length, color: '#ef4444' },
                    { label: 'H2', value: results.content.headings.h2.length, color: '#f97316' },
                    { label: 'H3', value: results.content.headings.h3.length, color: '#eab308' },
                    { label: 'H4', value: results.content.headings.h4.length, color: '#22c55e' },
                    { label: 'H5', value: results.content.headings.h5.length, color: '#3b82f6' },
                    { label: 'H6', value: results.content.headings.h6.length, color: '#8b5cf6' },
                  ]} />
                </div>
              </div>
            </Section>

            {/* Technical */}
            <Section title="Technical Details" icon={Icons.Shield} id="technical">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Title</div>
                  <div className="font-medium text-sm">{results.technical.title.value || '—'}</div>
                  <HorizontalBar value={results.technical.title.length} max={70} color={results.technical.title.isOptimal ? '#10b981' : '#f59e0b'} label={`${results.technical.title.length}/60 chars`} />
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Meta Description</div>
                  <div className="font-medium text-sm truncate">{results.technical.metaDesc.value?.substring(0, 80) || '—'}</div>
                  <HorizontalBar value={results.technical.metaDesc.length} max={170} color={results.technical.metaDesc.isOptimal ? '#10b981' : '#f59e0b'} label={`${results.technical.metaDesc.length}/160 chars`} />
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-3">Technical Checks</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <CheckBadge ok={!!results.technical.viewport.isMobileOptimized} label="Viewport" />
                  <CheckBadge ok={!!results.technical.charset} label="Charset" />
                  <CheckBadge ok={!!results.technical.language} label={`Lang: ${results.technical.language || '—'}`} />
                  <CheckBadge ok={results.technical.favicon} label="Favicon" />
                  <CheckBadge ok={results.security.isHttps} label="HTTPS" />
                  <CheckBadge ok={!results.technical.robots.hasNoindex} label={results.technical.robots.hasNoindex ? 'NOINDEX!' : 'Indexable'} />
                  <CheckBadge ok={!results.platform.isCSR} label={results.platform.isCSR ? 'CSR' : 'SSR/SSG'} />
                  <CheckBadge ok={results.technical.llmsTxt?.found || false} label="llms.txt" />
                  <CheckBadge ok={results.accessibility.hasSkipLink} label="Skip Link" />
                  <CheckBadge ok={results.technical.appleTouchIcon} label="Apple Icon" />
                  <CheckBadge ok={results.technical.manifestJson || false} label="Manifest" />
                  <CheckBadge ok={!!results.technical.canonical.href} label="Canonical" />
                </div>
              </div>

              {/* WWW Redirect Check */}
              {results.technical.wwwRedirect && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-3">WWW Redirect</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <CheckBadge ok={results.technical.wwwRedirect.wwwRedirectsToNonWww || results.technical.wwwRedirect.nonWwwRedirectsToWww} label="Redirect configured" />
                    <CheckBadge ok={!results.technical.wwwRedirect.bothAccessible} label={results.technical.wwwRedirect.bothAccessible ? 'Both accessible (bad)' : 'Single version'} />
                    <div className="text-sm text-gray-600">Preferred: <strong>{results.technical.wwwRedirect.preferredVersion}</strong></div>
                  </div>
                  {results.technical.wwwRedirect.issue && (
                    <div className="mt-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">{results.technical.wwwRedirect.issue}</div>
                  )}
                </div>
              )}

              {/* HTTPS Redirect Check */}
              {results.technical.httpsRedirect && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-3">HTTPS Redirect</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <CheckBadge ok={results.technical.httpsRedirect.httpRedirectsToHttps} label="HTTP redirects to HTTPS" />
                    <CheckBadge ok={results.technical.httpsRedirect.httpsAccessible} label="HTTPS accessible" />
                  </div>
                  {results.technical.httpsRedirect.issue && (
                    <div className="mt-2 text-sm text-red-700 bg-red-50 p-2 rounded">{results.technical.httpsRedirect.issue}</div>
                  )}
                </div>
              )}

              {/* Robots.txt Validation */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  Robots.txt
                  <span className={`px-2 py-0.5 rounded-full text-xs ${results.technical.robotsTxt.found ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {results.technical.robotsTxt.found ? 'Found' : 'Not Found'}
                  </span>
                </div>
                {results.technical.robotsTxt.found ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <CheckBadge ok={!results.technical.robotsTxt.blocksAll} label={results.technical.robotsTxt.blocksAll ? 'BLOCKS ALL!' : 'Allows crawling'} />
                      <CheckBadge ok={results.technical.robotsTxt.hasSitemap} label="Has sitemap reference" />
                      <CheckBadge ok={results.technical.sitemap.found} label="Sitemap exists" />
                    </div>
                    {results.technical.robotsTxt.content && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">View robots.txt content</summary>
                        <pre className="mt-2 p-3 bg-gray-800 text-green-400 rounded text-xs overflow-auto max-h-48 whitespace-pre-wrap">{results.technical.robotsTxt.content}</pre>
                      </details>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-500">
                    No robots.txt found. Consider adding one to control crawler access.
                  </div>
                )}
              </div>

              {/* LLMs.txt */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  LLMs.txt
                  <span className={`px-2 py-0.5 rounded-full text-xs ${results.technical.llmsTxt?.found ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {results.technical.llmsTxt?.found ? 'Found' : 'Not Found'}
                  </span>
                </div>
                {results.technical.llmsTxt?.found ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <CheckBadge ok={results.technical.llmsTxt.found} label="llms.txt exists" />
                      <CheckBadge ok={results.technical.llmsTxt.mentioned} label="Mentions website" />
                    </div>
                    {results.technical.llmsTxt.content && (
                      <details>
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">View llms.txt content</summary>
                        <pre className="mt-2 p-3 bg-gray-800 text-green-400 rounded text-xs overflow-auto max-h-[500px] whitespace-pre-wrap">{results.technical.llmsTxt.content}</pre>
                      </details>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-500">
                    LLMs.txt helps AI assistants understand your site. <a href="https://llmstxt.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Learn more</a>
                  </div>
                )}
              </div>
            </Section>

            {/* DOM Analysis */}
            {results.dom && (
              <Section title="DOM Analysis" icon={Icons.DOM} id="dom">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <div className={`text-2xl font-bold ${results.dom.totalElements > 1500 ? 'text-red-600' : 'text-gray-800'}`}>{results.dom.totalElements.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Elements</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <div className={`text-2xl font-bold ${results.dom.maxDepth > 32 ? 'text-red-600' : 'text-gray-800'}`}>{results.dom.maxDepth}</div>
                    <div className="text-sm text-gray-500">Max Depth</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-gray-800">{results.dom.averageDepth}</div>
                    <div className="text-sm text-gray-500">Avg Depth</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <div className={`text-2xl font-bold ${results.dom.duplicateIds.length > 0 ? 'text-red-600' : 'text-green-600'}`}>{results.dom.duplicateIds.length}</div>
                    <div className="text-sm text-gray-500">Duplicate IDs</div>
                  </div>
                </div>
                {results.dom.deprecatedElements.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <div className="text-sm font-medium text-yellow-800">Deprecated elements: {results.dom.deprecatedElements.join(', ')}</div>
                  </div>
                )}
              </Section>
            )}

            {/* Accessibility */}
            <Section title="Accessibility (A11y)" icon={Icons.Eye} id="accessibility">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className={`p-4 rounded-lg text-center ${results.accessibility.buttonsWithoutLabel === 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className={`text-2xl font-bold ${results.accessibility.buttonsWithoutLabel === 0 ? 'text-green-700' : 'text-red-700'}`}>{results.accessibility.buttonsWithoutLabel}</div>
                  <div className="text-sm text-gray-600">Buttons w/o label</div>
                </div>
                <div className={`p-4 rounded-lg text-center ${results.accessibility.inputsWithoutLabel === 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className={`text-2xl font-bold ${results.accessibility.inputsWithoutLabel === 0 ? 'text-green-700' : 'text-red-700'}`}>{results.accessibility.inputsWithoutLabel}</div>
                  <div className="text-sm text-gray-600">Inputs w/o label</div>
                </div>
                <div className={`p-4 rounded-lg text-center ${results.accessibility.linksWithoutText === 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className={`text-2xl font-bold ${results.accessibility.linksWithoutText === 0 ? 'text-green-700' : 'text-red-700'}`}>{results.accessibility.linksWithoutText}</div>
                  <div className="text-sm text-gray-600">Links w/o text</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-700">{results.accessibility.aria?.ariaLabels || 0}</div>
                  <div className="text-sm text-gray-600">ARIA Labels</div>
                </div>
              </div>
              {results.accessibility.aria?.missingLandmarks && results.accessibility.aria.missingLandmarks.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <div className="text-sm font-medium text-yellow-800">Missing Landmarks: {results.accessibility.aria.missingLandmarks.join(', ')}</div>
                </div>
              )}

              {/* Contrast Issues (WCAG AA: 4.5:1) */}
              {results.accessibility.colorContrastIssues > 0 && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Icons.Alert />
                    <span className="font-semibold text-red-800">Contrast Issues (WCAG AA: 4.5:1)</span>
                    <span className="px-2 py-0.5 bg-red-200 text-red-800 rounded-full text-xs">{results.accessibility.colorContrastIssues} issues</span>
                  </div>

                  {results.accessibility.contrastIssuesList && results.accessibility.contrastIssuesList.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-sm text-red-700 font-medium">Sections with low contrast:</div>
                      {results.accessibility.contrastIssuesList.map((category, i) => (
                        <div key={i} className="bg-white/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-800">{category.type}</span>
                            <span className="text-sm text-red-600">{category.count} issues</span>
                          </div>
                          {category.details && category.details.slice(0, 5).map((detail, j) => (
                            <div key={j} className="mt-2 p-2 bg-gray-50 rounded border-l-2 border-red-400">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">FG:</span>
                                  <div className="w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: detail.foreground }} title={detail.foreground} />
                                  <code className="text-xs bg-gray-100 px-1 rounded">{detail.foreground}</code>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">BG:</span>
                                  <div className="w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: detail.background }} title={detail.background} />
                                  <code className="text-xs bg-gray-100 px-1 rounded">{detail.background}</code>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">Ratio:</span>
                                  <span className={`font-mono text-sm font-bold ${detail.ratio >= 4.5 ? 'text-green-600' : detail.ratio >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {detail.ratio.toFixed(2)}:1
                                  </span>
                                </div>
                              </div>
                              {detail.element && (
                                <code className="block text-xs bg-gray-800 text-green-400 p-2 rounded overflow-x-auto whitespace-pre">
                                  {detail.element}
                                </code>
                              )}
                              {detail.css && (
                                <div className="mt-1 text-xs text-gray-600">
                                  <span className="font-medium">CSS: </span>
                                  <code className="bg-gray-100 px-1 rounded">{detail.css}</code>
                                </div>
                              )}
                              <div className="mt-2 flex gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs ${detail.wcagAA ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  WCAG AA: {detail.wcagAA ? '✓ Pass' : '✗ Failed'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs ${detail.wcagAAA ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  WCAG AAA: {detail.wcagAAA ? '✓ Pass' : '✗ Failed'}
                                </span>
                              </div>
                            </div>
                          ))}
                          {category.details && category.details.length > 5 && (
                            <div className="mt-2 text-xs text-gray-500">+ {category.details.length - 5} more issues</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-red-700">
                      {results.accessibility.colorContrastIssues} elements have insufficient color contrast (below 4.5:1 ratio for normal text).
                    </div>
                  )}

                  <div className="mt-3 text-xs text-gray-600 bg-white/50 p-2 rounded">
                    <strong>WCAG Guidelines:</strong> Normal text requires 4.5:1 contrast ratio (AA) or 7:1 (AAA). Large text (18pt+) requires 3:1 (AA) or 4.5:1 (AAA).
                  </div>
                </div>
              )}
            </Section>

            {/* Mobile Friendliness */}
            {results.mobile && (
              <Section title="Mobile Friendliness" icon={Icons.Globe} id="mobile" badge={<span className={`px-2 py-0.5 rounded-full text-sm ${results.mobile.score >= 80 ? 'bg-green-100 text-green-700' : results.mobile.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{results.mobile.score}/100</span>}>
                <div className="mt-4">
                  {/* Mobile Score */}
                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative">
                      <DonutChart value={results.mobile.score} size={100} strokeWidth={10} color={results.mobile.score >= 80 ? '#10b981' : results.mobile.score >= 50 ? '#f59e0b' : '#ef4444'} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">{results.mobile.score}</span>
                      </div>
                    </div>
                    <div>
                      <div className={`text-lg font-medium ${results.mobile.score >= 80 ? 'text-green-700' : results.mobile.score >= 50 ? 'text-yellow-700' : 'text-red-700'}`}>
                        {results.mobile.score >= 80 ? 'Mobile Friendly' : results.mobile.score >= 50 ? 'Needs Improvement' : 'Not Mobile Friendly'}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{results.mobile.issues?.length || 0} issues found</div>
                    </div>
                  </div>

                  {/* Mobile Checks */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className={`p-3 rounded-lg text-center ${results.mobile.hasViewport ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className={`text-xl font-bold ${results.mobile.hasViewport ? 'text-green-700' : 'text-red-700'}`}>{results.mobile.hasViewport ? '✓' : '✗'}</div>
                      <div className="text-xs text-gray-600">Viewport Meta</div>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${results.mobile.hasWidthDeviceWidth ? 'bg-green-50' : 'bg-yellow-50'}`}>
                      <div className={`text-xl font-bold ${results.mobile.hasWidthDeviceWidth ? 'text-green-700' : 'text-yellow-700'}`}>{results.mobile.hasWidthDeviceWidth ? '✓' : '✗'}</div>
                      <div className="text-xs text-gray-600">Width Device</div>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${results.mobile.hasMediaQueries ? 'bg-green-50' : 'bg-yellow-50'}`}>
                      <div className={`text-xl font-bold ${results.mobile.hasMediaQueries ? 'text-green-700' : 'text-yellow-700'}`}>{results.mobile.hasMediaQueries ? '✓' : '✗'}</div>
                      <div className="text-xs text-gray-600">Media Queries</div>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${results.mobile.horizontalScrollRisk ? 'bg-red-50' : 'bg-green-50'}`}>
                      <div className={`text-xl font-bold ${results.mobile.horizontalScrollRisk ? 'text-red-700' : 'text-green-700'}`}>{results.mobile.horizontalScrollRisk ? '✗' : '✓'}</div>
                      <div className="text-xs text-gray-600">{results.mobile.horizontalScrollRisk ? 'Horizontal Scroll Risk' : 'No Horizontal Scroll'}</div>
                    </div>
                  </div>

                  {/* Responsive Design Details */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold" style={{ color: COLORS.primary }}>{results.mobile.mediaQueryCount || 0}</div>
                      <div className="text-xs text-gray-600">Media Queries</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold" style={{ color: COLORS.primary }}>{results.mobile.responsiveImagesCount || 0}/{results.mobile.totalImages || 0}</div>
                      <div className="text-xs text-gray-600">Responsive Images</div>
                    </div>
                    <div className={`p-3 rounded-lg ${results.mobile.smallTapTargets > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                      <div className={`text-lg font-bold ${results.mobile.smallTapTargets > 0 ? 'text-yellow-700' : 'text-green-700'}`}>{results.mobile.smallTapTargets || 0}</div>
                      <div className="text-xs text-gray-600">Small Tap Targets</div>
                    </div>
                  </div>

                  {/* Mobile Issues */}
                  {results.mobile.issues && results.mobile.issues.length > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="font-medium text-yellow-800 mb-2">Mobile Issues:</div>
                      <div className="space-y-1">
                        {results.mobile.issues.map((issue, i) => (
                          <div key={i} className="text-sm text-yellow-700 flex items-start gap-2">
                            <span className="text-yellow-600">•</span>
                            {issue}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PWA & Mobile Meta */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${results.mobile.hasThemeColor ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {results.mobile.hasThemeColor ? '✓' : '–'} Theme Color
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${results.mobile.hasManifest ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {results.mobile.hasManifest ? '✓' : '–'} Manifest
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${results.mobile.hasAppleTouchIcon ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {results.mobile.hasAppleTouchIcon ? '✓' : '–'} Apple Touch Icon
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${results.mobile.hasFlexbox || results.mobile.hasGrid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {results.mobile.hasFlexbox || results.mobile.hasGrid ? '✓' : '–'} CSS Layout
                    </span>
                  </div>
                </div>
              </Section>
            )}

            {/* Performance */}
            <Section title="Performance" icon={Icons.Zap} id="performance">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-800">{results.performance.totalScripts}</div>
                  <div className="text-sm text-gray-500">Scripts</div>
                </div>
                <div className={`p-4 rounded-lg text-center ${results.performance.renderBlockingScripts > 3 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <div className={`text-2xl font-bold ${results.performance.renderBlockingScripts > 3 ? 'text-red-700' : 'text-green-700'}`}>{results.performance.renderBlockingScripts}</div>
                  <div className="text-sm text-gray-500">Render Blocking</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-800">{results.performance.preloads}</div>
                  <div className="text-sm text-gray-500">Preloads</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-800">{results.performance.estimatedWeight || '—'}</div>
                  <div className="text-sm text-gray-500">HTML Size</div>
                </div>
              </div>
            </Section>

            {/* Loaded Files */}
            <Section title="Loaded Files" icon={Icons.Folder} id="loaded-files">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center p-4 rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-gray-700">{results.externalResources.cssCount}</div>
                  <div className="text-sm text-gray-600">Stylesheets</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-gray-700">{results.externalResources.jsCount}</div>
                  <div className="text-sm text-gray-600">Scripts</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-gray-700">{results.externalResources.fontCount}</div>
                  <div className="text-sm text-gray-600">Fonts</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-gray-700">{results.externalResources.thirdPartyCount}</div>
                  <div className="text-sm text-gray-600">3rd-party Domains</div>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {results.externalResources.cssFiles.length > 0 && (
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-800 hover:text-gray-600">
                      Stylesheets ({results.externalResources.cssFiles.length}) <span className="text-gray-400 text-sm">click to expand</span>
                    </summary>
                    <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg max-h-64 overflow-auto">
                      <div className="space-y-2">
                        {results.externalResources.cssFiles.map((file, i) => (
                          <div key={i} className="flex items-start justify-between gap-3 text-sm">
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline break-all">
                              {file.url}
                            </a>
                            {file.isThirdParty && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">3rd-party</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                )}

                {results.externalResources.jsFiles.length > 0 && (
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-800 hover:text-gray-600">
                      Scripts ({results.externalResources.jsFiles.length}) <span className="text-gray-400 text-sm">click to expand</span>
                    </summary>
                    <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg max-h-64 overflow-auto">
                      <div className="space-y-2">
                        {results.externalResources.jsFiles.map((file, i) => (
                          <div key={i} className="space-y-1 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline break-all">
                                {file.url}
                              </a>
                              {file.isThirdParty && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">3rd-party</span>}
                            </div>
                            <div className="text-xs text-gray-500">
                              {file.async && <span className="mr-2">async</span>}
                              {file.defer && <span className="mr-2">defer</span>}
                              {file.module && <span className="mr-2">module</span>}
                              {!file.async && !file.defer && !file.module && <span>blocking</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                )}

                {results.externalResources.fontFiles.length > 0 && (
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-800 hover:text-gray-600">
                      Fonts ({results.externalResources.fontFiles.length}) <span className="text-gray-400 text-sm">click to expand</span>
                    </summary>
                    <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg max-h-64 overflow-auto">
                      <div className="space-y-2 text-sm">
                        {results.externalResources.fontFiles.map((file, i) => (
                          <div key={i} className="flex items-start justify-between gap-3">
                            <span className="text-gray-700 break-all">{file.url}</span>
                            {file.format && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">{file.format}</span>}
                          </div>
                        ))}
                        {results.externalResources.googleFonts.length > 0 && (
                          <div className="text-xs text-gray-500">
                            Google Fonts: {results.externalResources.googleFonts.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                )}
              </div>
            </Section>

            {/* Security */}
            <Section title="Security" icon={Icons.Lock} id="security">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className={`text-center p-4 rounded-lg ${results.security.isHttps ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className={`text-2xl font-bold ${results.security.isHttps ? 'text-green-700' : 'text-red-700'}`}>{results.security.isHttps ? '✓' : '✗'}</div>
                  <div className="text-sm text-gray-600">HTTPS</div>
                </div>
                <div className={`text-center p-4 rounded-lg ${results.security.mixedContentCount === 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className={`text-2xl font-bold ${results.security.mixedContentCount === 0 ? 'text-green-700' : 'text-red-700'}`}>{results.security.mixedContentCount}</div>
                  <div className="text-sm text-gray-600">Mixed Content</div>
                </div>
                <div className={`text-center p-4 rounded-lg ${results.links.unsafeExternalCount === 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  <div className={`text-2xl font-bold ${results.links.unsafeExternalCount === 0 ? 'text-green-700' : 'text-yellow-700'}`}>{results.links.unsafeExternalCount}</div>
                  <div className="text-sm text-gray-600">Unsafe Links</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-700">{results.security.protocolRelativeCount}</div>
                  <div className="text-sm text-gray-600">Protocol-relative</div>
                </div>
              </div>
            </Section>

            {/* International / Hreflang */}
            {results.international.hreflangs.length > 0 && (
              <Section title="Hreflang / International" icon={Icons.Languages} id="international" badge={<span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-sm">{results.international.hreflangs.length} languages</span>}>
                <div className="mt-4 space-y-2">
                  {results.international.hreflangs.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded text-sm">
                      <span className="font-mono font-semibold text-gray-700 w-20">{h.hreflang}</span>
                      <span className="text-gray-600 truncate flex-1">{h.href}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <CheckBadge ok={results.international.hasXDefault} label="x-default" />
                  <CheckBadge ok={results.international.hasSelfReference} label="Self-reference" />
                  <CheckBadge ok={results.international.canonicalInHreflang || false} label="Canonical in hreflang" />
                  <CheckBadge ok={results.international.langMatchesHreflang || false} label="Lang matches hreflang" />
                </div>
              </Section>
            )}

            {/* Links */}
            <Section title="Links" icon={Icons.Link} id="links">
              {(() => {
                const emptyBroken = results.links.brokenList || [];
                const brokenInternal = results.links.brokenInternalList || [];
                const brokenExternal = results.links.brokenExternalList || [];
                const totalBrokenCount = emptyBroken.length + brokenInternal.length + brokenExternal.length;
                return (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4">
                      <div className="text-center p-4 rounded-lg" style={{ backgroundColor: `${COLORS.primary}10` }}><div className="text-2xl font-bold" style={{ color: COLORS.primary }}>{results.links.total}</div><div className="text-sm text-gray-600">Total</div></div>
                      <div className="text-center p-4 bg-green-50 rounded-lg"><div className="text-2xl font-bold text-green-700">{results.links.internal}</div><div className="text-sm text-green-600">Internal</div></div>
                      <div className="text-center p-4 rounded-lg" style={{ backgroundColor: `${COLORS.secondary}15` }}><div className="text-2xl font-bold" style={{ color: COLORS.primary }}>{results.links.external}</div><div className="text-sm text-gray-600">External</div></div>
                      <div className={`text-center p-4 rounded-lg ${totalBrokenCount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}><div className={`text-2xl font-bold ${totalBrokenCount > 0 ? 'text-red-700' : 'text-gray-700'}`}>{totalBrokenCount}</div><div className="text-sm text-gray-600">Broken</div></div>
                      <div className={`text-center p-4 rounded-lg ${results.links.genericAnchors > 0 ? 'bg-yellow-50' : 'bg-gray-50'}`}><div className={`text-2xl font-bold ${results.links.genericAnchors > 0 ? 'text-yellow-700' : 'text-gray-700'}`}>{results.links.genericAnchors}</div><div className="text-sm text-gray-600">Generic</div></div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg"><div className="text-2xl font-bold text-gray-700">{results.links.nofollow}</div><div className="text-sm text-gray-600">Nofollow</div></div>
                    </div>
                  </>
                );
              })()}

              {/* Internal Links */}
              {results.links.internalUrls && results.links.internalUrls.length > 0 && (
                <div className="mt-4">
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-green-800 hover:text-green-600">
                      Internal Links ({results.links.internalUrls.length}) <span className="text-gray-400 text-sm">click to expand</span>
                    </summary>
                    <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-lg max-h-64 overflow-auto">
                      <div className="space-y-1">
                        {results.links.internalUrls.map((link, i) => (
                          <div key={i} className="text-sm">
                            <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline break-all">{link.href}</a>
                            {link.text && <span className="text-gray-500 ml-2">({link.text})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {/* External Links */}
              {results.links.externalUrls && results.links.externalUrls.length > 0 && (
                <div className="mt-4">
                  <details className="group">
                    <summary className="cursor-pointer font-medium hover:text-blue-600" style={{ color: COLORS.primary }}>
                      External Links ({results.links.externalUrls.length}) <span className="text-gray-400 text-sm">click to expand</span>
                    </summary>
                    <div className="mt-2 p-4 border rounded-lg max-h-64 overflow-auto" style={{ backgroundColor: `${COLORS.secondary}10`, borderColor: `${COLORS.secondary}30` }}>
                      <div className="space-y-1">
                        {results.links.externalUrls.map((link, i) => (
                          <div key={i} className="text-sm">
                            <a href={link.href} target="_blank" rel="noopener noreferrer" className="hover:underline break-all" style={{ color: COLORS.primary }}>{link.href}</a>
                            {link.text && <span className="text-gray-500 ml-2">({link.text})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {/* Broken Links - combine empty hrefs, broken internal links, and broken external links */}
              {(() => {
                const emptyBroken = results.links.brokenList || [];
                const brokenInternal = results.links.brokenInternalList || [];
                const brokenExternal = results.links.brokenExternalList || [];
                const totalBroken = emptyBroken.length + brokenInternal.length + brokenExternal.length;
                if (totalBroken === 0) return null;
                return (
                  <div className="mt-4">
                    <details className="group" open>
                      <summary className="cursor-pointer font-medium text-red-800 hover:text-red-600">
                        Broken Links ({totalBroken}) <span className="text-gray-400 text-sm">click to expand/collapse</span>
                      </summary>
                      <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-lg max-h-64 overflow-auto">
                        <div className="space-y-2">
                          {emptyBroken.map((link: { href: string; text?: string; reason?: string }, i: number) => (
                            <div key={`empty-${i}`} className="p-2 bg-white rounded text-sm border border-red-100">
                              <code className="text-red-700 break-all">{link.href || '(empty)'}</code>
                              {link.text && <span className="text-gray-500 ml-2">- {link.text}</span>}
                              {link.reason && <div className="text-xs text-red-600 mt-1">{link.reason}</div>}
                            </div>
                          ))}
                          {brokenInternal.map((link: { href: string; text?: string; status: number }, i: number) => (
                            <div key={`int-${i}`} className="p-2 bg-white rounded text-sm border border-red-100">
                              <code className="text-red-700 break-all">{link.href}</code>
                              {link.text && <span className="text-gray-500 ml-2">- {link.text}</span>}
                              <div className="text-xs text-red-600 mt-1">HTTP {link.status} - Internal link broken</div>
                            </div>
                          ))}
                          {brokenExternal.map((link: { href: string; text?: string; status: number }, i: number) => (
                            <div key={`ext-${i}`} className="p-2 bg-white rounded text-sm border border-red-100">
                              <code className="text-red-700 break-all">{link.href}</code>
                              {link.text && <span className="text-gray-500 ml-2">- {link.text}</span>}
                              <div className="text-xs text-red-600 mt-1">HTTP {link.status} - External link broken</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>
                  </div>
                );
              })()}

              {/* Generic Anchors */}
              {results.links.genericAnchorsList && results.links.genericAnchorsList.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="font-medium text-yellow-800 mb-2">Generic Anchor Text (SEO Issue)</div>
                  <div className="space-y-1 max-h-32 overflow-auto">
                    {results.links.genericAnchorsList.map((link, i) => (
                      <div key={i} className="text-sm text-yellow-700">
                        &quot;{link.text}&quot; → <span className="text-gray-600 break-all">{link.href}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* Images */}
            <Section title="Images" icon={Icons.Image} id="images">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg"><div className="text-2xl font-bold text-gray-700">{results.images.total}</div><div className="text-sm text-gray-600">Total</div></div>
                <div className={`text-center p-4 rounded-lg ${results.images.withoutAlt > 0 ? 'bg-red-50' : 'bg-green-50'}`}><div className={`text-2xl font-bold ${results.images.withoutAlt > 0 ? 'text-red-700' : 'text-green-700'}`}>{results.images.withoutAlt}</div><div className="text-sm text-gray-600">No alt</div></div>
                <div className={`text-center p-4 rounded-lg ${results.images.withoutDimensions > 0 ? 'bg-orange-50' : 'bg-green-50'}`}><div className={`text-2xl font-bold ${results.images.withoutDimensions > 0 ? 'text-orange-700' : 'text-green-700'}`}>{results.images.withoutDimensions}</div><div className="text-sm text-gray-600">No dimensions</div></div>
                <div className="text-center p-4 bg-green-50 rounded-lg"><div className="text-2xl font-bold text-green-700">{results.images.lazyLoaded}</div><div className="text-sm text-green-600">Lazy loaded</div></div>
                <div className="text-center p-4 bg-teal-50 rounded-lg"><div className="text-2xl font-bold text-teal-700">{results.images.modernFormats || 0}</div><div className="text-sm text-teal-600">WebP/AVIF</div></div>
                <div className={`text-center p-4 rounded-lg ${(results.images.imageSizeAnalysis?.oldFormatCount || 0) > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                  <div className={`text-2xl font-bold ${(results.images.imageSizeAnalysis?.oldFormatCount || 0) > 0 ? 'text-yellow-700' : 'text-green-700'}`}>{results.images.imageSizeAnalysis?.oldFormatCount || 0}</div>
                  <div className="text-sm text-gray-600">PNG/JPG</div>
                </div>
              </div>

              {/* PNG/JPG Warning */}
              {results.images.imageSizeAnalysis && results.images.imageSizeAnalysis.oldFormatCount > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-600"><Icons.Alert /></span>
                    <div>
                      <div className="font-medium text-yellow-800">Image Format Warning</div>
                      <div className="text-sm text-yellow-700 mt-1">
                        {results.images.imageSizeAnalysis.oldFormatCount} images are using PNG/JPG format. Consider converting to WebP or AVIF for better performance (30-50% smaller file sizes).
                      </div>
                      {results.images.imageSizeAnalysis.oldFormatList && results.images.imageSizeAnalysis.oldFormatList.length > 0 && (
                        <div className="mt-2 max-h-32 overflow-auto">
                          {results.images.imageSizeAnalysis.oldFormatList.slice(0, 5).map((img, i) => (
                            <div key={i} className="text-xs text-yellow-600 truncate">• {img.src} ({img.type})</div>
                          ))}
                          {results.images.imageSizeAnalysis.oldFormatList.length > 5 && (
                            <div className="text-xs text-yellow-500 mt-1">...and {results.images.imageSizeAnalysis.oldFormatList.length - 5} more</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {imageList.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">Image inventory ({imageList.length})</summary>
                  <div className="mt-2 max-h-72 overflow-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 text-gray-600 sticky top-0">
                        <tr>
                          <th className="text-left p-2">Source</th>
                          <th className="text-left p-2">Alt</th>
                          <th className="text-left p-2">Dimensions</th>
                          <th className="text-left p-2">ID/Class</th>
                          <th className="text-left p-2">Format</th>
                          <th className="text-left p-2">Flags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {imageList.map((img, i) => (
                          <tr key={`${img.src}-${i}`} className="border-t border-gray-100">
                            <td className="p-2 truncate max-w-[240px]" title={img.src}>{img.src || '(empty src)'}</td>
                            <td className="p-2 truncate max-w-[160px]" title={img.alt}>{img.alt || '—'}</td>
                            <td className="p-2">{img.width && img.height ? `${img.width}×${img.height}` : '—'}</td>
                            <td className="p-2">
                              <div className="truncate max-w-[160px]" title={`${img.id || ''} ${img.className || ''}`.trim()}>
                                {img.id ? `#${img.id}` : '—'}{img.className ? ` .${img.className.split(' ').slice(0, 2).join('.')}` : ''}
                              </div>
                            </td>
                            <td className="p-2">{img.format || '—'}</td>
                            <td className="p-2">
                              {!img.hasAlt && <span className="mr-2 text-red-600">no alt</span>}
                              {!img.hasDimensions && <span className="mr-2 text-orange-600">no dims</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {imagesWithoutAlt.length > 0 && (
                  <details className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <summary className="cursor-pointer text-sm font-medium text-red-800">Images missing alt ({imagesWithoutAlt.length})</summary>
                    <div className="mt-2 max-h-40 overflow-auto text-xs text-red-700 space-y-1">
                      {imagesWithoutAlt.map((img, i) => (
                        <div key={`${img.src}-alt-${i}`} className="truncate">• {img.src || '(empty src)'} {img.id ? `(id="${img.id}")` : '(id missing)'}</div>
                      ))}
                    </div>
                  </details>
                )}
                {imagesWithoutDimensions.length > 0 && (
                  <details className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <summary className="cursor-pointer text-sm font-medium text-orange-800">Images without dimensions ({imagesWithoutDimensions.length})</summary>
                    <div className="mt-2 max-h-40 overflow-auto text-xs text-orange-700 space-y-1">
                      {imagesWithoutDimensions.map((img, i) => (
                        <div key={`${img.src}-dim-${i}`} className="truncate">• {img.src || '(empty src)'} {img.id ? `(id="${img.id}")` : '(id missing)'}</div>
                      ))}
                    </div>
                  </details>
                )}
                {pngImages.length > 0 && (
                  <details className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <summary className="cursor-pointer text-sm font-medium text-yellow-800">PNG images ({pngImages.length})</summary>
                    <div className="mt-2 max-h-40 overflow-auto text-xs text-yellow-700 space-y-1">
                      {pngImages.map((img, i) => (
                        <div key={`${img.src}-png-${i}`} className="truncate">• {img.src || '(empty src)'} {img.id ? `(id="${img.id}")` : '(id missing)'}</div>
                      ))}
                    </div>
                  </details>
                )}
                {largeImages.length > 0 && (
                  <details className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <summary className="cursor-pointer text-sm font-medium text-purple-800">Large image files ({largeImages.length})</summary>
                    <div className="mt-2 text-xs text-purple-700">Checked {results.images.imageSizeAnalysis?.checked || 0} image URLs.</div>
                    <div className="mt-2 max-h-40 overflow-auto text-xs text-purple-700 space-y-1">
                      {largeImages.map((img, i) => (
                        <div key={`${img.src}-large-${i}`} className="truncate">• {img.src} ({img.size})</div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </Section>

            {/* Schema */}
            {results.schema.count > 0 && (
              <Section title="Schema.org" icon={Icons.Code} id="schema" badge={<span className="px-2 py-0.5 rounded-full text-sm" style={{ backgroundColor: `${COLORS.highlight}15`, color: COLORS.highlight }}>{results.schema.count}</span>}>
                <div className="mt-4">
                  {/* Schema Types */}
                  <div className="flex flex-wrap gap-2">
                    {results.schema.types.map((t, i) => <span key={i} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: `${COLORS.highlight}15`, color: COLORS.highlight }}>{t}</span>)}
                  </div>

                  {/* Validation Summary */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className={`p-3 rounded-lg text-center ${results.schema.valid > 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <div className={`text-xl font-bold ${results.schema.valid > 0 ? 'text-green-700' : 'text-gray-500'}`}>{results.schema.valid}</div>
                      <div className="text-xs text-gray-500">Valid</div>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${results.schema.invalid > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <div className={`text-xl font-bold ${results.schema.invalid > 0 ? 'text-red-700' : 'text-gray-500'}`}>{results.schema.invalid}</div>
                      <div className="text-xs text-gray-500">Invalid</div>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${results.schema.missingContext > 0 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                      <div className={`text-xl font-bold ${results.schema.missingContext > 0 ? 'text-yellow-700' : 'text-gray-500'}`}>{results.schema.missingContext}</div>
                      <div className="text-xs text-gray-500">Missing @context</div>
                    </div>
                    <div className="p-3 rounded-lg text-center bg-gray-50">
                      <div className="text-xl font-bold text-gray-700">{results.schema.count}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                  </div>

                  {/* Rich Result Eligibility */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-2">Rich Results Eligibility</div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <CheckBadge ok={results.schema.hasOrganization} label="Organization" />
                      <CheckBadge ok={results.schema.hasBreadcrumb} label="Breadcrumb" />
                      <CheckBadge ok={results.schema.hasFAQ} label="FAQ" />
                      <CheckBadge ok={results.schema.hasHowTo} label="HowTo" />
                      <CheckBadge ok={results.schema.hasWebSiteSearch} label="SearchBox" />
                    </div>
                  </div>

                  {/* Validation Details */}
                  {results.schema.details && results.schema.details.length > 0 && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">Schema Validation Details</summary>
                      <div className="mt-2 space-y-2 max-h-64 overflow-auto">
                        {results.schema.details.map((schema, i) => (
                          <div key={i} className={`p-3 rounded-lg ${schema.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-medium ${schema.valid ? 'text-green-800' : 'text-red-800'}`}>{schema.type}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${schema.valid ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                {schema.valid ? '✓ Valid' : '✗ Invalid'}
                              </span>
                            </div>
                            {schema.issues && schema.issues.length > 0 && (
                              <ul className="mt-2 text-xs text-red-700 space-y-1">
                                {schema.issues.map((issue, j) => (
                                  <li key={j}>• {issue}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </Section>
            )}

            {/* Social */}
            <Section title="Social Media" icon={Icons.Share} id="social">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-800 mb-2">Open Graph</div>
                  <div className="text-sm space-y-1">
                    <CheckBadge ok={!!results.social.og.title} label="og:title" />
                    <CheckBadge ok={!!results.social.og.description} label="og:description" />
                    <CheckBadge ok={!!results.social.og.image} label="og:image" />
                    <CheckBadge ok={!!results.social.og.url} label="og:url" />
                  </div>
                </div>
                <div className="p-4 bg-sky-50 rounded-lg">
                  <div className="font-medium text-sky-800 mb-2">Twitter Card</div>
                  <div className="text-sm space-y-1">
                    <CheckBadge ok={!!results.social.twitter.card} label={`card: ${results.social.twitter.card || '—'}`} />
                    <CheckBadge ok={!!results.social.twitter.image} label="image" />
                  </div>
                </div>
              </div>
            </Section>

            {/* Platform */}
            <Section title="Platform" icon={Icons.Zap} id="platform">
              <div className="mt-4 space-y-3">
                {results.platform.cms.length > 0 && <div className="flex items-center gap-2 flex-wrap"><span className="text-gray-500">CMS:</span>{results.platform.cms.map((c, i) => <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">{c}</span>)}</div>}
                {results.platform.frameworks.length > 0 && <div className="flex items-center gap-2 flex-wrap"><span className="text-gray-500">Framework:</span>{results.platform.frameworks.map((f, i) => <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">{f}</span>)}</div>}
                {results.platform.analytics && results.platform.analytics.length > 0 && <div className="flex items-center gap-2 flex-wrap"><span className="text-gray-500">Analytics:</span>{results.platform.analytics.map((a, i) => <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm">{a}</span>)}</div>}
                <div className="flex items-center gap-2"><span className="text-gray-500">Render:</span><span className={`px-2 py-1 rounded text-sm ${results.platform.isCSR ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{results.platform.renderMethod}</span></div>
              </div>
            </Section>

            {/* AI Content */}
            {results.content.aiScore > 20 && (
              <Section title="AI Content Analysis" icon={Icons.Brain} id="ai">
                <div className="mt-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <DonutChart value={results.content.aiScore} size={80} strokeWidth={8} color={results.content.aiScore > 50 ? '#ef4444' : '#f59e0b'} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold">{results.content.aiScore}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">AI Content Indicator</div>
                      <div className="text-sm text-gray-500">High value indicates AI-generated content</div>
                    </div>
                  </div>
                  {results.content.aiPhrases.length > 0 && (
                    <div className="mt-3 text-sm text-gray-600">
                      Found phrases: {results.content.aiPhrases.slice(0, 5).join(', ')}{results.content.aiPhrases.length > 5 && ` +${results.content.aiPhrases.length - 5}`}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Trust Signals */}
            <Section title="Trust (E-E-A-T)" icon={Icons.Users} id="trust">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                <div className={`p-3 rounded-lg text-center ${results.trustSignals.hasAboutPage ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className={`text-2xl mb-1 ${results.trustSignals.hasAboutPage ? 'text-green-600' : 'text-gray-400'}`}>{results.trustSignals.hasAboutPage ? '✓' : '—'}</div>
                  <div className="text-sm text-gray-600">About Page</div>
                </div>
                <div className={`p-3 rounded-lg text-center ${results.trustSignals.hasContactPage ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className={`text-2xl mb-1 ${results.trustSignals.hasContactPage ? 'text-green-600' : 'text-gray-400'}`}>{results.trustSignals.hasContactPage ? '✓' : '—'}</div>
                  <div className="text-sm text-gray-600">Contact</div>
                </div>
                <div className={`p-3 rounded-lg text-center ${results.trustSignals.hasPrivacyPage ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className={`text-2xl mb-1 ${results.trustSignals.hasPrivacyPage ? 'text-green-600' : 'text-gray-400'}`}>{results.trustSignals.hasPrivacyPage ? '✓' : '—'}</div>
                  <div className="text-sm text-gray-600">Privacy</div>
                </div>
                <div className={`p-3 rounded-lg text-center ${results.trustSignals.hasAuthor ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className={`text-2xl mb-1 ${results.trustSignals.hasAuthor ? 'text-green-600' : 'text-gray-400'}`}>{results.trustSignals.hasAuthor ? '✓' : '—'}</div>
                  <div className="text-sm text-gray-600">Author</div>
                </div>
                <div className={`p-3 rounded-lg text-center ${results.trustSignals.socialLinksCount > 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className={`text-2xl font-bold mb-1 ${results.trustSignals.socialLinksCount > 0 ? 'text-green-600' : 'text-gray-400'}`}>{results.trustSignals.socialLinksCount || '—'}</div>
                  <div className="text-sm text-gray-600">Social Links</div>
                </div>
              </div>
              {results.trustSignals.socialPlatforms && results.trustSignals.socialPlatforms.length > 0 && (
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <span className="text-gray-500 text-sm">Social platforms:</span>
                  {results.trustSignals.socialPlatforms.map((s, i) => <span key={i} className="px-2 py-1 rounded text-sm" style={{ backgroundColor: `${COLORS.highlight}15`, color: COLORS.highlight }}>{s}</span>)}
                </div>
              )}
            </Section>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="py-8 flex flex-col items-center gap-4">
        <a
          href="mailto:tsiskrelir@gmail.com"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#ff00ff', color: '#ffffff' }}
        >
          Book your SEO optimisation consultation
        </a>
        <div className="text-center text-white/60 text-sm">
          SEO Audit Tool • Complete Technical & On-Page Analysis • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
