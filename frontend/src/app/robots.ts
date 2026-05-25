import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/deal-do-dia', '/calculadora'],
        disallow: ['/dashboard/', '/api/', '/onboarding'],
      },
    ],
    sitemap: 'https://atlasimob.app.br/sitemap.xml',
    host: 'https://atlasimob.app.br',
  };
}
