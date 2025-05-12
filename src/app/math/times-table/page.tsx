
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { TimesTableUI } from '@/components/math/times-table-ui';
import { TableIcon, Grid3x3 } from 'lucide-react'; 

export default function TimesTablePracticePage() {
  return (
    <div className="space-y-8">
      <div className="mb-6">
        <Button asChild variant="outline" className="group">
          <Link href="/math">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Math Zone
          </Link>
        </Button>
      </div>
      <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-full max-w-md mx-auto h-48 md:h-64 rounded-lg overflow-hidden shadow-md">
          <Image
            src="https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dGltZXMlMjB0YWJsZSUyMG1hdGhzfGVufDB8fDB8fHww" 
            alt="Chalkboard with multiplication times table written"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="times table chalkboard" 
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
