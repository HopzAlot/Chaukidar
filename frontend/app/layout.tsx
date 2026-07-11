import type { Metadata } from 'next';
import { Poppins, IBM_Plex_Mono } from 'next/font/google';
import '@/styles/globals.css';
import MascotLoader from '@/components/shared/MascotLoader';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Chaukidar — Multilingual AI Safety Audits',
  description:
    'Audit AI models and RAG systems for safety in South Asian languages, comparing translated and native-adapted prompts side by side.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${mono.variable}`}>
      <body className="font-body antialiased">
        {children}
        {/* Rendered once, outside page content, so the guard survives
            client-side navigation between pages instead of resetting. */}
        <MascotLoader />
      </body>
    </html>
  );
}
