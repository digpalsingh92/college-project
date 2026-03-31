// Force reload
import type { Metadata } from 'next';
import { Manrope, Space_Grotesk } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  variable: '--font-body',
  subsets: ['latin'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-heading',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MedCare – Healthcare Platform',
  description: 'A modern healthcare management system for patients, doctors, and admins.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${spaceGrotesk.variable} antialiased`}>{children}</body>
    </html>
  );
}
