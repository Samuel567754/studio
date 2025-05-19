
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
  manifest: '/manifest.json', // Ensures Next.js is aware of the manifest for optimization
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Manifest Link - Crucial for PWA */}
        <link rel="manifest" href="/manifest.json" />
        {/* Theme Color for Browser UI - Should match manifest.json theme_color */}
        <meta name="theme_color" content="#64B5F6" />
        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* Favicons */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />{/* Fallback ICO */}
        <link rel="icon" href="/icons/favicon-96x96.png" type="image/png" sizes="96x96" />
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
