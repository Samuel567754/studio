
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/settings/theme-provider';
import { ClientRootFeatures } from '@/components/layout/client-root-features';


export const metadata: Metadata = {
  title: 'ChillLearn: AI Learning',
  description: 'Learn sight words, practice spelling, and read AI-generated passages with ChillLearn.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
