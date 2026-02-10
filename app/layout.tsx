import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SEO Audit | Web & SEO',
  description:
    'Free SEO audit tool to analyze technical SEO, performance, Core Web Vitals, crawling, and on-page issues. Get actionable insights instantly.',
  icons: {
    icon: 'https://www.web-seo.pro/wp-content/uploads/2024/07/favicon4-1.png',
  },
  openGraph: {
    title: 'SEO Audit | Web & SEO',
    description:
      'Free SEO audit tool to analyze technical SEO, performance, Core Web Vitals, crawling, and on-page issues. Get actionable insights instantly.',
    images: [
      {
        url: 'https://www.web-seo.pro/wp-content/uploads/2025/01/cover.jpg',
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
