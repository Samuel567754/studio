
"use client";

import Image from 'next/image';
import { ArithmeticGameUI } from '@/components/math/arithmetic-game-ui';
import { Sigma, Puzzle, Calculator } from 'lucide-react'; 

export default function ArithmeticGamePage() {
  return (
    <div className="space-y-8">
      <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-full max-w-xs mx-auto h-32 md:h-40 rounded-lg overflow-hidden shadow-md">
          <Image
            src="https://images.unsplash.com/photo-1634128221889-82ed6efebfc3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDd8fGNoaWxkcmVuJTIwbWF0aGVtYXRpY3N8ZW58MHx8MHx8fDA%3D" 
            alt="Fun and colorful arithmetic game elements"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="math game" 
          />
           <div className="absolute inset-0 bg-black/60" /> {/* Dark overlay */}
           <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
             <Calculator className="h-10 w-10 md:h-12 md:w-12 text-primary drop-shadow-lg" aria-hidden="true" />
             <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary-accent mt-1 drop-shadow-md">Arithmetic Fun & Games</h1>
             <p className="text-sm md:text-md text-gray-100 drop-shadow-sm">Test your math skills with exciting challenges!</p>
           </div>
        </div>
      </header>
      
      <ArithmeticGameUI />
    </div>
  );
}
