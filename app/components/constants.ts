// Brand Colors
export const COLORS = {
  primary: '#11225c',
  primaryLight: '#1a3380',
  accent: '#99ff00',
  secondary: '#00ccff',
  highlight: '#ff00ff',
};

export const ALL_SECTIONS = ['overview', 'issues', 'passed', 'sitemap', 'technical', 'content', 'security', 'international', 'links', 'images', 'schema', 'social', 'platform', 'accessibility', 'dom', 'performance', 'ai', 'trust', 'mobile', 'robots', 'loaded-files'];

// Severity helpers
export const getScoreColor = (s: number) => s >= 90 ? '#10b981' : s >= 70 ? '#f59e0b' : s >= 50 ? '#f97316' : '#ef4444';
export const getSeverityStyle = (sev: string) => ({ critical: 'bg-red-100 text-red-800 border-red-200', high: 'bg-orange-100 text-orange-800 border-orange-200', medium: 'bg-yellow-100 text-yellow-800 border-yellow-200', low: 'bg-blue-100 text-blue-800 border-blue-200' }[sev] || 'bg-gray-100');
export const getSeverityLabel = (sev: string) => ({ critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }[sev] || sev);
