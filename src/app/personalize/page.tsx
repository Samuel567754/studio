
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { setHasCompletedPersonalization, getHasCompletedPersonalization, getHasSeenIntroduction } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { playSuccessSound, playNotificationSound } from '@/lib/audio';
import { UserPlus, ArrowRight, Sparkles, Heart, Check, UserCog, Info } from 'lucide-react'; 
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

const availableTopics = [
  "Animals", "Space", "Dinosaurs", "Adventures", "Fairy Tales", 
  "Superheroes", "Sports", "Music", "Nature", "Oceans", 
  "Cars & Trucks", "Fantasy", "Science", "History", "Art", "Robots", "Mystery"
];

export default function PersonalizePage() {
  const router = useRouter();
  const { 
    username, 
    favoriteTopics,
    setUsername: setStoreUsername, 
    setFavoriteTopics: setStoreFavoriteTopics,
    loadUserProfileFromStorage 
  } = useUserProfileStore();

  const [usernameInput, setUsernameInput] = useState<string>('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    loadUserProfileFromStorage(); 

    const introSeen = getHasSeenIntroduction();
    const personalizationCompleted = getHasCompletedPersonalization();

    if (!introSeen) {
        router.replace('/introduction');
        return;
    }
    if (personalizationCompleted) {
        router.replace('/'); 
        return;
    }

  }, [router, loadUserProfileFromStorage]);
  
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedUsername = usernameInput.trim();
    const topicsString = selectedTopics.join(', ');
    
    setStoreUsername(trimmedUsername || null); 
    setStoreFavoriteTopics(topicsString || null);
    setHasCompletedPersonalization(true);

    if (trimmedUsername) {
      toast({
        variant: "success",
        title: <div className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Welcome, {trimmedUsername}!</div>,
        description: "Your experience is now personalized. Let's get started!",
      });
      playSuccessSound();
    } else {
       toast({
        variant: "info",
        title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Personalization Complete</div>,
        description: "You can set your details later in your profile. Let's get started!",
      });
      playNotificationSound();
    }
    router.replace('/'); 
  };
  
  if (!isMounted) {
    return (
         <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5 text-foreground flex flex-col items-center justify-center p-4 sm:p-6">
            <Card className="w-full max-w-md animate-pulse shadow-xl">
                <CardHeader className="items-center">
                    <div className="h-8 w-1/2 bg-muted rounded mb-2"></div>
                    <div className="h-4 w-3/4 bg-muted rounded"></div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="h-4 w-1/4 bg-muted rounded"></div>
                        <div className="h-12 bg-muted rounded"></div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-1/4 bg-muted rounded"></div>
                        <div className="h-20 bg-muted rounded"></div>
                    </div>
                     <div className="h-12 bg-primary/50 rounded"></div>
                </CardContent>
            </Card>
             <p className="sr-only">Loading personalization page...</p>
        </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5 text-foreground flex flex-col items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-2xl border-primary/20 animate-in fade-in-0 zoom-in-95 duration-700 ease-out">
        <CardHeader className="text-center items-center space-y-3">
          <div className="relative w-24 h-24 md:w-28 md:h-28 mx-auto rounded-full overflow-hidden shadow-lg border-4 border-accent/30 mb-3">
              <Image
                  src="https://images.unsplash.com/photo-1690743300330-d190ad8f97dc?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTE1fHxhcHAlMjBiYWNrZ3JvdW5kc3xlbnwwfHwwfHx8MA%3D%3D" 
                  alt="Abstract colorful background for app personalization"
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint="app background"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent flex items-center justify-center p-2">
                   <UserCog className="h-10 w-10 text-white/90 drop-shadow-lg" aria-hidden="true" />
              </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gradient-primary-accent">
            Make it Yours!
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground px-2">
            Help us tailor ChillLearn AI for you. This is optional and can be updated later in your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-lg font-medium text-foreground flex items-center">
                <UserPlus className="mr-2 h-5 w-5 text-accent" />
                What's your name?
              </Label>
              <Input
                id="username"
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="E.g., Alex (optional)"
                className="text-xl p-4 h-14 shadow-sm focus:ring-2 focus:ring-primary border-border/50"
                aria-label="Enter your name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-lg font-medium text-foreground flex items-center">
                <Heart className="mr-2 h-5 w-5 text-accent" />
                Select your favorite topics (optional):
              </Label>
              <ScrollArea className="h-40 w-full rounded-md border p-3 shadow-sm bg-background/50">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {availableTopics.map((topic) => (
                    <div key={topic} className="flex items-center space-x-2">
                      <Checkbox
                        id={`topic-${topic.toLowerCase().replace(/\s+/g, '-')}`}
                        checked={selectedTopics.includes(topic)}
                        onCheckedChange={() => handleTopicChange(topic)}
                      />
                      <Label 
                        htmlFor={`topic-${topic.toLowerCase().replace(/\s+/g, '-')}`}
                        className="text-base font-normal cursor-pointer hover:text-primary"
                      >
                        {topic}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">This helps us suggest more relevant reading passages.</p>
            </div>
            <Button type="submit" size="lg" className="w-full btn-glow text-lg py-7">
              Continue to ChillLearn <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </CardContent>
      </Card>
       <footer className="text-center text-xs text-muted-foreground py-6 mt-4">
         Your preferences help us create a better learning adventure!
      </footer>
    </div>
  );
}
