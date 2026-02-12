'use client';

import React from 'react';
import { Icons } from './Icons';
import { COLORS, getScoreColor } from './constants';
import { DonutChart, BarChart, PieChart } from './charts';
import { Section } from './Section';
import type { AuditResult } from './types';

interface ScoreOverviewProps {
  results: AuditResult;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  exportData: (format: 'json' | 'csv' | 'html' | 'pdf') => void;
  copyShareLink: (audit: AuditResult) => void;
}

export const ScoreOverview = ({ results, expanded, setExpanded, exportData, copyShareLink }: ScoreOverviewProps) => {
  const emptyHrefs = results.links.brokenList?.length || 0;
  const brokenInternal = results.links.brokenInternalList?.length || 0;
  const brokenExternal = results.links.brokenExternalList?.length || 0;
  const brokenCount = emptyHrefs + brokenInternal + brokenExternal;
  const redirectedCount = results.links.redirectList?.length || 0;

  return (
    <Section title="Overview" icon={Icons.Chart} id="overview" expanded={expanded} setExpanded={setExpanded}>
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
        <div className="p-6 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-800 mb-4">Links Distribution</h3>
          <div className="flex items-center justify-center gap-4">
            <PieChart data={[
              { label: 'Internal', value: results.links.internal, color: COLORS.accent },
              { label: 'External', value: results.links.external, color: COLORS.secondary },
              { label: 'Broken', value: brokenCount, color: '#ef4444' },
              { label: 'Redirected', value: redirectedCount, color: '#f97316' },
            ]} size={100} />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.accent }} /><span>Internal: {results.links.internal}</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.secondary }} /><span>External: {results.links.external}</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span>Broken: {brokenCount}</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /><span>Redirected: {redirectedCount}</span></div>
            </div>
          </div>
        </div>
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
        <button onClick={() => copyShareLink(results)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm"><Icons.Link /> Copy Share Link</button>
      </div>
    </Section>
  );
};
