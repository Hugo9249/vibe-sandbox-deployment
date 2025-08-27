import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Chess Game',
  description: 'Play chess against an intelligent AI opponent powered by Claude Sonnet 4',
  keywords: 'chess, AI, game, artificial intelligence, strategy',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
          {children}
        </div>
      </body>
    </html>
  );
}