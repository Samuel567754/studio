
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/settings/theme-provider';
import { ClientRootFeatures } from '@/components/layout/client-root-features';

export const metadata: Metadata = {
  title: 'ChillLearn AI: Interactive Learning',
  description: 'Learn sight words, practice spelling, play AI math games, and read AI-generated passages with ChillLearn AI.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preferred SVG Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {/* Fallback ICO Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* PNG Favicons */}
        <link rel="icon" href="/icons/favicon-96x96.png" type="image/png" sizes="96x96" />
        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />
        {/* Theme Color for Browser UI */}
        <meta name="theme_color" content="#1ABC9C" />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientRootFeatures>
            {children}
          </ClientRootFeatures>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
