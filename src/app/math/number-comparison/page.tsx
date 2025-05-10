
"use client";

import { NumberComparisonUI } from '@/components/math/number-comparison-ui';
import { Scaling } from 'lucide-react';

export default function NumberComparisonPage() {
  return (
    <div className="space-y-8">
      <header className="text-center space-y-2 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
         <Scaling className="h-12 w-12 mx-auto text-primary" aria-hidden="true" />
        <h1 className="text-3xl font-bold text-gradient-primary-accent">Number Comparison Challenge</h1>
        <p className="text-md text-muted-foreground">Which number is bigger or smaller? Test your skills!</p>
      </header>
      <NumberComparisonUI />
    </div>
  );
}
