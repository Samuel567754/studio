
"use client";

import Image from 'next/image';
import { AiStoryProblemGameUI } from '@/components/math/ai-story-problem-game-ui';
import { BookOpenText, MessageSquarePlus } from 'lucide-react'; // Updated icon

export default function AiStoryProblemPage() {
  return (
    <div className="space-y-8">
      <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-full max-w-xs mx-auto h-32 md:h-40 rounded-lg overflow-hidden shadow-md">
          <Image
            src="https://picsum.photos/seed/math-fairytale/300/200" // More relevant image
            alt="Fairytale book with math symbols floating out"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="fairytale book math" // Updated hint
          />
           <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent flex flex-col items-center justify-center p-2">
             <MessageSquarePlus className="h-10 w-10 md:h-12 md:w-12 text-primary drop-shadow-lg" aria-hidden="true" />
           </div>
        </div>
        <h1 className="text-3xl font-bold text-gradient-primary-accent">AI Math Story Problems</h1>
        <p className="text-md text-muted-foreground">Read stories and solve math puzzles created by AI!</p>
      </header>
      
      <AiStoryProblemGameUI />
    </div>
  );
}

