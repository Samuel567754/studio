
"use client";

import Image from 'next/image';
import { TimesTableUI } from '@/components/math/times-table-ui';
import { TableIcon, Grid3x3 } from 'lucide-react'; 

export default function TimesTablePracticePage() {
  return (
    <div className="space-y-8">
      <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-full max-w-xs mx-auto h-32 md:h-40 rounded-lg overflow-hidden shadow-md">
          <Image
            src="https://picsum.photos/seed/multiplication-chart-kids/300/200" 
            alt="Colorful multiplication chart for kids"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="multiplication practice" 
          />
           <div className="absolute inset-0 bg-black/60" /> {/* Dark overlay */}
           <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
             <Grid3x3 className="h-10 w-10 md:h-12 md:w-12 text-primary drop-shadow-lg" aria-hidden="true" />
             <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary-accent mt-1 drop-shadow-md">Times Table Practice</h1>
             <p className="text-sm md:text-md text-gray-100 drop-shadow-sm">Master your multiplication facts!</p>
           </div>
        </div>
      </header>
      <TimesTableUI />
    </div>
  );
}
