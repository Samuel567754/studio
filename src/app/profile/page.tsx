
"use client";

import { useState, useEffect } from 'react';
import {
  getStoredWordList,
  getStoredMasteredWords,
  getStoredReadingLevel,
  getStoredWordLength,
} from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { User, BookOpen, BarChart3, Settings2, ListChecks, CheckSquare } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProfileData {
  practiceWordCount: number;
  masteredWordCount: number;
  readingLevel: string;
  wordLength: number;
  practiceWords: string[];
  masteredWords: string[];
}

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const practiceList = getStoredWordList();
    const masteredList = getStoredMasteredWords();
    const level = getStoredReadingLevel();
    const length = getStoredWordLength();

    setProfileData({
      practiceWordCount: practiceList.length,
      masteredWordCount: masteredList.length,
      readingLevel: level,
      wordLength: length,
      practiceWords: practiceList,
      masteredWords: masteredList,
    });
    setIsMounted(true);
  }, []);

  if (!isMounted || !profileData) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-8 w-1/2 bg-muted rounded"></div>
            <div className="h-4 w-3/4 bg-muted rounded mt-2"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 w-full bg-muted rounded"></div>
            <div className="h-10 w-full bg-muted rounded"></div>
            <div className="h-10 w-full bg-muted rounded"></div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-1/3 bg-muted rounded"></div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-20 bg-muted rounded"></div>
             <div className="h-20 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header className="text-center space-y-2 mb-10 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <User className="h-16 w-16 mx-auto text-primary animate-in fade-in zoom-in-50 duration-1000 delay-200" />
        <h1 className="text-4xl font-bold text-gradient-primary-accent">Your Learning Profile</h1>
        <p className="text-lg text-muted-foreground">A snapshot of your progress and preferences.</p>
      </header>

      <Card className="shadow-lg border-primary/20 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-100">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-semibold text-primary">
            <BarChart3 className="mr-3 h-6 w-6" />
            Progress Overview
          </CardTitle>
          <CardDescription>Key metrics about your learning journey.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
          <div className="flex items-center space-x-3 p-4 bg-secondary/30 rounded-lg shadow-sm animate-in fade-in-0 slide-in-from-left-5 duration-500 ease-out delay-200">
            <ListChecks className="h-8 w-8 text-accent" />
            <div>
              <p className="font-semibold text-foreground">{profileData.practiceWordCount}</p>
              <p className="text-sm text-muted-foreground">Words in Practice List</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-secondary/30 rounded-lg shadow-sm animate-in fade-in-0 slide-in-from-right-5 duration-500 ease-out delay-300">
            <CheckSquare className="h-8 w-8 text-green-500" />
            <div>
              <p className="font-semibold text-foreground">{profileData.masteredWordCount}</p>
              <p className="text-sm text-muted-foreground">Words Mastered</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-accent/20 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-200">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-semibold text-accent">
            <Settings2 className="mr-3 h-6 w-6" />
            Current Preferences
          </CardTitle>
          <CardDescription>Your current settings for word suggestions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-lg">
          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg animate-in fade-in-0 zoom-in-95 duration-300 delay-300">
            <span className="text-foreground font-medium">Reading Level:</span>
            <Badge variant="outline" className="text-base px-3 py-1 capitalize">{profileData.readingLevel}</Badge>
          </div>
          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg animate-in fade-in-0 zoom-in-95 duration-300 delay-400">
            <span className="text-foreground font-medium">Preferred Word Length:</span>
            <Badge variant="outline" className="text-base px-3 py-1">{profileData.wordLength} letters</Badge>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md border-border/30 animate-in fade-in-0 slide-in-from-left-5 duration-500 ease-out delay-300">
            <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold">
                    <BookOpen className="mr-2 h-5 w-5 text-primary" /> Practice Words
                </CardTitle>
            </CardHeader>
            <CardContent>
                {profileData.practiceWords.length > 0 ? (
                    <ScrollArea className="h-48 w-full rounded-md border p-3 bg-background/50">
                        <div className="flex flex-wrap gap-2">
                        {profileData.practiceWords.map((word, index) => (
                            <Badge key={`practice-${index}`} variant="secondary" className="text-sm px-2 py-1 animate-in fade-in zoom-in-95 duration-300" style={{ animationDelay: `${index * 20}ms` }}>{word}</Badge>
                        ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <Alert variant="info" className="animate-in fade-in-0 zoom-in-95 duration-300">
                        <AlertTitle>No Practice Words</AlertTitle>
                        <AlertDescription>Your practice list is currently empty. Go to the "Learn" page to add words!</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>

        <Card className="shadow-md border-border/30 animate-in fade-in-0 slide-in-from-right-5 duration-500 ease-out delay-400">
            <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold">
                   <CheckSquare className="mr-2 h-5 w-5 text-green-500" /> Mastered Words
                </CardTitle>
            </CardHeader>
            <CardContent>
                 {profileData.masteredWords.length > 0 ? (
                    <ScrollArea className="h-48 w-full rounded-md border p-3 bg-background/50">
                         <div className="flex flex-wrap gap-2">
                        {profileData.masteredWords.map((word, index) => (
                            <Badge key={`mastered-${index}`} variant="success" className="text-sm px-2 py-1 bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-500/30 animate-in fade-in zoom-in-95 duration-300" style={{ animationDelay: `${index * 20}ms` }}>{word}</Badge>
                        ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <Alert variant="info" className="animate-in fade-in-0 zoom-in-95 duration-300">
                        <AlertTitle>No Mastered Words Yet</AlertTitle>
                        <AlertDescription>Keep practicing your spelling to master more words!</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
      </div>


    </div>
  );
}

