'use client';

import React, { useState, useCallback, useEffect } from 'react';

// Types & constants
import type { AuditResult } from './components/types';
import { COLORS, ALL_SECTIONS, getScoreColor } from './components/constants';

// Components
import { AuditForm } from './components/AuditForm';
import { AuditHistory } from './components/AuditHistory';
import { ScoreOverview } from './components/ScoreOverview';
import { IssuesList } from './components/IssuesList';
import { PassedChecks } from './components/PassedChecks';
import { SitemapSection } from './components/SitemapSection';
import { ContentSection } from './components/ContentSection';
import { TechnicalSection } from './components/TechnicalSection';
import { LinksSection } from './components/LinksSection';
import { ImagesSection } from './components/ImagesSection';
import { Footer } from './components/Footer';
import {
  DomSection,
  AccessibilitySection,
  MobileSection,
  PerformanceSection,
  LoadedFilesSection,
  SecuritySection,
  InternationalSection,
  SchemaSection,
  SocialSection,
  PlatformSection,
  AiContentSection,
  TrustSection,
} from './components/MiscSections';

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
  const [auditHistory, setAuditHistory] = useState<AuditResult[]>([]);

  const toggleAllSections = (expandAll: boolean) => {
    setExpanded(ALL_SECTIONS.reduce((acc, sectionId) => ({ ...acc, [sectionId]: expandAll }), {}));
  };

  const handleAnalyze = async () => {
    setError('');
    setResults(null);
    setMultiResults([]);
    setLoading(true);

    try {
      if (inputMode === 'url') {
        const urls = url.split('\n').map(u => u.trim()).filter(u => u && u.startsWith('http'));
        if (urls.length === 0) {
          throw new Error('Please enter at least one valid URL. URL must start with http:// or https://');
        }

        setTotalUrls(urls.length);
        const successfulResults: AuditResult[] = [];
        const failedUrls: string[] = [];

        for (let i = 0; i < urls.length; i++) {
          setCurrentUrlIndex(i + 1);
          try {
            const res = await fetch('/api/audit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: urls[i] })
            });

            let data: any = null;
            try {
              data = await res.json();
            } catch {
              // Keep null and use HTTP-level details below
            }

            if (res.ok && data) {
              successfulResults.push(data as AuditResult);
            } else {
              const apiMessage = data?.error || data?.details || data?.message || 'No error details from API';
              failedUrls.push(`${urls[i]} — HTTP ${res.status} ${res.statusText}. ${apiMessage}`);
            }
          } catch (err) {
            const reason = err instanceof Error ? err.message : 'Unknown network error';
            failedUrls.push(`${urls[i]} — Request failed. ${reason}`);
          }
        }

        if (successfulResults.length === 0) {
          const fullReason = failedUrls.length > 0
            ? `Failed to analyze all URLs:\n${failedUrls.join('\n')}`
            : 'Failed to analyze any URLs for an unknown reason.';
          throw new Error(fullReason);
        }

        setMultiResults(successfulResults);
        setResults(successfulResults[0]);
        setExpanded(ALL_SECTIONS.reduce((acc, s) => ({ ...acc, [s]: true }), {}));
        saveToHistory(successfulResults);

        if (failedUrls.length > 0) {
          setError(`Some URLs could not be analyzed:\n${failedUrls.join('\n')}`);
        }
      } else {
        const res = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: htmlInput, url })
        });

        let data: any = null;
        try {
          data = await res.json();
        } catch {
          // Keep null and report HTTP details below
        }

        if (!res.ok) {
          const apiMessage = data?.error || data?.details || data?.message || 'No error details from API';
          throw new Error(`Audit failed. HTTP ${res.status} ${res.statusText}. ${apiMessage}`);
        }

        if (!data) {
          throw new Error(`Audit failed. HTTP ${res.status} ${res.statusText}. Empty response body.`);
        }

        setResults(data as AuditResult);
        setMultiResults([data as AuditResult]);
        setExpanded(ALL_SECTIONS.reduce((acc, s) => ({ ...acc, [s]: true }), {}));
        saveToHistory([data as AuditResult]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred while running the audit.');
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
      const exportNode = reportEl.cloneNode(true) as HTMLElement;
      exportNode.querySelectorAll('[data-export-exclude="true"]').forEach((node) => node.remove());
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
  ${exportNode.outerHTML}
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

  const saveToHistory = (items: AuditResult[]) => {
    if (!items.length) return;
    setAuditHistory((prev) => {
      const merged = [...items, ...prev].filter((item, index, arr) =>
        index === arr.findIndex((x) => x.url === item.url && x.timestamp === item.timestamp)
      ).slice(0, 25);
      // Try storing progressively fewer items if quota is exceeded
      let stored = false;
      for (let limit = merged.length; limit > 0 && !stored; limit = Math.floor(limit / 2)) {
        try {
          localStorage.setItem('seo-audit-history', JSON.stringify(merged.slice(0, limit)));
          stored = true;
        } catch {
          // QuotaExceededError — retry with fewer items
        }
      }
      return merged;
    });
  };

  const loadHistoryEntry = (entry: AuditResult) => {
    setResults(entry);
    setMultiResults([entry]);
    toggleAllSections(true);
    setError('');
  };

  const clearHistory = () => {
    setAuditHistory([]);
    localStorage.removeItem('seo-audit-history');
  };

  const createShareLink = async (audit: AuditResult) => {
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audit })
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.id) {
      const details = data?.details || data?.error || 'Unknown error while creating share link';
      throw new Error(`Could not create share link: ${details}`);
    }

    return `${window.location.origin}${window.location.pathname}?share=${encodeURIComponent(data.id)}`;
  };

  const copyShareLink = async (audit: AuditResult) => {
    try {
      const link = await createShareLink(audit);
      await navigator.clipboard.writeText(link);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not copy share link.');
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('seo-audit-history');
      if (raw) {
        const parsed = JSON.parse(raw) as AuditResult[];
        if (Array.isArray(parsed)) {
          setAuditHistory(parsed.slice(0, 25));
        }
      }
    } catch {
      setAuditHistory([]);
    }
  }, []);

  useEffect(() => {
    const loadSharedAudit = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const shareId = params.get('share');

        if (shareId) {
          const res = await fetch(`/api/share?id=${encodeURIComponent(shareId)}`);
          const data = await res.json().catch(() => null);
          if (!res.ok || !data?.audit) {
            const details = data?.details || data?.error || 'Unknown error while loading shared audit';
            setError(`Could not load shared audit: ${details}`);
            return;
          }
          const parsed = data.audit as AuditResult;
          if (parsed && parsed.url && typeof parsed.score === 'number') {
            setResults(parsed);
            setMultiResults([parsed]);
            toggleAllSections(true);
            saveToHistory([parsed]);
            setError('');
          }
          return;
        }

        // Backward compatibility for older long links
        const shared = params.get('audit');
        if (!shared) return;
        const parsed = JSON.parse(decodeURIComponent(escape(atob(shared)))) as AuditResult;
        if (parsed && parsed.url && typeof parsed.score === 'number') {
          setResults(parsed);
          setMultiResults([parsed]);
          toggleAllSections(true);
          saveToHistory([parsed]);
          setError('');
        }
      } catch {
        // Ignore invalid shared payloads
      }
    };

    loadSharedAudit();
  }, []);

  return (
    <div id="seo-audit-report" className="min-h-screen" style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 50%, ${COLORS.primary} 100%)` }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(90deg, #e5e7eb 0%, ${COLORS.secondary} 55%, ${COLORS.primaryLight} 100%)` }} className="text-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <div className="flex items-center justify-start">
              <a href="https://www.web-seo.pro/" target="_blank" rel="noopener noreferrer" aria-label="Web & SEO homepage">
                <img
                  src="https://www.web-seo.pro/wp-content/uploads/2024/07/webseologo.png"
                  alt="Web & SEO logo"
                  className="w-16 h-16 object-contain"
                />
              </a>
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
        {/* Input Form */}
        <AuditForm
          url={url} setUrl={setUrl}
          htmlInput={htmlInput} setHtmlInput={setHtmlInput}
          inputMode={inputMode} setInputMode={setInputMode}
          loading={loading} error={error}
          isDragging={isDragging} setIsDragging={setIsDragging}
          totalUrls={totalUrls} currentUrlIndex={currentUrlIndex}
          handleAnalyze={handleAnalyze}
          toggleAllSections={toggleAllSections}
          setResults={() => setResults(null)}
          setError={setError}
          handleDrop={handleDrop}
        />

        {/* Audit History */}
        <AuditHistory
          auditHistory={auditHistory}
          clearHistory={clearHistory}
          loadHistoryEntry={loadHistoryEntry}
          copyShareLink={copyShareLink}
        />

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
            <ScoreOverview results={results} expanded={expanded} setExpanded={setExpanded} exportData={exportData} copyShareLink={copyShareLink} />
            <IssuesList results={results} expanded={expanded} setExpanded={setExpanded} />
            <PassedChecks results={results} expanded={expanded} setExpanded={setExpanded} />
            <SitemapSection results={results} expanded={expanded} setExpanded={setExpanded} />
            <ContentSection results={results} expanded={expanded} setExpanded={setExpanded} />
            <TechnicalSection results={results} expanded={expanded} setExpanded={setExpanded} />
            <DomSection results={results} expanded={expanded} setExpanded={setExpanded} />
            <AccessibilitySection results={results} expanded={expanded} setExpanded={setExpanded} />
            <MobileSection results={results} expanded={expanded} setExpanded={setExpanded} />
            <PerformanceSection results={results} expanded={expanded} setExpanded={setExpanded} />
            <LoadedFilesSection results={results} expanded={expanded} setExpanded={setExpanded} />
            <SecuritySection results={results} expanded={expanded} setExpanded={setExpanded} />
            <InternationalSection results={results} expanded={expanded} setExpanded={setExpanded} />
            <LinksSection results={results} expanded={expanded} setExpanded={setExpanded} />
            <ImagesSection results={results} expanded={expanded} setExpanded={setExpanded} />
            <SchemaSection results={results} expanded={expanded} setExpanded={setExpanded} />
            <SocialSection results={results} expanded={expanded} setExpanded={setExpanded} />
            <PlatformSection results={results} expanded={expanded} setExpanded={setExpanded} />
            <AiContentSection results={results} expanded={expanded} setExpanded={setExpanded} />
            <TrustSection results={results} expanded={expanded} setExpanded={setExpanded} />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
