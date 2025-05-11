
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpenText, Sigma, Sparkles, Puzzle, FileType2 as TextSelectIcon, Volume2, Play, Pause, Info, XCircle, Compass } from 'lucide-react';
import { speakText, playErrorSound, playNotificationSound } from '@/lib/audio';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import { useUserProfileStore } from '@/stores/user-profile-store';

const mainSections = [
  {
    key: "word-practice",
    title: "Word Practice Zone",
    description: "Learn new words, practice spelling, identify words by ear, and read AI-generated stories.",
    href: "/word-practice",
    icon: TextSelectIcon,
    imageSrc: "https://plus.unsplash.com/premium_photo-1687819872154-9d4fd3cb7cca?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjl8fGxlYXJuJTIwd29yZHN8ZW58MHx8MHx8fDA%3D",
    imageAlt: "Child learning words with AI assistance",
    aiHint: "AI learning words",
    color: "text-primary",
  },
   {
    key: "ai-games",
    title: "AI Word Games",
    description: "Challenge yourself with interactive AI-powered word games like Fill-in-the-Blank and Definition Match.",
    href: "/ai-games",
    icon: Puzzle, 
    imageSrc: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YWl8ZW58MHx8MHx8fDA%3D",
    imageAlt: "Abstract AI patterns representing word games",
    aiHint: "AI games abstract",
    color: "text-orange-500", 
  },
  {
    key: "math",
    title: "Math Zone",
    description: "Explore a world of numbers with engaging arithmetic games, times tables, AI word problems, and more.",
    href: "/math",
    icon: Sigma,
    imageSrc: "https://images.unsplash.com/photo-1718306201865-cae4a08311fe?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzR8fGNoaWxkcmVuJTIwbWF0aGVtYXRpY3MlMjBiYWNrZ3JvdW5kfGVufDB8fDB8fHww",
    imageAlt: "Colorful math background with numbers and symbols",
    aiHint: "math background",
    color: "text-purple-500",
  },
];

