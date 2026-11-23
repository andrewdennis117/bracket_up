import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'BracketUp – Run better tournaments',
  description: 'Create and manage tournaments with ease. Round robin seeding, elimination brackets, live standings, and prize payouts.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BracketUp',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // No maximumScale / userScalable: false here — pinch-zoom must stay
  // available for the Lighthouse accessibility >= 95 target in the spec's
  // own acceptance criteria.
  viewportFit: 'cover',
  themeColor: '#030712',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-gray-950 antialiased">
        {children}
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
