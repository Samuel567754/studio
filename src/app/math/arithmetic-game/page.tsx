
"use client";

import { ArithmeticGameUI } from '@/components/math/arithmetic-game-ui';
import { Sigma, Puzzle } from 'lucide-react';

export default function ArithmeticGamePage() {
  return (
    <div className="space-y-8">
      <header className="text-center space-y-2 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
         <Puzzle className="h-12 w-12 mx-auto text-primary" aria-hidden="true" />
        <h1 className="text-3xl font-bold text-gradient-primary-accent">Arithmetic Fun & Games</h1>
        <p className="text-md text-muted-foreground">Test your math skills with exciting challenges!</p>
      </header>
      
      <ArithmeticGameUI />
    </div>
  );
}
