import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NEXUS-C2 // DECIDE UNDER UNCERTAINTY',
  description: 'Immersive multi-domain command training simulator for degraded communication environments. SIH26248.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#0d0f10] text-[#e8eaec] antialiased selection:bg-[#4fc3d0] selection:text-black min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
