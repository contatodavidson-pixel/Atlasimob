import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import AnalyticsProvider from '@/components/AnalyticsProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Atlas — Inteligência Imobiliária',
    template: '%s | Atlas',
  },
  description: 'IA que analisa centenas de imóveis por dia e encontra as melhores oportunidades de investimento. Score proprietário, heatmap de yield, Deal do Dia, cashflow e liquidez.',
  keywords: ['inteligência imobiliária', 'investimento imobiliário', 'Atlas', 'yield imóvel', 'ROI', 'cashflow imóvel', 'mapa de oportunidades', 'score imobiliário', 'deal do dia'],
  authors: [{ name: 'Atlas Inteligência Imobiliária', url: 'https://atlasimob.app.br' }],
  creator: 'Atlas',
  publisher: 'Atlas',
  metadataBase: new URL('https://atlasimob.app.br'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://atlasimob.app.br',
    siteName: 'Atlas — Inteligência Imobiliária',
    title: 'Atlas — Inteligência Imobiliária',
    description: 'IA que encontra os melhores imóveis para investir. Score, yield, cashflow e Deal do Dia.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Atlas — Inteligência Imobiliária' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@atlasimob',
    creator: '@atlasimob',
    title: 'Atlas — Inteligência Imobiliária',
    description: 'IA que encontra os melhores imóveis para investir no Brasil.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/atlas-logo.png',
    apple: '/atlas-logo.png',
    shortcut: '/atlas-logo.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Atlas',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AnalyticsProvider>
            {children}
          </AnalyticsProvider>
        </Providers>
      </body>
    </html>
  );
}
