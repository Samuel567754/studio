"use client";
import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { suggestWords, type SuggestWordsInput } from '@/ai/flows/suggest-words';
import { Loader2, Wand2, Lightbulb, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { playSuccessSound, playErrorSound } from '@/lib/audio';
import { getStoredMasteredWords } from '@/lib/storage'; // Import getStoredMasteredWords

const suggestionFormSchema = z.object({
  readingLevel: z.string().min(1, "Reading level is required."),
  wordLength: z.coerce.number().min(2, "Word length must be at least 2 letters.").max(10, "Word length must be at most 10 letters."),
});

type SuggestionFormValues = z.infer<typeof suggestionFormSchema>;

interface WordSuggestionProps {
  onWordSelected: (word: string) => void;
  onNewSuggestedWordsList: (words: string[]) => void;
  currentReadingLevel: string;
  currentWordLength: number;
  onSettingsChange: (level: string, length: number) => void;
  currentPracticingWord?: string;
}

export const WordSuggestion: FC<WordSuggestionProps> = ({ 
  onWordSelected, 
  onNewSuggestedWordsList,
  currentReadingLevel, 
  currentWordLength, 
  onSettingsChange,
  currentPracticingWord 
}) => {
  const [displayedSuggestedWords, setDisplayedSuggestedWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const defaultFormValues = useMemo(() => ({
    readingLevel: currentReadingLevel || "beginner",
    wordLength: currentWordLength > 0 ? currentWordLength : 3, 
  }), [currentReadingLevel, currentWordLength]);

  const form = useForm<SuggestionFormValues>({
    resolver: zodResolver(suggestionFormSchema),
    defaultValues: defaultFormValues, 
  });

  useEffect(() => {
    const newDefaultValues = {
      readingLevel: currentReadingLevel || "beginner",
      wordLength: currentWordLength > 0 ? currentWordLength : 3,
    };
    if (form.getValues('readingLevel') !== newDefaultValues.readingLevel || form.getValues('wordLength') !== newDefaultValues.wordLength) {
      form.reset(newDefaultValues);
    }
  }, [currentReadingLevel, currentWordLength, form]);


  const onSubmit: SubmitHandler<SuggestionFormValues> = async (data) => {
    setIsLoading(true);
    setDisplayedSuggestedWords([]); 
    try {
      const masteredWords = getStoredMasteredWords();
      const input: SuggestWordsInput = { 
        ...data, 
        masteredWords: masteredWords.length > 0 ? masteredWords : undefined 
      };
      const result = await suggestWords(input);
      if (result.suggestedWords && result.suggestedWords.length > 0) {
        setDisplayedSuggestedWords(result.suggestedWords);
        onNewSuggestedWordsList(result.suggestedWords); 
        toast({ variant: "success", title: "Words Suggested!", description: `${result.suggestedWords.length} new words for you to consider.` });
        playSuccessSound();
      } else {
        setDisplayedSuggestedWords([]);
        onNewSuggestedWordsList([]); 
        toast({ variant: "info", title: "No Words Found", description: "Try different settings or broaden your criteria." });
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast({ variant: "destructive", title: "Suggestion Error", description: "Could not fetch word suggestions. Please try again." });
      playErrorSound();
      setDisplayedSuggestedWords([]);
      onNewSuggestedWordsList([]); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl w-full border-primary/20 bg-gradient-to-br from-card via-card to-secondary/10 dark:from-card dark:via-card dark:to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-semibold text-primary"><Wand2 className="mr-2 h-6 w-6"/>AI Word Suggestions</CardTitle>
        <CardDescription className="text-base">
          Set your preferences, and let AI find words for you. Click suggested words to add them to your practice list.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <FormField
                control={form.control}
                name="readingLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-base">Your Reading Level</FormLabel>
                    <Select 
                      onValueChange={(value) => { 
                        field.onChange(value); 
                        onSettingsChange(value, form.getValues('wordLength'));
                      }} 
                      value={field.value} 
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background/80 hover:border-primary/50 focus:ring-primary/50 text-base h-11 shadow-sm">
                          <SelectValue placeholder="Select reading level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner (e.g., K-1st)</SelectItem>
                        <SelectItem value="intermediate">Intermediate (e.g., 2nd-3rd)</SelectItem>
                        <SelectItem value="advanced">Advanced (e.g., 4th+)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="wordLength"
                render={({ field }) => ( 
                  <FormItem>
                    <FormLabel className="font-semibold text-base">Preferred Word Length</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g., 3 to 5" 
                        {...field} 
                        onChange={(e) => {
                          const val = e.target.valueAsNumber;
                          field.onChange(isNaN(val) ? '' : val); 
                          onSettingsChange(form.getValues('readingLevel'), isNaN(val) ? 0 : val);
                        }}
                        disabled={isLoading}
                        className="bg-background/80 hover:border-primary/50 focus:ring-primary/50 text-base h-11 shadow-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
           <Button type="submit" disabled={isLoading || !form.formState.isDirty && displayedSuggestedWords.length === 0 } className="w-full !text-lg py-3 mt-2" size="lg">
             {isLoading ? (
               <>
                 <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                 Thinking...
               </>
             ) : (
               <>
                 <Lightbulb className="mr-2 h-5 w-5" />
                 Get New Word Ideas
               </>
             )}
           </Button>
          </CardContent>
        </form>
      </Form>
      {displayedSuggestedWords.length > 0 && (
        <CardFooter className="flex flex-col items-start gap-4 pt-6 border-t border-primary/10">
          <h4 className="font-semibold text-foreground text-lg">AI Suggestions (click to add to your list):</h4>
          <div className="flex flex-wrap gap-2 items-center">
            {displayedSuggestedWords.map((word, index) => (
              <Button
                key={index}
                variant={currentPracticingWord === word ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  onWordSelected(word);
                }}
                className={cn(`px-4 py-2 text-sm md:text-base transition-all duration-150 ease-in-out hover:shadow-md rounded-full shadow-sm`,
                    currentPracticingWord === word 
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary-foreground dark:ring-primary ring-offset-2 ring-offset-primary dark:ring-offset-background scale-105' 
                        : 'bg-card hover:bg-secondary/60 text-foreground hover:text-accent-foreground border-primary/30 hover:border-primary'
                )}
                aria-pressed={currentPracticingWord === word}
              >
                {currentPracticingWord === word && <CheckCircle className="mr-2 h-4 w-4" />}
                {word}
              </Button>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};