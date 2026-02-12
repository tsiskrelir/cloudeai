'use client';

import React from 'react';
import { Icons } from './Icons';
import { Section } from './Section';
import { DonutChart, BarChart } from './charts';
import type { AuditResult } from './types';

interface ContentSectionProps {
  results: AuditResult;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const ContentSection = ({ results, expanded, setExpanded }: ContentSectionProps) => (
  <Section title="Content & Readability" icon={Icons.FileText} id="content" expanded={expanded} setExpanded={setExpanded}>
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
);
