import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { AuditResult } from './types';

const NAVY = '#11225c';
const RED = '#ef4444';
const ORANGE = '#f97316';
const YELLOW = '#ca8a04';
const BLUE = '#3b82f6';
const GREEN = '#10b981';

const getScoreColor = (s: number) => s >= 90 ? GREEN : s >= 70 ? '#f59e0b' : s >= 50 ? ORANGE : RED;
const getScoreLabel = (s: number) => s >= 90 ? 'Excellent' : s >= 70 ? 'Good' : s >= 50 ? 'Average' : 'Needs Work';

const sevColor: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  critical: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', badge: RED },
  high:     { bg: '#fff7ed', border: '#fdba74', text: '#9a3412', badge: ORANGE },
  medium:   { bg: '#fefce8', border: '#fde047', text: '#854d0e', badge: YELLOW },
  low:      { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af', badge: BLUE },
};

const s = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#fff', fontFamily: 'Helvetica', fontSize: 10, color: '#1f2937' },
  header: { backgroundColor: NAVY, marginHorizontal: -40, marginTop: -40, padding: 28, marginBottom: 22 },
  headerTitle: { color: '#ffffff', fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 5 },
  headerUrl: { color: '#d1d5db', fontSize: 9, marginBottom: 2 },
  headerDate: { color: '#9ca3af', fontSize: 8 },

  scoreRow: { flexDirection: 'row', marginBottom: 18 },
  scoreBox: { padding: 14, borderRadius: 6, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 36, fontFamily: 'Helvetica-Bold' },
  scoreOf: { fontSize: 9, color: '#6b7280', marginTop: 1 },
  scoreGrade: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginTop: 4 },

  sevRow: { flexDirection: 'row', flex: 1, padding: 14, borderRadius: 6, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'space-around' },
  sevItem: { alignItems: 'center' },
  sevNum: { fontSize: 22, fontFamily: 'Helvetica-Bold' },
  sevLabel: { fontSize: 8, color: '#6b7280', marginTop: 2 },

  statsRow: { flexDirection: 'row', marginBottom: 18 },
  statBox: { flex: 1, padding: 10, borderRadius: 6, backgroundColor: '#f3f4f6', alignItems: 'center', marginRight: 8 },
  statNum: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: NAVY },
  statLbl: { fontSize: 8, color: '#6b7280', marginTop: 2 },

  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 4 },

  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  metricLabel: { fontSize: 9, color: '#6b7280', flex: 1 },
  metricValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111827', flex: 2, textAlign: 'right' },

  issueCard: { padding: 9, borderRadius: 5, marginBottom: 7, borderWidth: 1 },
  issueHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  issueTitle: { fontFamily: 'Helvetica-Bold', fontSize: 9, flex: 1, marginRight: 8 },
  issueBadge: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#ffffff', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  issueMeta: { fontSize: 8, color: '#6b7280', marginBottom: 3, fontFamily: 'Helvetica-Oblique' },
  issueFix: { fontSize: 8, color: '#374151' },

  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 6 },
  footerText: { fontSize: 8, color: '#9ca3af' },

  groupTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 12, marginBottom: 6 },
});

const Footer = () => (
  <View style={s.footer} fixed>
    <Text style={s.footerText}>SEO Audit Tool — web-seo.pro</Text>
    <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
  </View>
);

