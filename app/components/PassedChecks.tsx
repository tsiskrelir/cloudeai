'use client';

import React from 'react';
import { Icons } from './Icons';
import { Section } from './Section';
import type { AuditResult } from './types';

interface PassedChecksProps {
  results: AuditResult;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const PassedChecks = ({ results, expanded, setExpanded }: PassedChecksProps) => (
  <Section title="Passed Checks" icon={Icons.Check} id="passed" expanded={expanded} setExpanded={setExpanded} badge={<span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-sm">{results.passed.length}</span>}>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
      {results.passed.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg text-sm"><Icons.Check /> {p}</div>
      ))}
    </div>
  </Section>
);
