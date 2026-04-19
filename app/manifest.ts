import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'vin2win',
    short_name: 'vin2win',
    description:
      'Платформа для профессионального авторынка с объявлениями, сообщениями и push-уведомлениями по чатам.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#07131A',
    theme_color: '#003B46',
    icons: [
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/pwa-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/pwa-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
