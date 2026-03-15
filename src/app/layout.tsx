import type { Metadata } from 'next';
import { Outfit, Mali } from 'next/font/google';
import './globals.css';
import PwaPrompt from '@/components/PwaPrompt';

const outfit = Outfit({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

const mali = Mali({
  weight: ['400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
  variable: '--font-mali',
});

export const metadata: Metadata = {
  title: 'Point2Learn - รับรางวัลกันสุดน่ารัก!',
  description: 'ระบบสะสมแต้มแลกของรางวัล',
  manifest: '/manifest.json',
  appleWebApp: {
    title: 'Point2Learn',
    statusBarStyle: 'default',
    capable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${outfit.variable} ${mali.variable}`}>
      <body>
        {children}
        <PwaPrompt />
      </body>
    </html>
  );
}
