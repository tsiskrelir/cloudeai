'use client';

import React, { useState } from 'react';
import { Icons } from './Icons';
import { COLORS } from './constants';
import type { SiteTreeNode } from './types';

export const SiteTreeView = ({ node, level = 0 }: { node: SiteTreeNode; level?: number }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="font-mono text-sm">
      <div
        className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-gray-100 ${node.isCurrentPage ? 'bg-yellow-100 font-bold' : ''}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          <span className="text-gray-400">{isExpanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />}</span>
        ) : (
          <span className="w-5" />
        )}
        <span style={{ color: hasChildren ? COLORS.primary : COLORS.secondary }}>
          {hasChildren ? <Icons.Folder /> : <Icons.File />}
        </span>
        <span className={node.isCurrentPage ? 'text-yellow-700' : 'text-gray-700'}>
          {node.path || '/'}
        </span>
        {node.isCurrentPage && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded" style={{ backgroundColor: COLORS.accent, color: COLORS.primary }}>
            Current Page
          </span>
        )}
        {node.status && node.status !== 200 && (
          <span className={`ml-2 px-2 py-0.5 text-xs rounded ${node.status === 301 || node.status === 302 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
            {node.status}
          </span>
        )}
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child, i) => (
            <SiteTreeView key={i} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
