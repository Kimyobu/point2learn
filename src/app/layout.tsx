import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Point2Learn - รับรางวัลกันสุดน่ารัก!',
  description: 'ระบบสะสมแต้มแลกของรางวัล',
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
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
