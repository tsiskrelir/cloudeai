'use client';

import React from 'react';
import { Icons } from './Icons';

export const Section = ({ title, icon: Icon, id, children, badge, expanded, setExpanded }: {
  title: string;
  icon: React.FC;
  id: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <button onClick={() => setExpanded(s => ({ ...s, [id]: !s[id] }))} className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50">
      <div className="flex items-center gap-3"><Icon /><span className="font-semibold text-gray-800">{title}</span>{badge}</div>
      {expanded[id] ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
    </button>
    {expanded[id] && <div className="px-5 pb-5 border-t border-gray-100">{children}</div>}
  </div>
);

export const CheckBadge = ({ ok, label }: { ok: boolean; label: string }) => (
  <div className={`flex items-center gap-1.5 text-sm ${ok ? 'text-green-700' : 'text-red-700'}`}>
    {ok ? <Icons.Check /> : <Icons.Alert />} {label}
  </div>
);
