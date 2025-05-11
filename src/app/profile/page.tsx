
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  getStoredWordList,
  getStoredMasteredWords,
  getStoredReadingLevel,
  getStoredWordLength,
} from '@/lib/storage';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { User, BookOpen, BarChart3, Settings2, ListChecks, CheckSquare, Edit, Save, Smile, Heart, Award } from 'lucide-react'; // Updated icon
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/hooks/use-toast";
import { playSuccessSound, playNotificationSound } from '@/lib/audio';


interface ProfileData {
  practiceWordCount: number;
  masteredWordCount: number;
  readingLevel: string;
  wordLength: number;
  practiceWords: string[];
  masteredWords: string[];
}

const availableTopics = [
  "Animals", "Space", "Dinosaurs", "Adventures", "Fairy Tales", 
  "Superheroes", "Sports", "Music", "Nature", "Oceans", 
  "Cars & Trucks", "Fantasy", "Science", "History", "Art", "Robots", "Mystery"
];

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { 
    username, 
    favoriteTopics, 
    setUsername: setStoreUsername, 
    setFavoriteTopics: setStoreFavoriteTopics, 
    loadUserProfileFromStorage 
  } = useUserProfileStore();
  
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadUserProfileFromStorage(); 
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
  }, [loadUserProfileFromStorage]);

  useEffect(() => {
    if (isMounted) {
      setUsernameInput(username || '');
      setSelectedTopics(favoriteTopics ? favoriteTopics.split(',').map(t => t.trim()).filter(t => t) : []);
    }
  }, [username, favoriteTopics, isMounted]);

  const handleTopicChange = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleProfileInfoSave = (e: FormEvent) => {
    e.preventDefault();
    const trimmedUsername = usernameInput.trim();
    const topicsString = selectedTopics.join(', ');

    setStoreUsername(trimmedUsername || null);
    setStoreFavoriteTopics(topicsString || null);
    
    toast({
      variant: "success",
      title: <div className="flex items-center gap-2"><Smile className="h-5 w-5" />Profile Updated!</div>,
      description: `Your information has been saved.`,
    });
    playSuccessSound();
  };


  if (!isMounted || !profileData) {
    return (
      <div className="space-y-6" aria-live="polite" aria-busy="true">
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
        <p className="sr-only">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header className="text-center space-y-4 mb-10 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full overflow-hidden shadow-lg border-4 border-primary/30">
            <Image
                src="https://picsum.photos/seed/child-award-avatar/200" // More relevant image
                alt={username ? `${username}'s profile avatar with a learning award theme` : "User profile avatar with a learning award theme"}
                layout="fill"
                objectFit="cover"
                className="rounded-full"
                data-ai-hint="child award avatar" // Updated hint
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent flex items-end justify-center p-2">
                 <Award className="h-10 w-10 text-white/80 drop-shadow-lg animate-in fade-in zoom-in-50 duration-1000 delay-200" aria-hidden="true" />
            </div>
        </div>
        <h1 className="text-4xl font-bold text-gradient-primary-accent">
          {username ? `${username}'s Learning Profile` : "Your Learning Profile"}
        </h1>
        <p className="text-lg text-muted-foreground">A snapshot of your progress and preferences.</p>
      </header>

      <Card className="shadow-xl border-accent/30 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-100">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-semibold text-accent">
             <Edit className="mr-3 h-6 w-6" aria-hidden="true" /> Edit Your Information
          </CardTitle>
          <CardDescription>Update your name and favorite topics to personalize your experience.</CardDescription>
        </CardHeader>
        <form onSubmit={handleProfileInfoSave}>
          <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username-input" className="text-base font-medium flex items-center gap-2">
                    <Smile className="h-5 w-5 text-muted-foreground" /> Your Name:
                </Label>
                <Input
                    id="username-input"
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter your name"
                    className="text-lg p-3 h-12 shadow-sm focus:ring-2 focus:ring-accent"
                    aria-label="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-medium flex items-center gap-2">
                    <Heart className="h-5 w-5 text-muted-foreground" /> Your Favorite Topics:
                </Label>
                <ScrollArea className="h-40 w-full rounded-md border p-3 shadow-sm bg-background/50">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                    {availableTopics.map((topic) => (
                      <div key={topic} className="flex items-center space-x-2">
                        <Checkbox
                          id={`profile-topic-${topic.toLowerCase().replace(/\s+/g, '-')}`}
                          checked={selectedTopics.includes(topic)}
                          onCheckedChange={() => handleTopicChange(topic)}
                          aria-label={topic}
                        />
                        <Label 
                          htmlFor={`profile-topic-${topic.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-base font-normal cursor-pointer hover:text-accent"
                        >
                          {topic}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                 <p className="text-xs text-muted-foreground">Select topics that interest you for tailored reading passages.</p>
              </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto" aria-label="Save profile information">
                <Save className="mr-2 h-5 w-5" /> Save Information
            </Button>
          </CardFooter>
        </form>
      </Card>


      <Card className="shadow-lg border-primary/20 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-200">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-semibold text-primary">
            <BarChart3 className="mr-3 h-6 w-6" aria-hidden="true" />
            Progress Overview
          </CardTitle>
          <CardDescription>Key metrics about your learning journey.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
          <div className="flex items-center space-x-3 p-4 bg-secondary/30 rounded-lg shadow-sm animate-in fade-in-0 slide-in-from-left-5 duration-500 ease-out delay-300">
            <ListChecks className="h-8 w-8 text-accent" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">{profileData.practiceWordCount}</p>
              <p className="text-sm text-muted-foreground">Words in Practice List</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-secondary/30 rounded-lg shadow-sm animate-in fade-in-0 slide-in-from-right-5 duration-500 ease-out delay-400">
            <CheckSquare className="h-8 w-8 text-green-500" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">{profileData.masteredWordCount}</p>
              <p className="text-sm text-muted-foreground">Words Mastered</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-accent/20 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-300">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-semibold text-accent">
            <Settings2 className="mr-3 h-6 w-6" aria-hidden="true" />
            Current Preferences
          </CardTitle>
          <CardDescription>Your current settings for word suggestions. You can change these on the "Learn Words" or "Settings" page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-lg">
          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg animate-in fade-in-0 zoom-in-95 duration-300 delay-400">
            <span className="text-foreground font-medium" id="reading-level-label">Reading Level:</span>
            <Badge variant="outline" className="text-base px-3 py-1 capitalize" aria-labelledby="reading-level-label">{profileData.readingLevel}</Badge>
          </div>
          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg animate-in fade-in-0 zoom-in-95 duration-300 delay-500">
            <span className="text-foreground font-medium" id="word-length-label">Preferred Word Length:</span>
            <Badge variant="outline" className="text-base px-3 py-1" aria-labelledby="word-length-label">{profileData.wordLength} letters</Badge>
          </div>
           <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button asChild variant="outline" className="w-full sm:flex-1">
              <Link href="/learn">
                <Edit className="mr-2 h-4 w-4" /> Change Word Preferences
              </Link>
            </Button>
             <Button asChild variant="outline" className="w-full sm:flex-1">
              <Link href="/settings">
                <Settings2 className="mr-2 h-4 w-4" /> Go to App Settings
              </Link>
            </Button>
           </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md border-border/30 animate-in fade-in-0 slide-in-from-left-5 duration-500 ease-out delay-400">
            <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold" id="practice-words-heading">
                    <BookOpen className="mr-2 h-5 w-5 text-primary" aria-hidden="true" /> Practice Words
                </CardTitle>
            </CardHeader>
            <CardContent>
                {profileData.practiceWords.length > 0 ? (
                    <ScrollArea className="h-48 w-full rounded-md border p-3 bg-background/50">
                        <div className="flex flex-wrap gap-2" role="list" aria-labelledby="practice-words-heading">
                        {profileData.practiceWords.map((word, index) => (
                            <Badge key={`practice-${index}`} variant="secondary" className="text-sm px-2 py-1 animate-in fade-in zoom-in-95 duration-300" style={{ animationDelay: `${index * 20}ms` }} role="listitem">{word}</Badge>
                        ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <Alert variant="info" className="animate-in fade-in-0 zoom-in-95 duration-300" aria-live="polite">
                        <AlertTitle>No Practice Words</AlertTitle>
                        <AlertDescription>Your practice list is currently empty. Go to the <Link href="/learn" className="font-semibold text-primary hover:underline">Learn Words</Link> page to add words!</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>

        <Card className="shadow-md border-border/30 animate-in fade-in-0 slide-in-from-right-5 duration-500 ease-out delay-500">
            <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold" id="mastered-words-heading">
                   <CheckSquare className="mr-2 h-5 w-5 text-green-500" aria-hidden="true" /> Mastered Words
                </CardTitle>
            </CardHeader>
            <CardContent>
                 {profileData.masteredWords.length > 0 ? (
                    <ScrollArea className="h-48 w-full rounded-md border p-3 bg-background/50">
                         <div className="flex flex-wrap gap-2" role="list" aria-labelledby="mastered-words-heading">
                        {profileData.masteredWords.map((word, index) => (
                            <Badge key={`mastered-${index}`} variant="success" className="text-sm px-2 py-1 bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-500/30 animate-in fade-in zoom-in-95 duration-300" style={{ animationDelay: `${index * 20}ms` }} role="listitem">{word}</Badge>
                        ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <Alert variant="info" className="animate-in fade-in-0 zoom-in-95 duration-300" aria-live="polite">
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


    

