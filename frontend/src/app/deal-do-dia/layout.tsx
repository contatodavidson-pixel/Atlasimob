import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Deal do Dia — Atlas | Melhor imóvel para investir hoje',
  description: 'A IA do Atlas analisa centenas de imóveis diariamente e destaca a melhor oportunidade do dia. Yield, cashflow, score e comparativo com CDI/Selic.',
  keywords: ['investimento imobiliário', 'yield imóvel', 'melhor imóvel para comprar', 'deal do dia', 'atlas imobiliário', 'cashflow imóvel Brasil'],
  openGraph: {
    title: 'Deal do Dia — Atlas Inteligência Imobiliária',
    description: 'Nossa IA monitora ZAP, VivaReal e OLX em tempo real. Veja o imóvel com o melhor yield detectado hoje.',
    url: 'https://atlasimob.app.br/deal-do-dia',
    siteName: 'Atlas — Inteligência Imobiliária',
    images: [
      {
        url: 'https://atlasimob.app.br/og-deal-do-dia.png',
        width: 1200,
        height: 630,
        alt: 'Deal do Dia — Atlas Inteligência Imobiliária',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deal do Dia — Atlas | Melhor imóvel para investir hoje',
    description: 'Nossa IA detecta o imóvel com melhor yield do dia. Gratuito.',
    images: ['https://atlasimob.app.br/og-deal-do-dia.png'],
    creator: '@atlasimob',
  },
  alternates: {
    canonical: 'https://atlasimob.app.br/deal-do-dia',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
};

export default function DealDoDiaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
