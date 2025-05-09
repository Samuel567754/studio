"use client";

import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/app-header';
import { WordDisplay } from '@/components/word-display';
import { SpellingPractice } from '@/components/spelling-practice';
import { WordSuggestion } from '@/components/word-suggestion';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function SightWordsPage() {
  const [currentWord, setCurrentWord] = useState<string>('');
  const [wordList, setWordList] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  // User profile/settings state
  const [readingLevel, setReadingLevel] = useState<string>("beginner");
  const [wordLength, setWordLength] = useState<number>(3);

  const { toast } = useToast();

  useEffect(() => {
    if (wordList.length > 0) {
      setCurrentWord(wordList[currentIndex]);
    } else {
      setCurrentWord(''); // Clear current word if list is empty
    }
  }, [wordList, currentIndex]);

  const handleWordSelectedFromSuggestion = (word: string) => {
    setWordList([word]); // Set selected word as the only one in the list for focused practice
    setCurrentIndex(0);
    toast({ title: "New Word Set!", description: `Now practicing: ${word}`});
  };

  const handleSettingsChange = (level: string, length: number) => {
    setReadingLevel(level);
    setWordLength(length);
  };

  const handleCorrectSpell = () => {
    toast({
      title: "Great Job!",
      description: `You spelled "${currentWord}" correctly!`,
    });
    // Optionally, move to the next word if in a list, or suggest new words.
    // For now, user manually gets new words or selects from suggestions.
    // if (wordList.length > 1 && currentIndex < wordList.length - 1) {
    //   setCurrentIndex(prev => prev + 1);
    // } else if (wordList.length > 0) {
    //   toast({ title: "List Complete!", description: "You've practiced all suggested words." });
    // }
  };
  
  // This function is not directly used now but could be if WordSuggestion passes the full list
  // const handleNewWordList = (newList: string[]) => {
  //   setWordList(newList);
  //   setCurrentIndex(0);
  // };

  return (
    <>
      <AppHeader />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column / Main Column on smaller screens */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <WordDisplay word={currentWord} />
            <SpellingPractice wordToSpell={currentWord} onCorrectSpell={handleCorrectSpell} />
          </div>

          {/* Right Column / Sidebar on larger screens */}
          <div className="lg:col-span-1 space-y-6 md:space-y-8">
            <WordSuggestion 
              onWordSelected={handleWordSelectedFromSuggestion} 
              currentReadingLevel={readingLevel}
              currentWordLength={wordLength}
              onSettingsChange={handleSettingsChange}
            />
          </div>
        </div>
        
        {!currentWord && (
          <div className="mt-12 text-center p-8 bg-card rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-primary mb-4">Welcome to SightWords!</h2>
            <p className="text-muted-foreground mb-6">
              Start your learning journey by getting some word suggestions based on your reading level and preferred word length.
            </p>
            <p className="text-muted-foreground">
              Use the "AI Word Suggestions" panel to begin.
            </p>
          </div>
        )}
      </main>
      <footer className="py-6 text-center text-muted-foreground text-sm border-t border-border/30">
        © {new Date().getFullYear()} SightWords App. Happy Learning!
      </footer>
    </>
  );
}
