import { BookOpenText } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="py-4 md:py-6 px-4 md:px-8 border-b border-border/30 shadow-sm bg-card">
      <div className="container mx-auto flex items-center gap-3">
        <BookOpenText className="h-8 w-8 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold text-primary">SightWords</h1>
      </div>
    </header>
  );
}
