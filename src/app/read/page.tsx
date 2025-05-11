
"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ReadingPractice } from '@/components/reading-practice';
import { getStoredWordList, getStoredReadingLevel, getStoredMasteredWords } from '@/lib/storage';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Info } from 'lucide-react'; // Changed BookOpenCheck to BookOpen
import { Card } from '@/components/ui/card';

export default function ReadingPage() {
  const [wordList, setWordList] = useState<string[]>([]);
  const [masteredWords, setMasteredWords] = useState<string[]>([]);
  const [readingLevel, setReadingLevel] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  const loadReadingData = useCallback(() => {
    setWordList(getStoredWordList());
    setMasteredWords(getStoredMasteredWords());
    setReadingLevel(getStoredReadingLevel("beginner")); 
  }, []);
  
  useEffect(() => {
    loadReadingData();
    setIsMounted(true);

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'sightwords_wordList_v1' || 
          event.key === 'sightwords_readingLevel_v1' ||
          event.key === 'sightwords_masteredWords_v1') {
        loadReadingData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadReadingData]);

  if (!isMounted) {
     return (
      <div className="space-y-6 md:space-y-8">
        <Card className="shadow-lg animate-pulse">
            <div className="p-6">
                <div className="h-6 w-1/2 bg-muted rounded mb-2"></div>
                <div className="h-4 w-3/4 bg-muted rounded"></div>
            </div>
            <div className="p-6 space-y-4">
                <div className="h-12 bg-primary/50 rounded"></div>
                <div className="h-40 bg-muted rounded"></div>
            </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-full max-w-md mx-auto h-48 md:h-64 rounded-lg overflow-hidden shadow-lg">
          <Image 
            src="https://images.unsplash.com/photo-1604342162684-0cb7869cc445?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzl8fGxlYXJuJTIwd29yZHN8ZW58MHx8MHx8fDA%3D" 
            alt="Child reading an adventure book"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="reading adventure child" 
          />
          <div className="absolute inset-0 bg-black/60" /> 
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <BookOpen className="h-12 w-12 md:h-16 md:w-16 text-primary drop-shadow-lg animate-in fade-in zoom-in-50 duration-1000 delay-200" aria-hidden="true" />
            <h1 className="text-3xl md:text-4xl font-bold text-gradient-primary-accent mt-2 drop-shadow-md">Reading Adventures</h1>
            <p className="text-md md:text-lg text-gray-100 drop-shadow-sm mt-1">Read AI-generated stories with your words.</p>
          </div>
        </div>
      </header>

      {wordList.length === 0 ? (
         <Alert variant="info" className="max-w-xl mx-auto text-center bg-card shadow-md border-accent/20 animate-in fade-in-0 zoom-in-95 duration-500">
            <div className="flex flex-col items-center gap-4">
            <Image 
                src="https://picsum.photos/seed/empty-storybook/200/150" 
                alt="An empty storybook with a curious child peeking"
                width={200}
                height={150}
                className="rounded-lg shadow-md mb-3"
                data-ai-hint="empty storybook child"
            />
            <Info className="h-6 w-6 text-primary" />
            <AlertTitle className="text-xl font-semibold mb-2">No Words for Reading Practice!</AlertTitle>
            <AlertDescription className="text-base">
                To generate a reading passage, you need some words in your practice list.
                Please visit the {' '}
                <Button variant="link" asChild className="p-0 h-auto text-base"><Link href="/learn">Learn Words</Link></Button>
                {' '}page to select or add words.
            </AlertDescription>
            </div>
        </Alert>
      ) : (
        <div className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out">
            <ReadingPractice 
                wordsToPractice={wordList} 
                readingLevel={readingLevel} 
                masteredWords={masteredWords} 
            />
        </div>
      )}
    </div>
  );
}
