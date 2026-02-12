'use client';

import React from 'react';
import { Icons } from './Icons';
import { COLORS } from './constants';
import { Section } from './Section';
import type { AuditResult } from './types';

interface LinksSectionProps {
  results: AuditResult;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const LinksSection = ({ results, expanded, setExpanded }: LinksSectionProps) => {
  const emptyBroken = results.links.brokenList || [];
  const brokenInternal = results.links.brokenInternalList || [];
  const brokenExternal = results.links.brokenExternalList || [];
  const redirectedLinks = results.links.redirectList || [];
  const totalBrokenCount = emptyBroken.length + brokenInternal.length + brokenExternal.length;

  return (
    <Section title="Links" icon={Icons.Link} id="links" expanded={expanded} setExpanded={setExpanded}>
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mt-4">
        <div className="text-center p-4 rounded-lg" style={{ backgroundColor: `${COLORS.primary}10` }}><div className="text-2xl font-bold" style={{ color: COLORS.primary }}>{results.links.total}</div><div className="text-sm text-gray-600">Total</div></div>
        <div className="text-center p-4 bg-green-50 rounded-lg"><div className="text-2xl font-bold text-green-700">{results.links.internal}</div><div className="text-sm text-green-600">Internal</div></div>
        <div className="text-center p-4 rounded-lg" style={{ backgroundColor: `${COLORS.secondary}15` }}><div className="text-2xl font-bold" style={{ color: COLORS.primary }}>{results.links.external}</div><div className="text-sm text-gray-600">External</div></div>
        <div className={`text-center p-4 rounded-lg ${totalBrokenCount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}><div className={`text-2xl font-bold ${totalBrokenCount > 0 ? 'text-red-700' : 'text-gray-700'}`}>{totalBrokenCount}</div><div className="text-sm text-gray-600">Broken</div></div>
        <div className={`text-center p-4 rounded-lg ${redirectedLinks.length > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}><div className={`text-2xl font-bold ${redirectedLinks.length > 0 ? 'text-orange-700' : 'text-gray-700'}`}>{redirectedLinks.length}</div><div className="text-sm text-gray-600">Redirected</div></div>
        <div className={`text-center p-4 rounded-lg ${results.links.genericAnchors > 0 ? 'bg-yellow-50' : 'bg-gray-50'}`}><div className={`text-2xl font-bold ${results.links.genericAnchors > 0 ? 'text-yellow-700' : 'text-gray-700'}`}>{results.links.genericAnchors}</div><div className="text-sm text-gray-600">Generic</div></div>
        <div className="text-center p-4 bg-gray-50 rounded-lg"><div className="text-2xl font-bold text-gray-700">{results.links.nofollow}</div><div className="text-sm text-gray-600">Nofollow</div></div>
      </div>

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

      {/* Redirected Links (301/302) */}
      {results.links.redirectList && results.links.redirectList.length > 0 && (
        <div className="mt-4">
          <details className="group" open>
            <summary className="cursor-pointer font-medium text-orange-800 hover:text-orange-600">
              Redirected Links ({results.links.redirectList.length}) <span className="text-gray-400 text-sm">click to expand/collapse</span>
            </summary>
            <div className="mt-2 p-4 bg-orange-50 border border-orange-200 rounded-lg max-h-64 overflow-auto">
              <div className="space-y-2">
                {results.links.redirectList.map((link: { href: string; text?: string; status: number; location: string }, i: number) => (
                  <div key={`redirect-${i}`} className="p-2 bg-white rounded text-sm border border-orange-100">
                    <code className="text-orange-700 break-all">{link.href}</code>
                    {link.text && <span className="text-gray-500 ml-2">- {link.text}</span>}
                    <div className="text-xs text-orange-600 mt-1">HTTP {link.status} → {link.location}</div>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </div>
      )}

      {/* Broken Links */}
      {totalBrokenCount > 0 && (
        <div className="mt-4">
          <details className="group" open>
            <summary className="cursor-pointer font-medium text-red-800 hover:text-red-600">
              Broken Links ({totalBrokenCount}) <span className="text-gray-400 text-sm">click to expand/collapse</span>
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
      )}

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
  );
};
