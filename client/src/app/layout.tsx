import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MedCare – Healthcare Platform',
  description: 'A modern healthcare management system for patients, doctors, and admins.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
