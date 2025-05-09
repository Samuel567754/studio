
"use client";
import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { suggestWords, type SuggestWordsInput } from '@/ai/flows/suggest-words';
import { Loader2, Wand2, Lightbulb } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const suggestionFormSchema = z.object({
  readingLevel: z.string().min(1, "Reading level is required."),
  wordLength: z.coerce.number().min(2, "Word length must be at least 2 letters.").max(10, "Word length must be at most 10 letters."),
});

type SuggestionFormValues = z.infer<typeof suggestionFormSchema>;

interface WordSuggestionProps {
  onWordSelected: (word: string) => void;
  onNewSuggestedWordsList: (words: string[]) => void; // Callback to inform parent of new suggestions
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

  const form = useForm<SuggestionFormValues>({
    resolver: zodResolver(suggestionFormSchema),
    defaultValues: {
      readingLevel: currentReadingLevel,
      wordLength: currentWordLength,
    },
  });

  // Sync form with external prop changes for readingLevel and wordLength
  useEffect(() => {
    form.reset({
      readingLevel: currentReadingLevel,
      wordLength: currentWordLength,
    });
  }, [currentReadingLevel, currentWordLength, form]);


  const onSubmit: SubmitHandler<SuggestionFormValues> = async (data) => {
    setIsLoading(true);
    setDisplayedSuggestedWords([]); // Clear previous suggestions
    onSettingsChange(data.readingLevel, data.wordLength); 
    try {
      const result = await suggestWords(data as SuggestWordsInput);
      if (result.suggestedWords && result.suggestedWords.length > 0) {
        setDisplayedSuggestedWords(result.suggestedWords);
        onNewSuggestedWordsList(result.suggestedWords); // Inform parent
        toast({ title: "Words Suggested!", description: `${result.suggestedWords.length} new words to practice.` });
      } else {
        setDisplayedSuggestedWords([]);
        onNewSuggestedWordsList([]); // Inform parent
        toast({ title: "No Words Found", description: "Try different settings or broaden your criteria.", variant: "default" });
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast({ title: "Suggestion Error", description: "Could not fetch word suggestions at this time. Please try again later.", variant: "destructive" });
      setDisplayedSuggestedWords([]);
      onNewSuggestedWordsList([]); // Inform parent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-primary"><Wand2 className="mr-2 h-5 w-5"/>AI Word Suggestions</CardTitle>
        <CardDescription>Discover new words tailored to your learning preferences.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="readingLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Reading Level</FormLabel>
                  <Select 
                    onValueChange={(value) => { 
                      field.onChange(value); 
                      // No need to call onSettingsChange here, it's called on submit
                    }} 
                    value={field.value} // Ensure value is controlled
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your reading level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
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
                  <FormLabel>Preferred Word Length</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g., 4" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e.target.valueAsNumber || 0);
                        // No need to call onSettingsChange here
                      }}
                      value={field.value} // Ensure value is controlled
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
           <Button type="submit" disabled={isLoading} className="w-full !text-base" size="lg">
             {isLoading ? (
               <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 Finding Words...
               </>
             ) : (
               <>
                 <Lightbulb className="mr-2 h-4 w-4" />
                 Get New Words
               </>
             )}
           </Button>
          </CardContent>
        </form>
      </Form>
      {displayedSuggestedWords.length > 0 && (
        <CardFooter className="flex flex-col items-start gap-4 pt-6 border-t">
          <h4 className="font-semibold text-foreground text-lg">Practice these words:</h4>
          <div className="flex flex-wrap gap-2 items-center">
            {displayedSuggestedWords.map((word, index) => (
              <Button
                key={index}
                variant={currentPracticingWord === word ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  onWordSelected(word);
                }}
                className={`px-3 py-1.5 text-sm transition-all duration-150 ease-in-out hover:shadow-md 
                            ${currentPracticingWord === word 
                              ? 'bg-primary text-primary-foreground scale-105 shadow-lg' 
                              : 'bg-secondary/50 hover:bg-secondary text-secondary-foreground hover:text-accent-foreground'
                            }`}
              >
                {word}
              </Button>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};
