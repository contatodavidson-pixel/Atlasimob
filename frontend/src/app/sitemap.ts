import type { MetadataRoute } from 'next';

const BASE = 'https://atlasimob.app.br';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: BASE, priority: 1.0, changeFrequency: 'daily' as const },
    { url: `${BASE}/deal-do-dia`, priority: 0.95, changeFrequency: 'daily' as const },
    { url: `${BASE}/calculadora`, priority: 0.8, changeFrequency: 'weekly' as const },
    { url: `${BASE}/login`, priority: 0.5, changeFrequency: 'monthly' as const },
    { url: `${BASE}/register`, priority: 0.7, changeFrequency: 'monthly' as const },
  ];

  return staticPages.map(p => ({
    url: p.url,
    lastModified: new Date(),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
