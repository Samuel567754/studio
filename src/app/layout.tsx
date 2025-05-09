
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { MainNav } from '@/components/main-nav';
import { BottomNav } from '@/components/bottom-nav';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SightWords AI Learning',
  description: 'Learn sight words, practice spelling, and read AI-generated passages.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans bg-background text-foreground`}>
        <div className="flex flex-col min-h-screen">
          <MainNav />
          {/* Add pb-16 for padding at the bottom on mobile to avoid overlap with BottomNav, md:pb-0 to remove it on larger screens */}
          <main className="flex-grow container mx-auto px-4 py-6 md:px-6 md:py-8 pb-20 md:pb-8">
            {children}
          </main>
          <BottomNav />
          {/* Footer only visible on md screens and up to avoid clash with BottomNav */}
          <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/30 hidden md:block">
             © {new Date().getFullYear()} SightWords App. AI-Powered Learning.
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
