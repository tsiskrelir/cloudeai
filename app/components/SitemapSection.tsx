'use client';

import React from 'react';
import { Icons } from './Icons';
import { COLORS } from './constants';
import { Section } from './Section';
import { SiteTreeView } from './SiteTreeView';
import type { AuditResult } from './types';

interface SitemapSectionProps {
  results: AuditResult;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const SitemapSection = ({ results, expanded, setExpanded }: SitemapSectionProps) => (
  <Section title="Sitemap & Site Structure" icon={Icons.Sitemap} id="sitemap" expanded={expanded} setExpanded={setExpanded} badge={results.technical.siteTree ? <span className="px-2 py-0.5 rounded-full text-sm" style={{ backgroundColor: `${COLORS.secondary}20`, color: COLORS.primary }}>{results.technical.siteTree.totalUrls} URLs</span> : null}>
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

          {results.technical.siteTree.totalUrls > (results.technical.siteTree.displayedUrls || results.technical.siteTree.sitemapUrls.length) && (
            <div className="p-3 rounded-lg bg-blue-50 text-sm text-blue-700">
              Showing {results.technical.siteTree.displayedUrls || results.technical.siteTree.sitemapUrls.length} of {results.technical.siteTree.totalUrls} total URLs in sitemap for performance.
            </div>
          )}

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

          <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-auto border" style={{ borderColor: `${COLORS.primary}20` }}>
            <div className="text-sm font-medium mb-3" style={{ color: COLORS.primary }}>Site Structure Tree:</div>
            <SiteTreeView node={results.technical.siteTree.tree} />
          </div>

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

      {!results.technical.siteTree && results.fetchMethod === 'html' && (
        <div className="p-4 rounded-lg" style={{ backgroundColor: `${COLORS.secondary}10` }}>
          <div className="text-sm" style={{ color: COLORS.primary }}>
            <strong>Note:</strong> Site tree visualization requires URL mode. Use &quot;By URL&quot; input to see the full site structure.
          </div>
        </div>
      )}
    </div>
  </Section>
);
