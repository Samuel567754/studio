
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
  manifest: '/manifest.json', // Next.js can also pick this up if manifest.json is in app root
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Standard Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/icon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/icons/icon-32x32.png" type="image/png" sizes="32x32" />
        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />
        {/* Theme Color for Browser UI */}
        <meta name="theme-color" content="#1ABC9C" />
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
