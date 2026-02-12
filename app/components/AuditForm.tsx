'use client';

import React, { useCallback } from 'react';
import { Icons } from './Icons';
import { COLORS } from './constants';

interface AuditFormProps {
  url: string;
  setUrl: (v: string) => void;
  htmlInput: string;
  setHtmlInput: (v: string) => void;
  inputMode: 'url' | 'html';
  setInputMode: (v: 'url' | 'html') => void;
  loading: boolean;
  error: string;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  totalUrls: number;
  currentUrlIndex: number;
  handleAnalyze: () => void;
  toggleAllSections: (expand: boolean) => void;
  setResults: (v: null) => void;
  setError: (v: string) => void;
  handleDrop: (e: React.DragEvent) => void;
}

export const AuditForm = ({
  url, setUrl, htmlInput, setHtmlInput, inputMode, setInputMode,
  loading, error, isDragging, setIsDragging,
  totalUrls, currentUrlIndex, handleAnalyze, toggleAllSections,
  setResults, setError, handleDrop,
}: AuditFormProps) => (
  <div className="bg-white rounded-2xl shadow-xl p-6 mb-8" data-export-exclude="true">
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
      <button onClick={() => toggleAllSections(true)} className="px-4 py-1.5 text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all hover:opacity-90" style={{ backgroundColor: COLORS.accent, color: COLORS.primary }}>Open all sections</button>
      <button onClick={() => toggleAllSections(false)} className="px-4 py-1.5 text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all hover:opacity-90" style={{ backgroundColor: COLORS.accent, color: COLORS.primary }}>Collapse all sections</button>
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

    {error && <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"><span className="text-red-600"><Icons.Alert /></span><span className="text-red-700 whitespace-pre-line">{error}</span></div>}
  </div>
);
