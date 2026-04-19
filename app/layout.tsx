import type { Metadata, Viewport } from 'next';
import { Inter, Manrope } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { SiteShell } from '@/components/layout/site-shell';
import { Toaster } from '@/components/ui/toaster';
import '@21st-sdk/react/styles.css';
import './globals.css';

const siteUrl = 'https://vin2win.ru';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
});

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://vin2win.ru'),
  manifest: '/manifest.webmanifest',
  applicationName: 'vin2win',
  title: {
    default: 'vin2win — профессиональный авторынок',
    template: '%s | vin2win',
  },
  description:
    'B2B-платформа для профессиональных продавцов, подборщиков и менеджеров. Быстрый поиск, публикация и сравнение объявлений без B2C-шума.',
  keywords: ['автомобили', 'профессиональные продавцы', 'автоподбор', 'авторынок', 'продажа авто', 'купить авто', 'b2b авто'],
  openGraph: {
    type: 'website',
    siteName: 'vin2win',
    url: siteUrl,
    title: 'vin2win — профессиональный авторынок',
    description:
      'B2B-платформа для профессиональных продавцов, подборщиков и менеджеров. Быстрый поиск, публикация и сравнение объявлений без B2C-шума.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'vin2win — профессиональный авторынок',
    description:
      'B2B-платформа для профессиональных продавцов, подборщиков и менеджеров. Быстрый поиск, публикация и сравнение объявлений без B2C-шума.',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'vin2win',
  },
};

export const viewport: Viewport = {
  themeColor: '#003B46',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} ${manrope.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SiteShell>{children}</SiteShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
