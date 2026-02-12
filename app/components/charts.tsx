'use client';

import React from 'react';

export const DonutChart = ({ value, size = 120, strokeWidth = 10, color }: { value: number; size?: number; strokeWidth?: number; color: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
    </svg>
  );
};

export const BarChart = ({ data, maxValue }: { data: { label: string; value: number; color: string }[]; maxValue?: number }) => {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-20 text-sm text-gray-600 truncate">{item.label}</div>
          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }} />
          </div>
          <div className="w-10 text-sm font-medium text-right">{item.value}</div>
        </div>
      ))}
    </div>
  );
};

export const PieChart = ({ data, size = 120 }: { data: { label: string; value: number; color: string }[]; size?: number }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  let currentAngle = 0;
  const segments = data.map(d => {
    const angle = (d.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { ...d, startAngle, angle };
  });

  const describeArc = (startAngle: number, endAngle: number, radius: number) => {
    const start = { x: size / 2 + radius * Math.cos((Math.PI * startAngle) / 180), y: size / 2 + radius * Math.sin((Math.PI * startAngle) / 180) };
    const end = { x: size / 2 + radius * Math.cos((Math.PI * endAngle) / 180), y: size / 2 + radius * Math.sin((Math.PI * endAngle) / 180) };
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${size / 2} ${size / 2} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
  };

  return (
    <svg width={size} height={size}>
      {segments.map((seg, i) => seg.value > 0 && (
        <path key={i} d={describeArc(seg.startAngle - 90, seg.startAngle + seg.angle - 90, size / 2 - 5)} fill={seg.color} className="transition-all duration-500" />
      ))}
    </svg>
  );
};

export const HorizontalBar = ({ value, max, color, label }: { value: number; max: number; color: string; label: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm"><span className="text-gray-600">{label}</span><span className="font-medium">{value}</span></div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }} />
    </div>
  </div>
);
