'use client';

import React from 'react';
import { Icons } from './Icons';
import { COLORS } from './constants';
import { Section, CheckBadge } from './Section';
import { HorizontalBar } from './charts';
import type { AuditResult } from './types';

interface TechnicalSectionProps {
  results: AuditResult;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const TechnicalSection = ({ results, expanded, setExpanded }: TechnicalSectionProps) => (
  <Section title="Technical Details" icon={Icons.Shield} id="technical" expanded={expanded} setExpanded={setExpanded}>
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
);
