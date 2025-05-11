
"use client";

import Image from 'next/image';
import { NumberSequencingUI } from '@/components/math/number-sequencing-ui';
import { ChevronsRight, Footprints } from 'lucide-react'; // Updated icon

export default function NumberSequencingPage() {
  return (
    <div className="space-y-8">
      <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-full max-w-xs mx-auto h-32 md:h-40 rounded-lg overflow-hidden shadow-md">
          <Image
            src="https://picsum.photos/seed/train-numbers/300/200" // More relevant image
            alt="Toy train with numbered carriages in a sequence"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="train numbers sequence" // Updated hint
          />
           <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent flex flex-col items-center justify-center p-2">
             <Footprints className="h-10 w-10 md:h-12 md:w-12 text-primary drop-shadow-lg" aria-hidden="true" />
           </div>
        </div>
        <h1 className="text-3xl font-bold text-gradient-primary-accent">Number Sequencing Fun</h1>
        <p className="text-md text-muted-foreground">What comes next? Complete the number patterns!</p>
      </header>
      <NumberSequencingUI />
    </div>
  );
}


