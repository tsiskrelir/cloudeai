'use client';

import React from 'react';
import { COLORS, getScoreColor } from './constants';
import type { AuditResult } from './types';

interface AuditHistoryProps {
  auditHistory: AuditResult[];
  clearHistory: () => void;
  loadHistoryEntry: (entry: AuditResult) => void;
  copyShareLink: (entry: AuditResult) => void;
}

export const AuditHistory = ({ auditHistory, clearHistory, loadHistoryEntry, copyShareLink }: AuditHistoryProps) => {
  if (auditHistory.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 mb-6" data-export-exclude="true">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold" style={{ color: COLORS.primary }}>Audit History</h2>
        <button onClick={clearHistory} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">Clear history</button>
      </div>
      <div className="space-y-2 max-h-56 overflow-auto">
        {auditHistory.map((entry, i) => (
          <div key={`${entry.url}-${entry.timestamp}-${i}`} className="w-full p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
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
                  onClick={() => copyShareLink(entry)}
                  className="px-2 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Copy link
                </button>
                <span className="px-2 py-1 rounded text-xs font-semibold text-white" style={{ backgroundColor: getScoreColor(entry.score) }}>{entry.score}/100</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
