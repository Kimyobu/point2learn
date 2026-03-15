import type { Metadata } from 'next';
import { Kanit } from 'next/font/google';
import './globals.css';
import PwaPrompt from '@/components/PwaPrompt';

const kanit = Kanit({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
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
    <html lang="th" className={kanit.className}>
      <body>
        {children}
        <PwaPrompt />
      </body>
    </html>
  );
}
