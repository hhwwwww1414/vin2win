import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

const PRIVATE_DISALLOW = [
  '/admin',
  '/api/',
  '/_next/',
  '/account',
  '/messages',
  '/listing/new',
  '/login',
  '/register',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Yandex'],
        allow: '/',
        disallow: PRIVATE_DISALLOW,
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_DISALLOW,
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
