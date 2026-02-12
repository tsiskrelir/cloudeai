'use client';

import React from 'react';
import { Icons } from './Icons';
import { getSeverityStyle, getSeverityLabel } from './constants';
import { Section } from './Section';
import type { AuditResult, AuditIssue } from './types';

interface IssuesListProps {
  results: AuditResult;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const sortedIssues = (issues: AuditIssue[]) => {
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...issues].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
};

export const IssuesList = ({ results, expanded, setExpanded }: IssuesListProps) => (
  <Section title="Issues Found" icon={Icons.Alert} id="issues" expanded={expanded} setExpanded={setExpanded} badge={<span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-sm">{results.issues.length}</span>}>
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

              {/* Show redirect links list (301/302) */}
              {issue.id === 'redirect-links' && results.links.redirectList && results.links.redirectList.length > 0 && (
                <div className="mt-2 p-2 bg-white/30 rounded text-xs space-y-2">
                  <div className="font-medium">Redirected Links (301/302):</div>
                  {results.links.redirectList.slice(0, 8).map((link: { href: string; text: string; status: number; location: string }, j: number) => (
                    <div key={j} className="p-2 bg-white/40 rounded border-l-2 border-orange-500">
                      <code className="block bg-gray-800 text-orange-300 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap break-all">{`<a href="${link.href}">${link.text || '(no text)'}<\/a>`}</code>
                      <div className="mt-1 text-orange-700">HTTP {link.status} → {link.location}</div>
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
);
