
"use client";

import Image from 'next/image';
import { TimesTableUI } from '@/components/math/times-table-ui';
import { TableIcon, Grid3x3 } from 'lucide-react'; // Updated icon

export default function TimesTablePracticePage() {
  return (
    <div className="space-y-8">
      <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-full max-w-xs mx-auto h-32 md:h-40 rounded-lg overflow-hidden shadow-md">
          <Image
            src="https://picsum.photos/seed/multiplication-stars/300/200" // More relevant image
            alt="Colorful stars forming a multiplication grid pattern"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="stars multiplication grid" // Updated hint
          />
           <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent flex flex-col items-center justify-center p-2">
             <Grid3x3 className="h-10 w-10 md:h-12 md:w-12 text-primary drop-shadow-lg" aria-hidden="true" />
           </div>
        </div>
        <h1 className="text-3xl font-bold text-gradient-primary-accent">Times Table Practice</h1>
        <p className="text-md text-muted-foreground">Master your multiplication facts!</p>
      </header>
      <TimesTableUI />
    </div>
  );
}


