
"use client";

import { NumberSequencingUI } from '@/components/math/number-sequencing-ui';
import { ChevronsRight } from 'lucide-react';

export default function NumberSequencingPage() {
  return (
    <div className="space-y-8">
      <header className="text-center space-y-2 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
         <ChevronsRight className="h-12 w-12 mx-auto text-primary" aria-hidden="true" />
        <h1 className="text-3xl font-bold text-gradient-primary-accent">Number Sequencing Fun</h1>
        <p className="text-md text-muted-foreground">What comes next? Complete the number patterns!</p>
      </header>
      <NumberSequencingUI />
    </div>
  );
}
