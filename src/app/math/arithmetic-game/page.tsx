
"use client";

import Image from 'next/image';
import { ArithmeticGameUI } from '@/components/math/arithmetic-game-ui';
import { Sigma, Puzzle, Calculator } from 'lucide-react'; // Updated icon

export default function ArithmeticGamePage() {
  return (
    <div className="space-y-8">
      <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-full max-w-xs mx-auto h-32 md:h-40 rounded-lg overflow-hidden shadow-md">
          <Image
            src="https://picsum.photos/seed/number-blocks-game/300/200" // More relevant image
            alt="Colorful number blocks and arithmetic symbols"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="number blocks arithmetic" // Updated hint
          />
           <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent flex flex-col items-center justify-center p-2">
             <Calculator className="h-10 w-10 md:h-12 md:w-12 text-primary drop-shadow-lg" aria-hidden="true" />
           </div>
        </div>
        <h1 className="text-3xl font-bold text-gradient-primary-accent">Arithmetic Fun & Games</h1>
        <p className="text-md text-muted-foreground">Test your math skills with exciting challenges!</p>
      </header>
      
      <ArithmeticGameUI />
    </div>
  );
}


