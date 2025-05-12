"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { EnglishTutorAssistant } from '@/components/english-tutor-assistant';
import { ArrowLeft, MessageSquareQuote } from 'lucide-react';

export default function EnglishTutorPage() {
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Button asChild variant="outline" className="group">
          <Link href="/word-practice">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Word Practice Zone
          </Link>
        </Button>
      </div>

      <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-full max-w-md mx-auto h-48 md:h-64 rounded-lg overflow-hidden shadow-lg">
          <Image 
            src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YWklMjBsYW5ndWFnZXxlbnwwfHwwfHx8MA%3D%3D" 
            alt="AI language tutor concept with abstract speech bubbles"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="AI language tutor" 
          />
          <div className="absolute inset-0 bg-black/60" /> 
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <MessageSquareQuote className="h-12 w-12 md:h-16 md:w-16 text-primary drop-shadow-lg animate-in fade-in zoom-in-50 duration-1000 delay-200" aria-hidden="true" />
            <h1 className="text-3xl md:text-4xl font-bold text-gradient-primary-accent mt-2 drop-shadow-md">Lexi - English Language Guide</h1>
            <p className="text-md md:text-lg text-gray-100 drop-shadow-sm mt-1">Your AI-powered assistant for English questions.</p>
          </div>
        </div>
      </header>

      <div className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-100">
        <EnglishTutorAssistant />
      </div>
    </div>
  );
}