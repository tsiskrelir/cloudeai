'use client';

import React from 'react';
import { COLORS, getScoreColor } from './constants';
import type { AuditResult } from './types';

interface ComparisonViewProps {
  a: AuditResult;
  b: AuditResult;
  onClose: () => void;
}

type MetricDef = {
  label: string;
  get: (r: AuditResult) => number | string;
  higherIsBetter?: boolean; // true = higher score is green, false = lower is green
  unit?: string;
};

const METRICS: MetricDef[] = [
  { label: 'SEO Score',         get: r => r.score,                                    higherIsBetter: true },
  { label: 'Critical Issues',   get: r => r.summary.criticalIssues,                   higherIsBetter: false },
  { label: 'High Issues',       get: r => r.summary.highIssues,                       higherIsBetter: false },
  { label: 'Medium Issues',     get: r => r.summary.mediumIssues,                     higherIsBetter: false },
  { label: 'Low Issues',        get: r => r.summary.lowIssues,                        higherIsBetter: false },
  { label: 'Passed Checks',     get: r => r.summary.passedChecks,                     higherIsBetter: true },
  { label: 'Total Issues',      get: r => r.issues.length,                            higherIsBetter: false },
  { label: 'Word Count',        get: r => r.content?.wordCount ?? 0,                  higherIsBetter: true },
  { label: 'Flesch Score',      get: r => r.content?.readability?.fleschScore ?? 0,   higherIsBetter: true },
  { label: 'Title Length',      get: r => r.technical?.title?.length ?? 0,            higherIsBetter: true, unit: 'chars' },
  { label: 'Meta Desc Length',  get: r => r.technical?.metaDesc?.length ?? 0,         higherIsBetter: true, unit: 'chars' },
  { label: 'Total Images',      get: r => r.images?.total ?? 0,                       higherIsBetter: true },
  { label: 'Images Missing Alt',get: r => r.images?.withoutAlt ?? 0,                  higherIsBetter: false },
  { label: 'Internal Links',    get: r => r.links?.internal ?? 0,                     higherIsBetter: true },
  { label: 'Broken Links',      get: r => (r.links?.brokenList?.length ?? 0) + (r.links?.brokenInternalList?.length ?? 0) + (r.links?.brokenExternalList?.length ?? 0), higherIsBetter: false },
  { label: 'Schema Types',      get: r => r.schema?.count ?? 0,                       higherIsBetter: true },
  { label: 'HTTPS',             get: r => r.security?.isHttps ? 'Yes' : 'No' },
];

const delta = (av: number | string, bv: number | string, higherIsBetter?: boolean) => {
  if (typeof av !== 'number' || typeof bv !== 'number') return null;
  const diff = av - bv;
  if (diff === 0) return null;
  const aWins = higherIsBetter ? diff > 0 : diff < 0;
  return { diff, aWins };
};

const fmt = (v: number | string, unit?: string) => {
  if (typeof v === 'number') return unit ? `${v} ${unit}` : String(v);
  return v;
};

export const ComparisonView = ({ a, b, onClose }: ComparisonViewProps) => {
  const aDate = new Date(a.timestamp).toLocaleDateString();
  const bDate = new Date(b.timestamp).toLocaleDateString();

  const aScore = a.score;
  const bScore = b.score;
  const winner = aScore > bScore ? 'a' : bScore > aScore ? 'b' : 'tie';

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6" data-export-exclude="true">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold" style={{ color: COLORS.primary }}>Audit Comparison</h2>
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm">
          Close
        </button>
      </div>

      {/* Score header */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mb-6">
        <div className={`p-4 rounded-xl text-center border-2 ${winner === 'a' ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="text-xs text-gray-500 truncate mb-1">{a.url}</div>
          <div className="text-xs text-gray-400 mb-2">{aDate}</div>
          <div className="text-4xl font-bold" style={{ color: getScoreColor(aScore) }}>{aScore}</div>
          <div className="text-sm text-gray-500 mt-1">/ 100</div>
          {winner === 'a' && <div className="mt-2 text-xs font-semibold text-green-700 bg-green-100 rounded-full px-3 py-0.5 inline-block">Better</div>}
        </div>

        <div className="flex items-center justify-center">
          <div className="text-2xl font-bold text-gray-300">vs</div>
        </div>

        <div className={`p-4 rounded-xl text-center border-2 ${winner === 'b' ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="text-xs text-gray-500 truncate mb-1">{b.url}</div>
          <div className="text-xs text-gray-400 mb-2">{bDate}</div>
          <div className="text-4xl font-bold" style={{ color: getScoreColor(bScore) }}>{bScore}</div>
          <div className="text-sm text-gray-500 mt-1">/ 100</div>
          {winner === 'b' && <div className="mt-2 text-xs font-semibold text-green-700 bg-green-100 rounded-full px-3 py-0.5 inline-block">Better</div>}
        </div>
      </div>

      {/* Metrics table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 font-semibold text-gray-600 w-1/3">Metric</th>
              <th className="text-center py-2 px-3 font-semibold w-1/4" style={{ color: COLORS.primary }}>
                <div className="truncate max-w-[150px] mx-auto">{new URL(a.url).hostname}</div>
                <div className="text-xs text-gray-400 font-normal">{aDate}</div>
              </th>
              <th className="text-center py-2 px-3 font-semibold w-1/4" style={{ color: COLORS.primary }}>
                <div className="truncate max-w-[150px] mx-auto">{new URL(b.url).hostname}</div>
                <div className="text-xs text-gray-400 font-normal">{bDate}</div>
              </th>
              <th className="text-center py-2 pl-3 font-semibold text-gray-500 w-1/6">Delta</th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map(({ label, get, higherIsBetter, unit }) => {
              const av = get(a);
              const bv = get(b);
              const d = delta(av, bv, higherIsBetter);

              return (
                <tr key={label} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-2 pr-4 text-gray-600">{label}</td>
                  <td className={`py-2 px-3 text-center font-medium ${d?.aWins ? 'text-green-700' : d && !d.aWins ? 'text-red-600' : 'text-gray-800'}`}>
                    {fmt(av, unit)}
                  </td>
                  <td className={`py-2 px-3 text-center font-medium ${d && !d.aWins ? 'text-green-700' : d?.aWins ? 'text-red-600' : 'text-gray-800'}`}>
                    {fmt(bv, unit)}
                  </td>
                  <td className="py-2 pl-3 text-center text-xs">
                    {d ? (
                      <span className={`px-1.5 py-0.5 rounded font-semibold ${d.aWins ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {d.aWins ? '▲' : '▼'} {Math.abs(d.diff)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Delta (▲/▼) shows how Audit A differs from Audit B. Green = improvement, red = regression.
      </p>
    </div>
  );
};
