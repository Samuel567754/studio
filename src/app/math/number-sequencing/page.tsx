
"use client";

import Image from 'next/image';
import { NumberSequencingUI } from '@/components/math/number-sequencing-ui';
import { ChevronsRight, Footprints } from 'lucide-react'; 

export default function NumberSequencingPage() {
  return (
    <div className="space-y-8">
      <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-full max-w-md mx-auto h-48 md:h-64 rounded-lg overflow-hidden shadow-md">
          <Image
            src="https://picsum.photos/seed/number-train-math/300/200" 
            alt="Toy train with numbered carriages in a sequence puzzle"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="sequence puzzle" 
          />
           <div className="absolute inset-0 bg-black/60" /> {/* Dark overlay */}
           <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
             <Footprints className="h-10 w-10 md:h-12 md:w-12 text-primary drop-shadow-lg" aria-hidden="true" />
             <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary-accent mt-1 drop-shadow-md">Number Sequencing Fun</h1>
             <p className="text-sm md:text-md text-gray-100 drop-shadow-sm">What comes next? Complete the number patterns!</p>
           </div>
        </div>
      </header>
      <NumberSequencingUI />
    </div>
  );
}
