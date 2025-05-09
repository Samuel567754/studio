
"use client";
import type { FC } from 'react';
import { useState } from 'react';
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
  currentReadingLevel: string;
  currentWordLength: number;
  onSettingsChange: (level: string, length: number) => void;
}

export const WordSuggestion: FC<WordSuggestionProps> = ({ onWordSelected, currentReadingLevel, currentWordLength, onSettingsChange }) => {
  const [suggestedWordsList, setSuggestedWordsList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SuggestionFormValues>({
    resolver: zodResolver(suggestionFormSchema),
    defaultValues: {
      readingLevel: currentReadingLevel,
      wordLength: currentWordLength,
    },
    values: { // Make form reactive to external changes
        readingLevel: currentReadingLevel,
        wordLength: currentWordLength,
    }
  });

  const onSubmit: SubmitHandler<SuggestionFormValues> = async (data) => {
    setIsLoading(true);
    setSuggestedWordsList([]);
    onSettingsChange(data.readingLevel, data.wordLength); // Update parent state
    try {
      const result = await suggestWords(data as SuggestWordsInput);
      if (result.suggestedWords && result.suggestedWords.length > 0) {
        setSuggestedWordsList(result.suggestedWords);
        toast({ title: "Words Suggested!", description: `${result.suggestedWords.length} new words to practice.` });
      } else {
        setSuggestedWordsList([]);
        toast({ title: "No Words Found", description: "Try different settings or broaden your criteria.", variant: "default" });
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast({ title: "Suggestion Error", description: "Could not fetch word suggestions at this time. Please try again later.", variant: "destructive" });
      setSuggestedWordsList([]);
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
                  <Select onValueChange={(value) => { field.onChange(value); onSettingsChange(value, form.getValues("wordLength")); }} defaultValue={field.value}>
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
                    <Input type="number" placeholder="e.g., 4" {...field} onChange={(e) => { field.onChange(e); onSettingsChange(form.getValues("readingLevel"), Number(e.target.value)); }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
           <Button type="submit" disabled={isLoading} className="w-full" size="lg">
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
      {suggestedWordsList.length > 0 && (
        <CardFooter className="flex flex-col items-start gap-3 pt-4 border-t">
          <h4 className="font-semibold text-foreground">Practice these words:</h4>
          <div className="flex flex-wrap gap-2">
            {suggestedWordsList.map((word, index) => (
              <Button
                key={index}
                variant="secondary"
                onClick={() => onWordSelected(word)}
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

