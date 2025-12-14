import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SmartSRS',
  title: 'StudyMonkey',
  description: 'AI-Powered Spaced Repetition System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={plusJakarta.className}>
        <main className="min-h-screen text-slate-900">
          {children}
        </main>
      </body>
    </html>
  );
}
