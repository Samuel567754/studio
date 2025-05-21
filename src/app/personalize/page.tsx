
"use client";

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { setHasCompletedPersonalization, getHasCompletedPersonalization, getHasSeenIntroduction } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { playSuccessSound, playNotificationSound, speakText, playErrorSound } from '@/lib/audio';
import { UserPlus, ArrowRight, Sparkles, Heart, UserCog, Info, Volume2, Pause, Play as PlayIcon, XCircle } from 'lucide-react'; 
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppSettingsStore } from '@/stores/app-settings-store';

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
  const { soundEffectsEnabled } = useAppSettingsStore();

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

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

  const handleSpeechEnd = useCallback(() => {
    setIsAudioPlaying(false);
    setIsAudioPaused(false);
    setCurrentUtterance(null);
  }, []);

  const handleSpeechError = useCallback((event: SpeechSynthesisErrorEvent) => {
    if (event.error !== 'interrupted' && event.error !== 'canceled') {
      console.error("Personalize page speech error:", event.error);
      toast({ variant: "destructive", title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Audio Error</div>, description: "Could not play audio for personalization." });
      if (soundEffectsEnabled) playErrorSound();
    }
    handleSpeechEnd();
  }, [toast, handleSpeechEnd, soundEffectsEnabled]);
  
  const stopCurrentSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && currentUtterance) {
      window.speechSynthesis.cancel();
    }
    handleSpeechEnd();
  }, [currentUtterance, handleSpeechEnd]);

  const playPageAudio = useCallback(() => {
    if (!soundEffectsEnabled || typeof window === 'undefined' || !window.speechSynthesis) {
       if(soundEffectsEnabled) {
         toast({ variant: "info", title: "Audio Disabled", description: "Speech synthesis not available or sound is off." });
       }
      return;
    }

    if (currentUtterance) {
      if (isAudioPlaying && !isAudioPaused) {
        window.speechSynthesis.pause();
        setIsAudioPaused(true);
      } else if (isAudioPaused) {
        window.speechSynthesis.resume();
        setIsAudioPaused(false);
      } else {
        stopCurrentSpeech();
        const text = `Make it Yours! Help us tailor ChillLearn AI for you, ${username || 'learner'}. This is optional and can be updated later in your profile.`;
        const utterance = speakText(text, undefined, handleSpeechEnd, handleSpeechError);
        if (utterance) {
          setCurrentUtterance(utterance);
          setIsAudioPlaying(true);
          setIsAudioPaused(false);
        } else {
          handleSpeechEnd();
        }
      }
    } else {
      const text = `Make it Yours! Help us tailor ChillLearn AI for you, ${username || 'learner'}. This is optional and can be updated later in your profile.`;
      const utterance = speakText(text, undefined, handleSpeechEnd, handleSpeechError);
      if (utterance) {
        setCurrentUtterance(utterance);
        setIsAudioPlaying(true);
        setIsAudioPaused(false);
      } else {
        handleSpeechEnd();
      }
    }
  }, [soundEffectsEnabled, username, currentUtterance, isAudioPlaying, isAudioPaused, handleSpeechEnd, handleSpeechError, stopCurrentSpeech, toast]);

  useEffect(() => {
    if (isMounted && soundEffectsEnabled) {
      const timer = setTimeout(() => {
        playPageAudio();
      }, 300);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, soundEffectsEnabled]);

  useEffect(() => {
    return () => {
      stopCurrentSpeech();
    };
  }, [stopCurrentSpeech]);

  const handleTopicChange = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    stopCurrentSpeech();
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
      if (soundEffectsEnabled) playSuccessSound();
    } else {
       toast({
        variant: "info",
        title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Personalization Complete</div>,
        description: "You can set your details later in your profile. Let's get started!",
      });
      if (soundEffectsEnabled) playNotificationSound();
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

  const getButtonIcon = () => {
    if (isAudioPlaying && !isAudioPaused) return <Pause className="h-6 w-6" />;
    if (isAudioPaused) return <PlayIcon className="h-6 w-6" />;
    return <Volume2 className="h-6 w-6" />;
  };

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
                  data-ai-hint="app background settings"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent flex items-center justify-center p-2">
                   <UserCog className="h-10 w-10 text-white/90 drop-shadow-lg" aria-hidden="true" />
              </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <CardTitle className="text-3xl font-bold text-gradient-primary-accent">
              Make it Yours!
            </CardTitle>
            {soundEffectsEnabled && (
              <Button onClick={playPageAudio} variant="ghost" size="icon" className="text-primary hover:bg-primary/10 rounded-full h-10 w-10" aria-label={isAudioPlaying && !isAudioPaused ? "Pause audio" : (isAudioPaused ? "Resume audio" : "Play page description")}>
                {getButtonIcon()}
              </Button>
            )}
          </div>
          <CardDescription className="text-base text-muted-foreground px-2">
            Help us tailor ChillLearn AI for you, {username || 'learner'}. This is optional and can be updated later in your profile.
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
