
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { MainNav } from '@/components/main-nav';
import { BottomNav } from '@/components/bottom-nav';
import { ThemeProvider } from '@/components/settings/theme-provider';
import { QuickLinkFAB } from '@/components/quicklink-fab';


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
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            <MainNav />
            {/* Ensure consistent bottom padding for mobile due to BottomNav and FAB */}
            {/* Increased bottom padding for FAB: pb-24 was for BottomNav, FAB is higher, so pb-40 or similar */}
            <main className="flex-grow container mx-auto px-4 py-6 md:px-6 md:py-8 pb-40 md:pb-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 ease-out">
              {children}
            </main>
            <BottomNav />
            <QuickLinkFAB /> {/* Added QuickLinkFAB */}
            <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/30 hidden md:block">
               © {new Date().getFullYear()} SightWords App. AI-Powered Learning.
            </footer>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
