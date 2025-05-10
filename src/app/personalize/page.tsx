
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
import { UserPlus, ArrowRight, Sparkles } from 'lucide-react';

export default function PersonalizePage() {
  const router = useRouter();
  const { username, setUsername: setStoreUsername, loadUsernameFromStorage } = useUserProfileStore();
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    loadUsernameFromStorage(); // Load existing username into store, if any

    // Redirect if personalization is already done or intro hasn't been seen
    const introSeen = getHasSeenIntroduction();
    const personalizationCompleted = getHasCompletedPersonalization();

    if (!introSeen) {
        router.replace('/introduction');
        return;
    }
    if (personalizationCompleted) {
        router.replace('/'); // Already personalized, go to home
        return;
    }

  }, [router, loadUsernameFromStorage]);
  
  useEffect(() => {
    if (isMounted && username !== null) {
      setUsernameInput(username);
    }
  }, [username, isMounted]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedUsername = usernameInput.trim();
    
    setStoreUsername(trimmedUsername || null); // Update store, allow clearing by submitting empty
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
        title: "Personalization Complete",
        description: "You can set a name later in your profile. Let's get started!",
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
                  src="https://picsum.photos/seed/personalize/200"
                  alt="Personalization avatar"
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint="avatar user"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent flex items-center justify-center p-2">
                   <UserPlus className="h-10 w-10 text-white/90 drop-shadow-lg" aria-hidden="true" />
              </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gradient-primary-accent">
            Let's Personalize!
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground px-2">
            Tell us your name so we can make your learning experience even better.
            You can always change this later in your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-lg font-medium text-foreground flex items-center">
                <ArrowRight className="mr-2 h-5 w-5 text-accent" />
                What should we call you?
              </Label>
              <Input
                id="username"
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter your name (optional)"
                className="text-xl p-4 h-14 shadow-sm focus:ring-2 focus:ring-primary border-border/50"
                aria-label="Enter your name"
              />
            </div>
            <Button type="submit" size="lg" className="w-full btn-glow text-lg py-7">
              Continue to ChillLearn <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </CardContent>
      </Card>
       <footer className="text-center text-xs text-muted-foreground py-6 mt-4">
         Your name helps us personalize greetings and messages.
      </footer>
    </div>
  );
}