export default function OfficialHomePage() {
  const { soundEffectsEnabled } = useAppSettingsStore();
  const { toast } = useToast();
  const { username } = useUserProfileStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isHeroAudioPlaying, setIsHeroAudioPlaying] = useState(false);
  const [currentHeroUtterance, setCurrentHeroUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [isExploreAudioPlaying, setIsExploreAudioPlaying] = useState(false);
  const [currentExploreUtterance, setCurrentExploreUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => { // Cleanup speech on unmount
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleHeroSpeechEnd = useCallback(() => {
    setIsHeroAudioPlaying(false);
    setCurrentHeroUtterance(null);
  }, []);

  const handleHeroSpeechError = useCallback((event: SpeechSynthesisErrorEvent) => {
    if (event.error !== 'interrupted' && event.error !== 'canceled') {
      console.error("Hero speech error:", event.error);
      toast({ variant: "destructive", title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Audio Error</div>, description: "Could not play welcome audio." });
      playErrorSound();
    }
    handleHeroSpeechEnd();
  }, [toast, handleHeroSpeechEnd]);

  const handleExploreSpeechEnd = useCallback(() => {
    setIsExploreAudioPlaying(false);
    setCurrentExploreUtterance(null);
  }, []);
  
  const handleExploreSpeechError = useCallback((event: SpeechSynthesisErrorEvent) => {
    if (event.error !== 'interrupted' && event.error !== 'canceled') {
      console.error("Explore speech error:", event.error);
      toast({ variant: "destructive", title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Audio Error</div>, description: "Could not play explore audio." });
      playErrorSound();
    }
    handleExploreSpeechEnd();
  }, [toast, handleExploreSpeechEnd]);

  const playAudio = useCallback((
    text: string, 
    isPlayingStateSetter: React.Dispatch<React.SetStateAction<boolean>>, 
    utteranceStateSetter: React.Dispatch<React.SetStateAction<SpeechSynthesisUtterance | null>>,
    onEndCallback: () => void,
    onErrorCallback: (event: SpeechSynthesisErrorEvent) => void,
    currentUtterance: SpeechSynthesisUtterance | null
  ) => {
    if (!soundEffectsEnabled || typeof window === 'undefined' || !window.speechSynthesis) {
      toast({ variant: "info", title: <div className="flex items-center gap-2"><Info className="h-5 w-5" />Audio Disabled</div>, description: "Sound effects are turned off in settings." });
      return;
    }
    if (currentUtterance) {
      window.speechSynthesis.cancel();
      onEndCallback(); // Reset state if an utterance was active
    }
    const newUtterance = speakText(text, undefined, onEndCallback, onErrorCallback);
    if (newUtterance) {
      utteranceStateSetter(newUtterance);
      isPlayingStateSetter(true);
    } else {
      onEndCallback();
    }
  }, [soundEffectsEnabled, toast]);

  const toggleHeroSpeech = () => {
    const text = `Welcome to ChillLearn${username ? `, ${username}` : ''}. Your fun and interactive partner for mastering words, practicing spelling, enjoying AI-powered reading, and exploring the world of math!`;
    if (currentHeroUtterance && isHeroAudioPlaying) {
      window.speechSynthesis.cancel();
      handleHeroSpeechEnd();
    } else {
      playAudio(text, setIsHeroAudioPlaying, setCurrentHeroUtterance, handleHeroSpeechEnd, handleHeroSpeechError, currentHeroUtterance);
    }
    playNotificationSound();
  };
  
  const toggleExploreSpeech = () => {
    const text = `Ready to Explore More? Check out your Profile to see your progress, visit the Tutorial for a detailed guide, or customize your experience in Settings.`;
    if (currentExploreUtterance && isExploreAudioPlaying) {
      window.speechSynthesis.cancel();
      handleExploreSpeechEnd();
    } else {
      playAudio(text, setIsExploreAudioPlaying, setCurrentExploreUtterance, handleExploreSpeechEnd, handleExploreSpeechError, currentExploreUtterance);
    }
    playNotificationSound();
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Sparkles className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="space-y-12">
      <header className="relative text-center rounded-xl overflow-hidden shadow-2xl h-[calc(100vh-200px)] min-h-[400px] md:min-h-[500px] lg:min-h-[600px] flex flex-col justify-center items-center mt-8 md:mt-12">
        <Image
          src="https://images.unsplash.com/photo-1662967221311-1153979919a6?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTY0fHxsZWFybmluZyUyMGFwcHxlbnwwfHwwfHx8MA%3D%3D"
          alt="Children interacting with colorful letters and learning tools"
          layout="fill"
          objectFit="cover"
          className="brightness-50" 
          data-ai-hint="learning app children"
          priority
        />
        <div className="absolute inset-0 bg-black/60" /> 
        <div className="relative z-10 container mx-auto px-4 py-10 text-white">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpenText className="h-16 w-16 md:h-20 md:w-20 text-white animate-in fade-in-0 zoom-in-50 duration-700 ease-out" />
            {soundEffectsEnabled && (
                <Button onClick={toggleHeroSpeech} variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-12 w-12" aria-label={isHeroAudioPlaying ? "Stop welcome message" : "Play welcome message"}>
                    {isHeroAudioPlaying ? <Pause className="h-7 w-7" /> : <Volume2 className="h-7 w-7" />}
                </Button>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Welcome to <span className="text-gradient-primary-accent">ChillLearn</span>{username ? `, ${username}!` : '!'}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-10 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 delay-200">
            Your fun and interactive partner for mastering words, practicing spelling, enjoying AI-powered reading, and exploring the world of math!
          </p>
          <Button asChild size="lg" className="btn-glow text-lg animate-in fade-in-0 zoom-in-75 duration-500 delay-400">
            <Link href="/word-practice">
              Start Word Practice <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {mainSections.map((section, index) => (
          <Card 
            key={section.key} 
            className={`overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 bg-card animate-in fade-in-0 slide-in-from-bottom-5 duration-500`}
            style={{ animationDelay: `${100 + index * 100}ms` }}
          >
            <div className="relative h-48 w-full">
              <Image
                src={section.imageSrc}
                alt={section.imageAlt}
                layout="fill"
                objectFit="cover"
                className="opacity-80 group-hover:opacity-100 transition-opacity"
                data-ai-hint={section.aiHint}
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                 <section.icon className={`h-16 w-16 ${section.color} opacity-70 drop-shadow-lg`} />
              </div>
            </div>
            <CardHeader className="pt-4">
              <CardTitle className={`text-2xl font-semibold ${section.color} flex items-center`}>
                 <section.icon className="mr-3 h-6 w-6" /> {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base text-foreground/80 min-h-[60px] mb-2">
                {section.description}
              </CardDescription>
              <Button asChild variant="outline" className={`w-full border-${section.color.replace('text-', '')}/50 hover:bg-${section.color.replace('text-', '')}/10 hover:text-${section.color.replace('text-', '')} group`}>
                <Link href={section.href}>
                  Go to {section.title} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="relative text-center rounded-xl overflow-hidden shadow-2xl h-[calc(70vh-150px)] min-h-[350px] md:min-h-[400px] lg:min-h-[450px] flex flex-col justify-center items-center my-8 md:my-12 animate-in fade-in-0 delay-500 duration-500">
         <Image
            src="https://images.unsplash.com/photo-1720983415059-43ec4007cf97?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTk0fHxsZWFybmluZyUyMGFwcHxlbnwwfHwwfHx8MA%3D%3D"
            alt="Abstract background for exploring app features"
            layout="fill"
            objectFit="cover"
            className="brightness-50"
            data-ai-hint="app features abstract"
         />
         <div className="absolute inset-0 bg-black/60" />
         <div className="relative z-10 container mx-auto px-4 py-10 text-white">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Compass className="h-12 w-12 md:h-16 md:w-16 text-white animate-in fade-in-0 zoom-in-50 duration-700 ease-out" />
              {soundEffectsEnabled && (
                  <Button onClick={toggleExploreSpeech} variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-12 w-12" aria-label={isExploreAudioPlaying ? "Stop explore message" : "Play explore message"}>
                      {isExploreAudioPlaying ? <Pause className="h-7 w-7" /> : <Volume2 className="h-7 w-7" />}
                  </Button>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gradient-primary-accent">
              Ready to Explore More?
            </h1>
            <p className="text-md md:text-lg text-gray-200 max-w-xl mx-auto mb-8 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 delay-200">
                Check out your <Link href="/profile" className="text-primary hover:underline font-semibold">Profile</Link> to see your progress,
                visit the <Link href="/tutorial" className="text-accent hover:underline font-semibold">Tutorial</Link> for a detailed guide,
                or customize your experience in <Link href="/settings" className="text-green-400 hover:underline font-semibold">Settings</Link>.
            </p>
            <Button size="lg" variant="secondary" asChild className="text-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-transform animate-in fade-in-0 zoom-in-75 duration-500 delay-400">
                <Link href="/tutorial">
                    <Sparkles className="mr-2 h-5 w-5" /> View Full Guide
                </Link>
            </Button>
         </div>
      </section>
    </div>
  );
}

