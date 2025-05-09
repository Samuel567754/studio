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
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary">Current Word</CardTitle>
      </CardHeader>
      <CardContent className="p-6 md:p-10 flex flex-col items-center justify-center gap-6 min-h-[250px] md:min-h-[300px]">
        <h2 className="text-6xl md:text-8xl font-bold text-foreground tracking-wider break-all text-center">
          {word || "----"}
        </h2>
        <Button onClick={speakWord} variant="outline" size="lg" disabled={!word} className="border-primary text-primary hover:bg-primary/10">
          <Volume2 className="mr-2 h-6 w-6" />
          Say Word
        </Button>
      </CardContent>
    </Card>
  );
};
