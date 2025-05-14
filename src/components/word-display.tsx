
"use client";
import type { FC } from 'react';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { speakText } from '@/lib/audio';
import { useAppSettingsStore } from '@/stores/app-settings-store'; // Import settings store

interface WordDisplayProps {
  word: string;
  hideWordText?: boolean; 
}

export const WordDisplay: FC<WordDisplayProps> = ({ word, hideWordText = false }) => {
  const { soundEffectsEnabled } = useAppSettingsStore(); // Get sound settings

  const handleSpeakWord = () => {
    if (word && soundEffectsEnabled) {
      // If word text is hidden (like in Identify game), prepend the prompt
      const textToSpeak = hideWordText ? `Identify the word: ${word}` : word;
      speakText(textToSpeak);
    } else if (word && !soundEffectsEnabled) {
      // Optionally inform user if sound is off, or just do nothing silently
      // For now, let's do nothing if sound is off for the WordDisplay button itself.
      // The page-level audio trigger in IdentifyWordPage handles its own toast for disabled audio.
    }
  };

  const cardTitle = hideWordText ? "Listen to the Word" : "Current Word";

  return (
    <Card className="shadow-lg w-full bg-gradient-to-br from-card via-card/80 to-secondary/20 dark:from-card dark:via-card/90 dark:to-secondary/10 animate-in fade-in-0 slide-in-from-top-5 duration-500 ease-out">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary">{cardTitle}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 md:p-10 flex flex-col items-center justify-center gap-6 min-h-[250px] md:min-h-[300px]">
        {!hideWordText && (
          <h2 
            key={word} 
            className="text-7xl md:text-9xl font-bold tracking-wide break-all text-center 
                       text-gradient-primary-accent 
                       drop-shadow-lg py-2
                       select-none
                       animate-in fade-in zoom-in-90 duration-300 ease-out"
            aria-live="polite" 
          >
            {word || "----"}
          </h2>
        )}
        <Button 
          onClick={handleSpeakWord} 
          variant="default" 
          size="lg" 
          disabled={!word || !soundEffectsEnabled} // Disable if no word OR sound is off
          className="shadow-md hover:shadow-lg transform transition-transform hover:scale-105 active:scale-95 duration-200 ease-in-out btn-glow"
          aria-label={word ? `Listen to the word ${hideWordText ? '' : word}` : "No word selected to listen to"}
        >
          <Volume2 className="mr-2 h-6 w-6" aria-hidden="true" />
          Say Word
        </Button>
      </CardContent>
    </Card>
  );
};