export const PdfReport = ({ result }: { result: AuditResult }) => {
  const scoreColor = getScoreColor(result.score);
  const date = new Date(result.timestamp).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const sortedIssues = [...result.issues].sort((a, b) =>
    ['critical', 'high', 'medium', 'low'].indexOf(a.severity) - ['critical', 'high', 'medium', 'low'].indexOf(b.severity)
  );

  const issueGroups = (['critical', 'high', 'medium', 'low'] as const).map(sev => ({
    sev, items: sortedIssues.filter(i => i.severity === sev),
  })).filter(g => g.items.length > 0);

  const metrics: [string, string][] = [
    ['Title', result.technical?.title?.value || '—'],
    ['Title Length', result.technical?.title?.length != null ? `${result.technical.title.length} chars` : '—'],
    ['Meta Description', result.technical?.metaDesc?.value ? `${result.technical.metaDesc.length} chars` : 'Missing'],
    ['Canonical URL', result.technical?.canonical?.href || 'Not set'],
    ['Meta Robots', result.technical?.robots?.meta || 'Not set'],
    ['Word Count', String(result.content?.wordCount ?? 0)],
    ['Flesch Score', result.content?.readability?.fleschScore != null ? String(result.content.readability.fleschScore.toFixed(1)) : '—'],
    ['Total Images', String(result.images?.total ?? 0)],
    ['Images without Alt', String(result.images?.withoutAlt ?? 0)],
    ['Internal Links', String(result.links?.internal ?? 0)],
    ['External Links', String(result.links?.external ?? 0)],
    ['Schema Types', result.schema?.types?.join(', ') || '—'],
    ['HTTPS', result.security?.isHttps ? 'Yes' : 'No'],
    ['Fetch Method', result.fetchMethod || '—'],
  ];

  return (
    <Document title={`SEO Audit – ${result.url}`} author="SEO Audit Tool">
      {/* Page 1: Overview */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.headerTitle}>SEO Audit Report</Text>
          <Text style={s.headerUrl}>{result.url}</Text>
          <Text style={s.headerDate}>Generated: {date}</Text>
        </View>

        {/* Score + severity breakdown */}
        <View style={s.scoreRow}>
          <View style={[s.scoreBox, { borderColor: scoreColor, minWidth: 100 }]}>
            <Text style={[s.scoreNum, { color: scoreColor }]}>{result.score}</Text>
            <Text style={s.scoreOf}>/ 100</Text>
            <Text style={[s.scoreGrade, { color: scoreColor }]}>{getScoreLabel(result.score)}</Text>
          </View>
          <View style={s.sevRow}>
            {([['Critical', RED, result.summary.criticalIssues], ['High', ORANGE, result.summary.highIssues], ['Medium', YELLOW, result.summary.mediumIssues], ['Low', BLUE, result.summary.lowIssues]] as [string, string, number][]).map(([label, color, val]) => (
              <View key={label} style={s.sevItem}>
                <Text style={[s.sevNum, { color }]}>{val}</Text>
                <Text style={s.sevLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick stats */}
        <View style={s.statsRow}>
          {([['Total Checks', result.summary.totalChecks], ['Passed', result.summary.passedChecks], ['Issues', result.issues.length], ['Words', result.content?.wordCount ?? 0], ['Images', result.images?.total ?? 0], ['Schema', result.schema?.count ?? 0]] as [string, number][]).map(([label, val]) => (
            <View key={label} style={s.statBox}>
              <Text style={s.statNum}>{val}</Text>
              <Text style={s.statLbl}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Key metrics */}
        <Text style={s.sectionTitle}>Key Metrics</Text>
        <View style={{ marginBottom: 20 }}>
          {metrics.map(([label, value]) => (
            <View key={label} style={s.metricRow}>
              <Text style={s.metricLabel}>{label}</Text>
              <Text style={s.metricValue}>{value}</Text>
            </View>
          ))}
        </View>

        <Footer />
      </Page>

      {/* Page 2: Issues */}
      {issueGroups.length > 0 && (
        <Page size="A4" style={s.page}>
          <Text style={[s.sectionTitle, { fontSize: 15, marginTop: 8 }]}>
            Issues Found ({result.issues.length})
          </Text>
          {issueGroups.map(({ sev, items }) => {
            const c = sevColor[sev];
            return (
              <View key={sev}>
                <Text style={[s.groupTitle, { color: c.badge }]}>
                  {sev.charAt(0).toUpperCase() + sev.slice(1)} ({items.length})
                </Text>
                {items.map((issue, i) => (
                  <View key={i} wrap={false} style={[s.issueCard, { backgroundColor: c.bg, borderColor: c.border }]}>
                    <View style={s.issueHead}>
                      <Text style={[s.issueTitle, { color: c.text }]}>{issue.issue}</Text>
                      <View style={[s.issueBadge, { backgroundColor: c.badge }]}>
                        <Text style={{ color: sev === 'medium' ? '#1f2937' : '#fff', fontSize: 7 }}>
                          {sev.charAt(0).toUpperCase() + sev.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <Text style={s.issueMeta}>{issue.category} — {issue.location}</Text>
                    {issue.current ? <Text style={[s.issueMeta, { color: '#9ca3af' }]}>Current: {issue.current}</Text> : null}
                    <Text style={s.issueFix}>Fix: {issue.fix}</Text>
                  </View>
                ))}
              </View>
            );
          })}
          <Footer />
        </Page>
      )}
    </Document>
  );
};
