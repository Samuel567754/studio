
"use client";

import Image from 'next/image';
import { NumberComparisonUI } from '@/components/math/number-comparison-ui';
import { Scaling, Scale } from 'lucide-react'; // Updated icon

export default function NumberComparisonPage() {
  return (
    <div className="space-y-8">
      <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
         <div className="relative w-full max-w-xs mx-auto h-32 md:h-40 rounded-lg overflow-hidden shadow-md">
          <Image
            src="https://picsum.photos/seed/crocodile-math/300/200" // More relevant image
            alt="Cute crocodile with greater than and less than signs"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="crocodile math signs" // Updated hint
          />
           <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent flex flex-col items-center justify-center p-2">
             <Scale className="h-10 w-10 md:h-12 md:w-12 text-primary drop-shadow-lg" aria-hidden="true" />
           </div>
        </div>
        <h1 className="text-3xl font-bold text-gradient-primary-accent">Number Comparison Challenge</h1>
        <p className="text-md text-muted-foreground">Which number is bigger or smaller? Test your skills!</p>
      </header>
      <NumberComparisonUI />
    </div>
  );
}


