'use client';

import React from 'react';
import { COLORS, getScoreColor } from './constants';
import type { AuditResult } from './types';

interface AuditHistoryProps {
  auditHistory: AuditResult[];
  clearHistory: () => void;
  loadHistoryEntry: (entry: AuditResult) => void;
  copyShareLink: (entry: AuditResult) => void;
  exportBulkCsv: () => void;
  compareItems: AuditResult[];
  toggleCompare: (entry: AuditResult) => void;
}

export const AuditHistory = ({
  auditHistory, clearHistory, loadHistoryEntry, copyShareLink,
  exportBulkCsv, compareItems, toggleCompare,
}: AuditHistoryProps) => {
  if (auditHistory.length === 0) return null;

  const isSelected = (entry: AuditResult) =>
    compareItems.some(c => c.url === entry.url && c.timestamp === entry.timestamp);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 mb-6" data-export-exclude="true">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-semibold" style={{ color: COLORS.primary }}>Audit History</h2>
        <div className="flex items-center gap-2">
          {auditHistory.length > 1 && (
            <button
              onClick={exportBulkCsv}
              className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
              title="Export all history entries as CSV"
            >
              Export all CSV
            </button>
          )}
          <button onClick={clearHistory} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">
            Clear history
          </button>
        </div>
      </div>

      {compareItems.length > 0 && (
        <div className="mb-2 px-3 py-2 rounded-lg text-sm flex items-center justify-between" style={{ backgroundColor: `${COLORS.secondary}18` }}>
          <span style={{ color: COLORS.primary }}>
            {compareItems.length === 1
              ? 'Select one more audit to compare'
              : `Comparing 2 audits`}
          </span>
          {compareItems.length > 0 && (
            <button onClick={() => compareItems.forEach(c => toggleCompare(c))} className="text-xs text-gray-500 hover:text-gray-800 ml-2">
              Cancel
            </button>
          )}
        </div>
      )}

      <div className="space-y-2 max-h-56 overflow-auto">
        {auditHistory.map((entry, i) => {
          const selected = isSelected(entry);
          return (
            <div
              key={`${entry.url}-${entry.timestamp}-${i}`}
              className={`w-full p-3 rounded-lg border transition-colors ${selected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => loadHistoryEntry(entry)}
                  className="text-left flex-1 min-w-0"
                >
                  <div className="font-medium text-sm truncate" style={{ color: COLORS.primary }}>{entry.url}</div>
                  <div className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleCompare(entry)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${selected ? 'bg-blue-200 text-blue-800 font-medium' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                    title="Select for comparison"
                  >
                    {selected ? '✓ Selected' : 'Compare'}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyShareLink(entry)}
                    className="px-2 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    Copy link
                  </button>
                  <span className="px-2 py-1 rounded text-xs font-semibold text-white" style={{ backgroundColor: getScoreColor(entry.score) }}>{entry.score}/100</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
