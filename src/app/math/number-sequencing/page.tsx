
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
            src="https://images.unsplash.com/photo-1659720212900-702e1765621d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fE51bWJlciUyMFNlcXVlbmNpbmclMjBGdW58ZW58MHx8MHx8fDA%3D" 
            alt="Abstract representation of a number sequence or pattern"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="number sequence pattern" 
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

