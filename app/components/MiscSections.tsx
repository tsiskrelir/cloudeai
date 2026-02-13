'use client';

import React from 'react';
import { Icons } from './Icons';
import { COLORS } from './constants';
import { Section, CheckBadge } from './Section';
import { DonutChart } from './charts';
import type { AuditResult } from './types';

interface SectionProps {
  results: AuditResult;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

/* ─── DOM Analysis ───────────────────────────────────────────────────── */
export const DomSection = ({ results, expanded, setExpanded }: SectionProps) => {
  if (!results.dom) return null;
  return (
    <Section title="DOM Analysis" icon={Icons.DOM} id="dom" expanded={expanded} setExpanded={setExpanded}>
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
  );
};

/* ─── Accessibility ──────────────────────────────────────────────────── */
export const AccessibilitySection = ({ results, expanded, setExpanded }: SectionProps) => (
  <Section title="Accessibility (A11y)" icon={Icons.Eye} id="accessibility" expanded={expanded} setExpanded={setExpanded}>
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

    {/* Contrast Issues */}
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
);

/* ─── Mobile Friendliness ────────────────────────────────────────────── */
export const MobileSection = ({ results, expanded, setExpanded }: SectionProps) => {
  if (!results.mobile) return null;
  return (
    <Section title="Mobile Friendliness" icon={Icons.Globe} id="mobile" expanded={expanded} setExpanded={setExpanded} badge={<span className={`px-2 py-0.5 rounded-full text-sm ${results.mobile.score >= 80 ? 'bg-green-100 text-green-700' : results.mobile.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{results.mobile.score}/100</span>}>
      <div className="mt-4">
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

        {/* Fixed Width Elements */}
        {results.mobile.fixedWidthList && results.mobile.fixedWidthList.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-red-800 hover:text-red-600">Fixed-width elements ({results.mobile.fixedWidthList.length})</summary>
            <div className="mt-2 p-3 bg-red-50 rounded-lg max-h-48 overflow-auto space-y-2">
              {results.mobile.fixedWidthList.map((el, i) => (
                <div key={i} className="text-xs p-2 bg-white rounded border border-red-100">
                  <code className="text-red-700">width: {el.width}</code>
                  <span className="text-gray-500 ml-2">{el.context}</span>
                  {el.snippet && <pre className="mt-1 text-gray-600 bg-gray-50 p-1 rounded overflow-x-auto">{el.snippet}</pre>}
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Small Tap Targets Detail */}
        {results.mobile.tapTargetsList && results.mobile.tapTargetsList.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-yellow-800 hover:text-yellow-600">Small tap targets ({results.mobile.tapTargetsList.length})</summary>
            <div className="mt-2 p-3 bg-yellow-50 rounded-lg max-h-48 overflow-auto space-y-1">
              {results.mobile.tapTargetsList.map((target, i) => (
                <div key={i} className="text-xs text-yellow-700 flex items-center gap-2">
                  <span className="text-yellow-600">•</span>
                  <code className="bg-white px-1 rounded">{target.element}</code>
                  <span className="text-gray-500">({target.size})</span>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Actionable Recommendations */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="font-medium text-blue-800 mb-3">Step-by-Step Mobile Optimization Guide</div>
          <div className="space-y-3 text-sm text-blue-900">
            {!results.mobile.hasViewport && (
              <div className="p-3 bg-white rounded-lg border-l-3 border-red-500">
                <div className="font-medium text-red-800">1. Add viewport meta tag (Critical)</div>
                <p className="text-gray-600 mt-1">Add the following tag inside your <code className="bg-gray-100 px-1 rounded">&lt;head&gt;</code>:</p>
                <pre className="mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs overflow-x-auto">{`<meta name="viewport" content="width=device-width, initial-scale=1">`}</pre>
                <p className="text-xs text-gray-500 mt-1">This tells the browser to scale the page to the device width. Without it, mobile devices render the page at desktop width (typically 980px) and zoom out.</p>
              </div>
            )}

            {!results.mobile.hasMediaQueries && (
              <div className="p-3 bg-white rounded-lg border-l-3 border-orange-500">
                <div className="font-medium text-orange-800">{results.mobile.hasViewport ? '1' : '2'}. Add CSS media queries for responsive layout</div>
                <p className="text-gray-600 mt-1">Add breakpoints to your CSS to adapt layout for different screen sizes:</p>
                <pre className="mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs overflow-x-auto">{`/* Mobile first approach */
@media (min-width: 768px) {
  .container { max-width: 720px; }
  .sidebar { display: block; }
}
@media (min-width: 1024px) {
  .container { max-width: 960px; }
}`}</pre>
                <p className="text-xs text-gray-500 mt-1">Common breakpoints: 480px (small phone), 768px (tablet), 1024px (laptop), 1280px (desktop).</p>
              </div>
            )}

            {results.mobile.smallTapTargets > 0 && (
              <div className="p-3 bg-white rounded-lg border-l-3 border-yellow-500">
                <div className="font-medium text-yellow-800">Fix small tap targets ({results.mobile.smallTapTargets} found)</div>
                <p className="text-gray-600 mt-1">All interactive elements (buttons, links, inputs) should be at least <strong>48x48px</strong> (Google&apos;s recommendation). Add padding to increase the tap area:</p>
                <pre className="mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs overflow-x-auto">{`/* Make links/buttons at least 48px tall */
a, button { min-height: 48px; padding: 12px 16px; }

/* Add spacing between close targets */
nav a { margin: 4px 0; }`}</pre>
              </div>
            )}

            {results.mobile.horizontalScrollRisk && (
              <div className="p-3 bg-white rounded-lg border-l-3 border-red-500">
                <div className="font-medium text-red-800">Fix horizontal scrolling</div>
                <p className="text-gray-600 mt-1">Elements wider than the viewport cause horizontal scroll. Common fixes:</p>
                <pre className="mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs overflow-x-auto">{`/* Prevent overflow */
html, body { overflow-x: hidden; }
img, video, table { max-width: 100%; height: auto; }

/* Replace fixed widths */
.container { width: 100%; max-width: 1200px; /* instead of width: 1200px */ }`}</pre>
              </div>
            )}

            {results.mobile.fixedWidthElements > 0 && (
              <div className="p-3 bg-white rounded-lg border-l-3 border-orange-500">
                <div className="font-medium text-orange-800">Convert fixed widths to responsive ({results.mobile.fixedWidthElements} elements)</div>
                <p className="text-gray-600 mt-1">Replace pixel-based widths with percentage or max-width:</p>
                <pre className="mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs overflow-x-auto">{`/* Instead of: */
.element { width: 800px; }

/* Use: */
.element { width: 100%; max-width: 800px; }`}</pre>
              </div>
            )}

            {(results.mobile.responsiveImagesCount || 0) < (results.mobile.totalImages || 0) && (results.mobile.totalImages || 0) > 0 && (
              <div className="p-3 bg-white rounded-lg border-l-3 border-blue-500">
                <div className="font-medium text-blue-800">Make images responsive ({results.mobile.responsiveImagesCount || 0}/{results.mobile.totalImages || 0} responsive)</div>
                <p className="text-gray-600 mt-1">Use <code className="bg-gray-100 px-1 rounded">srcset</code> and <code className="bg-gray-100 px-1 rounded">sizes</code> for responsive images:</p>
                <pre className="mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs overflow-x-auto">{`<img
  src="image-800.jpg"
  srcset="image-400.jpg 400w, image-800.jpg 800w, image-1200.jpg 1200w"
  sizes="(max-width: 768px) 100vw, 800px"
  alt="Description"
  loading="lazy"
/>`}</pre>
              </div>
            )}

            {!results.mobile.hasManifest && (
              <div className="p-3 bg-white rounded-lg border-l-3 border-gray-400">
                <div className="font-medium text-gray-800">Add Web App Manifest (PWA)</div>
                <p className="text-gray-600 mt-1">Create a <code className="bg-gray-100 px-1 rounded">manifest.json</code> in your root directory and link it in <code className="bg-gray-100 px-1 rounded">&lt;head&gt;</code>:</p>
                <pre className="mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs overflow-x-auto">{`<!-- In <head> -->
<link rel="manifest" href="/manifest.json">

// manifest.json
{
  "name": "Your Site Name",
  "short_name": "Site",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1d4ed8",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}`}</pre>
              </div>
            )}

            {!results.mobile.hasThemeColor && (
              <div className="p-3 bg-white rounded-lg border-l-3 border-gray-400">
                <div className="font-medium text-gray-800">Add theme color</div>
                <p className="text-gray-600 mt-1">Set the browser address bar color on mobile:</p>
                <pre className="mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs overflow-x-auto">{`<meta name="theme-color" content="#1d4ed8">`}</pre>
              </div>
            )}

            {!results.mobile.hasAppleTouchIcon && (
              <div className="p-3 bg-white rounded-lg border-l-3 border-gray-400">
                <div className="font-medium text-gray-800">Add Apple Touch Icon</div>
                <p className="text-gray-600 mt-1">For iOS home screen bookmarks, add a 180x180px PNG icon:</p>
                <pre className="mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs overflow-x-auto">{`<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
};

/* ─── Performance ────────────────────────────────────────────────────── */
export const PerformanceSection = ({ results, expanded, setExpanded }: SectionProps) => (
  <Section title="Performance" icon={Icons.Zap} id="performance" expanded={expanded} setExpanded={setExpanded}>
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
);

/* ─── Loaded Files ───────────────────────────────────────────────────── */
export const LoadedFilesSection = ({ results, expanded, setExpanded }: SectionProps) => (
  <Section title="Loaded Files" icon={Icons.Folder} id="loaded-files" expanded={expanded} setExpanded={setExpanded}>
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
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline break-all">{file.url}</a>
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
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline break-all">{file.url}</a>
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
);

/* ─── Security ───────────────────────────────────────────────────────── */
export const SecuritySection = ({ results, expanded, setExpanded }: SectionProps) => (
  <Section title="Security" icon={Icons.Lock} id="security" expanded={expanded} setExpanded={setExpanded}>
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
);

/* ─── International / Hreflang ───────────────────────────────────────── */
export const InternationalSection = ({ results, expanded, setExpanded }: SectionProps) => {
  if (results.international.hreflangs.length === 0) return null;
  return (
    <Section title="Hreflang / International" icon={Icons.Languages} id="international" expanded={expanded} setExpanded={setExpanded} badge={<span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-sm">{results.international.hreflangs.length} languages</span>}>
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
  );
};

/* ─── Schema ─────────────────────────────────────────────────────────── */
export const SchemaSection = ({ results, expanded, setExpanded }: SectionProps) => {
  if (results.schema.count === 0) return null;
  return (
    <Section title="Schema.org" icon={Icons.Code} id="schema" expanded={expanded} setExpanded={setExpanded} badge={<span className="px-2 py-0.5 rounded-full text-sm" style={{ backgroundColor: `${COLORS.highlight}15`, color: COLORS.highlight }}>{results.schema.count}</span>}>
      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          {results.schema.types.map((t, i) => <span key={i} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: `${COLORS.highlight}15`, color: COLORS.highlight }}>{t}</span>)}
        </div>

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
  );
};

/* ─── Social ─────────────────────────────────────────────────────────── */
export const SocialSection = ({ results, expanded, setExpanded }: SectionProps) => (
  <Section title="Social Media" icon={Icons.Share} id="social" expanded={expanded} setExpanded={setExpanded}>
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
);

/* ─── Platform ───────────────────────────────────────────────────────── */
export const PlatformSection = ({ results, expanded, setExpanded }: SectionProps) => (
  <Section title="Platform" icon={Icons.Zap} id="platform" expanded={expanded} setExpanded={setExpanded}>
    <div className="mt-4 space-y-3">
      {results.platform.cms.length > 0 && <div className="flex items-center gap-2 flex-wrap"><span className="text-gray-500">CMS:</span>{results.platform.cms.map((c, i) => <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">{c}</span>)}</div>}
      {results.platform.frameworks.length > 0 && <div className="flex items-center gap-2 flex-wrap"><span className="text-gray-500">Framework:</span>{results.platform.frameworks.map((f, i) => <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">{f}</span>)}</div>}
      {results.platform.analytics && results.platform.analytics.length > 0 && <div className="flex items-center gap-2 flex-wrap"><span className="text-gray-500">Analytics:</span>{results.platform.analytics.map((a, i) => <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm">{a}</span>)}</div>}
      <div className="flex items-center gap-2"><span className="text-gray-500">Render:</span><span className={`px-2 py-1 rounded text-sm ${results.platform.isCSR ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{results.platform.renderMethod}</span></div>
    </div>
  </Section>
);

/* ─── AI Content ─────────────────────────────────────────────────────── */
const AI_SUPPORTED_LANGS = ['en'];
const getAiScoreLabel = (score: number) => score >= 75 ? 'Very likely AI-generated' : score >= 50 ? 'Likely AI-generated' : score >= 30 ? 'Possibly AI-assisted' : 'Minimal AI indicators';
const getAiScoreExplanation = (score: number, phraseCount: number) => {
  if (score >= 75) return `This content has a very high concentration of AI-typical phrases (${phraseCount} detected). The writing style strongly resembles outputs from large language models (ChatGPT, Claude, etc.). Consider rewriting in a more natural, human voice to improve authenticity and search engine perception.`;
  if (score >= 50) return `Multiple AI-typical phrases were detected (${phraseCount}). The text uses patterns commonly associated with AI content — overuse of transitional phrases like "moreover", "furthermore", and filler expressions like "it is important to note". Consider editing to add personal perspective, specific examples, and a more conversational tone.`;
  if (score >= 30) return `Some AI-typical phrases were found (${phraseCount}). This could indicate AI assistance in drafting or a formal writing style that overlaps with AI patterns. The content reads mostly natural but has some telltale signs. Minor edits could make the tone more authentic.`;
  return `Very few AI indicators found (${phraseCount}). The content appears predominantly human-written. Some common phrases were detected, but these also occur naturally in human writing.`;
};

export const AiContentSection = ({ results, expanded, setExpanded }: SectionProps) => {
  const detectedLang = results.content.detectedLanguage || 'en';
  const isSupported = AI_SUPPORTED_LANGS.includes(detectedLang);
  const langNames: Record<string, string> = { en: 'English', de: 'German', es: 'Spanish', ru: 'Russian', ka: 'Georgian' };

  // Always show section (even if score is 0) so users see the language support note
  return (
    <Section title="AI Content Analysis" icon={Icons.Brain} id="ai" expanded={expanded} setExpanded={setExpanded}
      badge={isSupported ? (
        <span className={`px-2 py-0.5 rounded-full text-sm ${results.content.aiScore >= 50 ? 'bg-red-100 text-red-700' : results.content.aiScore >= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{results.content.aiScore}%</span>
      ) : undefined}
    >
      <div className="mt-4">
        {!isSupported ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 mt-0.5"><Icons.Alert /></span>
              <div>
                <div className="font-medium text-blue-800">AI Detection Not Available for {langNames[detectedLang] || detectedLang}</div>
                <div className="text-sm text-blue-700 mt-1">
                  AI content detection is currently supported only for <strong>English</strong> language content. The detected content language is <strong>{langNames[detectedLang] || detectedLang}</strong>, so AI detection results would not be reliable for this page.
                </div>
                <div className="text-xs text-blue-600 mt-2">
                  AI phrase detection works by identifying patterns commonly used by large language models (e.g., &quot;delve into&quot;, &quot;it is important to note&quot;, &quot;in today&apos;s digital landscape&quot;). These patterns are language-specific and currently calibrated for English only.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-6">
              <div className="relative">
                <DonutChart value={results.content.aiScore} size={100} strokeWidth={10} color={results.content.aiScore >= 75 ? '#ef4444' : results.content.aiScore >= 50 ? '#f97316' : results.content.aiScore >= 30 ? '#f59e0b' : '#10b981'} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{results.content.aiScore}%</span>
                </div>
              </div>
              <div>
                <div className={`text-lg font-medium ${results.content.aiScore >= 50 ? 'text-red-700' : results.content.aiScore >= 30 ? 'text-yellow-700' : 'text-green-700'}`}>
                  {getAiScoreLabel(results.content.aiScore)}
                </div>
                <div className="text-sm text-gray-500 mt-1">{results.content.aiPhrases.length} AI-typical phrase{results.content.aiPhrases.length !== 1 ? 's' : ''} detected</div>
              </div>
            </div>

            {/* Explanation */}
            <div className={`mt-4 p-4 rounded-lg border ${results.content.aiScore >= 50 ? 'bg-red-50 border-red-200' : results.content.aiScore >= 30 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
              <div className="text-sm font-medium mb-1" style={{ color: results.content.aiScore >= 50 ? '#b91c1c' : results.content.aiScore >= 30 ? '#92400e' : '#15803d' }}>Why does the text look {results.content.aiScore >= 50 ? 'AI-generated' : results.content.aiScore >= 30 ? 'AI-assisted' : 'human-written'}?</div>
              <div className="text-sm text-gray-700">{getAiScoreExplanation(results.content.aiScore, results.content.aiPhrases.length)}</div>
            </div>

            {/* Detected Phrases */}
            {results.content.aiPhrases.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Detected AI-typical phrases:</div>
                <div className="flex flex-wrap gap-2">
                  {results.content.aiPhrases.map((phrase, i) => (
                    <span key={i} className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-sm text-gray-700">{phrase}</span>
                  ))}
                </div>
              </div>
            )}

            {/* How scoring works */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">How AI detection scoring works</summary>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-2">
                <p>The AI detection score is calculated by scanning page content for phrases and patterns commonly overused by large language models (LLMs) like ChatGPT, Claude, and others.</p>
                <p>Each detected AI-typical phrase adds <strong>5 points per occurrence</strong> to the score (capped at 100%). The phrases include overused transitions (&quot;moreover&quot;, &quot;furthermore&quot;), filler expressions (&quot;it is important to note&quot;, &quot;in today&apos;s digital landscape&quot;), and buzzwords (&quot;leverage&quot;, &quot;streamline&quot;, &quot;game-changer&quot;).</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  <div className="p-2 bg-green-50 rounded text-center"><div className="font-bold text-green-700">0-29%</div><div className="text-xs">Human-written</div></div>
                  <div className="p-2 bg-yellow-50 rounded text-center"><div className="font-bold text-yellow-700">30-49%</div><div className="text-xs">Possibly AI-assisted</div></div>
                  <div className="p-2 bg-orange-50 rounded text-center"><div className="font-bold text-orange-700">50-74%</div><div className="text-xs">Likely AI-generated</div></div>
                  <div className="p-2 bg-red-50 rounded text-center"><div className="font-bold text-red-700">75-100%</div><div className="text-xs">Very likely AI</div></div>
                </div>
                <p className="text-xs text-gray-500 mt-2"><strong>Note:</strong> This is a heuristic indicator, not a definitive classifier. Formal academic writing may score higher due to similar vocabulary patterns. The score helps identify content that may benefit from a more natural, conversational tone.</p>
              </div>
            </details>
          </>
        )}
      </div>
    </Section>
  );
};

/* ─── Trust ───────────────────────────────────────────────────────────── */
export const TrustSection = ({ results, expanded, setExpanded }: SectionProps) => (
  <Section title="Trust (E-E-A-T)" icon={Icons.Users} id="trust" expanded={expanded} setExpanded={setExpanded}>
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
);
