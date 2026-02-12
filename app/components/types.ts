// Frontend types for the SEO Audit UI
// These mirror the API response shape used by page.tsx

export interface AuditIssue {
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

export interface HreflangTag { hreflang: string; href: string; }
export interface SchemaItem { index: string; type: string; valid: boolean; issues: string[]; }
export interface KeywordDensity { word: string; count: number; percentage: number; }
export interface ReadabilityData { fleschScore: number; fleschGrade: string; avgSentenceLength: number; avgSyllablesPerWord: number; complexWordPercentage: number; }
export interface AriaData { landmarks: { main: number; nav: number; header: number; footer: number; aside: number; search: number; form: number; region: number }; ariaLabels: number; ariaDescribedby: number; ariaLabelledby: number; ariaHidden: number; ariaLive: number; ariaExpanded: number; roles: string[]; missingLandmarks: string[]; }
export interface DOMData { totalElements: number; maxDepth: number; averageDepth: number; totalNodes: number; textNodes: number; commentNodes: number; inlineStyles: number; inlineScripts: number; emptyElements: number; deprecatedElements: string[]; duplicateIds: string[]; elementCounts: Record<string, number>; }

// PageSpeed types
export interface PageSpeedMetrics { fcp: number; lcp: number; cls: number; tbt: number; si: number; tti: number; }
export interface PageSpeedResult { score: number; metrics: PageSpeedMetrics; opportunities: { id: string; title: string; description: string; savings: string }[]; diagnostics: { id: string; title: string; description: string }[]; error?: string; }

// Crawler types
export interface CrawlPage { url: string; status: number; title: string; depth: number; internalLinks: number; externalLinks: number; wordCount: number; hasH1: boolean; hasMetaDesc: boolean; issues: string[]; responseTime: number; }
export interface CrawlResult { pages: CrawlPage[]; totalPages: number; totalInternalLinks: number; totalExternalLinks: number; brokenLinks: { url: string; status: number; foundOn: string }[]; redirects: { from: string; to: string; status: number }[]; duplicateTitles: { title: string; urls: string[] }[]; duplicateDescriptions: { description: string; urls: string[] }[]; orphanPages: string[]; deepPages: { url: string; depth: number }[]; crawlTime: number; errors: string[]; }

// Robots.txt types
export interface RobotsRule { userAgent: string; rules: { type: 'allow' | 'disallow'; path: string }[]; crawlDelay?: number; }
export interface RobotsValidation { isValid: boolean; errors: string[]; warnings: string[]; sitemaps: string[]; blocksGooglebot: boolean; blocksAll: boolean; rules: RobotsRule[]; }

// Sitemap types
export interface SitemapUrl { loc: string; lastmod?: string; changefreq?: string; priority?: number; }
export interface SitemapData { urls: SitemapUrl[]; sitemapIndexUrls: string[]; totalUrls: number; errors: string[]; }

export interface SiteTreeNode {
  path: string;
  fullUrl: string;
  children: SiteTreeNode[];
  isCurrentPage?: boolean;
  status?: number;
  inSitemap?: boolean;
}

export interface AuditResult {
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
  links: { total: number; internal: number; external: number; broken: number; brokenList: { href: string; text: string; reason?: string; htmlTag?: string }[]; brokenExternalLinks?: number; brokenExternalList?: { href: string; text: string; status: number; error?: string }[]; brokenInternalLinks?: number; brokenInternalList?: { href: string; text: string; status: number; error?: string }[]; redirectLinks?: number; redirectList?: { href: string; text: string; status: number; location: string }[]; genericAnchors: number; genericAnchorsList: { text: string; href: string }[]; nofollow: number; sponsored: number; ugc: number; unsafeExternalCount: number; hasFooterLinks: boolean; hasNavLinks: boolean; internalUrls?: { href: string; text: string }[]; externalUrls?: { href: string; text: string }[]; paginationUrls?: { href: string; text: string }[]; };
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
