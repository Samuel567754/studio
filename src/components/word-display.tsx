"use client";
import type { FC } from 'react';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WordDisplayProps {
  word: string;
}

export const WordDisplay: FC<WordDisplayProps> = ({ word }) => {
  const speakWord = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis && word) {
      const utterance = new SpeechSynthesisUtterance(word);
      // utterance.lang = 'en-US'; // Optional: specify language
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className="shadow-lg w-full bg-gradient-to-br from-card via-background/30 to-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary">Current Word</CardTitle>
      </CardHeader>
      <CardContent className="p-6 md:p-10 flex flex-col items-center justify-center gap-6 min-h-[250px] md:min-h-[300px]">
        <h2 
          className="text-7xl md:text-9xl font-bold tracking-wide break-all text-center 
                     bg-gradient-to-r from-primary via-purple-500 to-pink-500 
                     dark:from-primary dark:via-purple-400 dark:to-pink-400
                     bg-clip-text text-transparent 
                     drop-shadow-lg py-2
                     select-none" /* Added select-none for better UX on text */
        >
          {word || "----"}
        </h2>
        <Button 
          onClick={speakWord} 
          variant="outline" 
          size="lg" 
          disabled={!word} 
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-200 ease-in-out transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
        >
          <Volume2 className="mr-2 h-6 w-6" />
          Say Word
        </Button>
      </CardContent>
    </Card>
  );
};