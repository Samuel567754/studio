
"use client";
import type { FC } from 'react';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { speakText } from '@/lib/audio';

interface WordDisplayProps {
  word: string;
}

export const WordDisplay: FC<WordDisplayProps> = ({ word }) => {
  const handleSpeakWord = () => {
    if (word) {
      speakText(word);
    }
  };

  return (
    <Card className="shadow-lg w-full bg-gradient-to-br from-card via-card/80 to-secondary/20 dark:from-card dark:via-card/90 dark:to-secondary/10">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary">Current Word</CardTitle>
      </CardHeader>
      <CardContent className="p-6 md:p-10 flex flex-col items-center justify-center gap-6 min-h-[250px] md:min-h-[300px]">
        <h2 
          className="text-7xl md:text-9xl font-bold tracking-wide break-all text-center 
                     text-gradient-primary-accent 
                     drop-shadow-lg py-2
                     select-none"
        >
          {word || "----"}
        </h2>
        <Button 
          onClick={handleSpeakWord} 
          variant="default" 
          size="lg" 
          disabled={!word} 
          className="shadow-md hover:shadow-lg transform transition-transform hover:scale-105 active:scale-95 duration-200 ease-in-out btn-glow"
        >
          <Volume2 className="mr-2 h-6 w-6" />
          Say Word
        </Button>
      </CardContent>
    </Card>
  );
};

