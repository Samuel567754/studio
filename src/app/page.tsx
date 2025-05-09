
"use client";

import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/app-header';
import { WordDisplay } from '@/components/word-display';
import { SpellingPractice } from '@/components/spelling-practice';
import { WordSuggestion } from '@/components/word-suggestion';
import { ReadingPractice } from '@/components/reading-practice'; // Import new component
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function SightWordsPage() {
  const [currentWord, setCurrentWord] = useState<string>('');
  const [wordList, setWordList] = useState<string[]>([]); // This list will be used for reading practice
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  const [readingLevel, setReadingLevel] = useState<string>("beginner");
  const [wordLength, setWordLength] = useState<number>(3);

  const { toast } = useToast();

  useEffect(() => {
    if (wordList.length > 0) {
      setCurrentWord(wordList[currentIndex]);
    } else {
      setCurrentWord(''); 
    }
  }, [wordList, currentIndex]);

  const handleWordSelectedFromSuggestion = (word: string) => {
    // Add word to list if not already present for reading practice, and set as current
    if (!wordList.includes(word)) {
      setWordList(prev => [...prev, word]); 
    }
    setCurrentWord(word); // Set selected word for spelling and display
    // Find index of the newly selected/added word to set currentIndex for navigation (if needed)
    const newWordIndex = wordList.includes(word) ? wordList.indexOf(word) : wordList.length; // if new, it's at the end
    setCurrentIndex(newWordIndex); 

    toast({ title: "New Word Set!", description: `Now practicing: ${word}`});
  };
  
  // Used by WordSuggestion to populate the list for selection
  const handleNewSuggestedWordsList = (newList: string[]) => {
    // This function is primarily for the WordSuggestion component to display options.
    // The main wordList for practice is updated via onWordSelected.
    // However, if we want the ReadingPractice to use ALL suggested words, we might change logic here.
    // For now, ReadingPractice uses `wordList` which accumulates selected words.
  };


  const handleSettingsChange = (level: string, length: number) => {
    setReadingLevel(level);
    setWordLength(length);
    // Potentially clear wordList if settings change significantly, or let user decide.
    // setWordList([]); 
    // setCurrentIndex(0);
  };

  const handleCorrectSpell = () => {
    toast({
      title: "Great Job!",
      description: `You spelled "${currentWord}" correctly!`,
    });
    // Optionally, if there are more words in the wordList, move to the next one
    // if (wordList.length > 1 && currentIndex < wordList.length - 1) {
    //   setCurrentIndex(prev => prev + 1);
    // } else if (wordList.length > 0 && currentIndex === wordList.length - 1) {
    //   toast({ title: "Practice Round Complete!", description: "You've practiced all selected words. Try generating a reading passage!" });
    // }
  };
  
  return (
    <>
      <AppHeader />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column / Main Column on smaller screens */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <WordDisplay word={currentWord} />
            <SpellingPractice wordToSpell={currentWord} onCorrectSpell={handleCorrectSpell} />
            <ReadingPractice wordsToPractice={wordList} readingLevel={readingLevel} />
          </div>

          {/* Right Column / Sidebar on larger screens */}
          <div className="lg:col-span-1 space-y-6 md:space-y-8">
            <WordSuggestion 
              onWordSelected={handleWordSelectedFromSuggestion}
              onNewSuggestedWordsList={handleNewSuggestedWordsList} 
              currentReadingLevel={readingLevel}
              currentWordLength={wordLength}
              onSettingsChange={handleSettingsChange}
              currentPracticingWord={currentWord}
            />
          </div>
        </div>
        
        {!currentWord && wordList.length === 0 && (
          <div className="mt-12 text-center p-8 bg-card rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-primary mb-4">Welcome to SightWords!</h2>
            <p className="text-muted-foreground mb-6">
              Start your learning journey by getting some word suggestions based on your reading level and preferred word length.
            </p>
            <p className="text-muted-foreground">
              Use the "AI Word Suggestions" panel to begin. Select words to practice spelling and reading.
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
