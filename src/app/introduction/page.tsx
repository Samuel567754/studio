
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TouchEvent } from 'react'; // Import TouchEvent for type safety
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { setHasSeenIntroduction, getHasSeenIntroduction, getHasCompletedPersonalization } from '@/lib/storage';
import { Lightbulb, Edit3, Target, BookMarked, Sigma, User, SettingsIcon, HelpCircle, Sparkles, ArrowRight, HomeIcon, SkipForward, Palette, FileType2, Puzzle, Brain, PencilLine, BookOpen, BarChartHorizontal, SlidersHorizontal, Info, GraduationCap, Map, Compass, Volume2, Pause, Play as PlayIcon, XCircle } from 'lucide-react';
import { playNotificationSound, speakText, playErrorSound } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { useUserProfileStore } from '@/stores/user-profile-store';

const features = [
  { icon: HomeIcon, title: (username?: string | null) => "Homepage Hub", description: "Your central dashboard for accessing all learning activities.", imageSrc: "https://images.unsplash.com/photo-1634128221889-82ed6efebfc3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&id=M3wxMjA3fDB8MHxzZWFyY2h8NjZ8fGxlYXJuJTIwd29yZHN8ZW58MHx8MHx8fDA%3D", aiHint: "child laptop learning" },
  { icon: GraduationCap, title: (username?: string | null) => "AI Word Learning", description: "Get smart word suggestions tailored to your reading level.", imageSrc: "https://plus.unsplash.com/premium_photo-1687819872154-9d4fd3cb7cca?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjl8fGxlYXJuJTIwd29yZHN8ZW58MHx8MHx8fDA%3D", aiHint: "AI learning words" },
  { icon: PencilLine, title: (username?: string | null) => "Spelling Practice", description: "Master words with interactive spelling exercises.", imageSrc: "https://images.unsplash.com/photo-1740479049022-5bc6d96cfc73?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHNwZWxsJTIwd29yZHN8ZW58MHx8MHx8fDA%3D", aiHint: "spell words keyboard" },
  { icon: Target, title: (username?: string | null) => "Word Identification", description: "Fun games to test your word recognition skills.", imageSrc: "https://images.unsplash.com/photo-1653276055789-26fdc328680f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTR8fGxlYXJuJTIwd29yZHN8ZW58MHx8MHx8fDA%3D", aiHint: "word identification game" },
  { icon: BookOpen, title: (username?: string | null) => "AI Reading Passages", description: "Read engaging stories created with your learned words.", imageSrc: "https://images.unsplash.com/photo-1604342162684-0cb7869cc445?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzl8fGxlYXJuJTIwd29yZHN8ZW58MHx8MHx8fDA%3D", aiHint: "reading adventure child" },
  { icon: Brain, title: (username?: string | null) => "AI Word Games", description: "Play fun Fill-in-the-Blank and Definition Match games powered by AI.", imageSrc: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YWl8ZW58MHx8MHx8fDA%3D", aiHint: "AI games abstract" },
  { icon: Sigma, title: (username?: string | null) => "Math Zone", description: "Explore numbers with fun arithmetic and AI-powered problems.", imageSrc: "https://images.unsplash.com/photo-1634128221889-82ed6efebfc3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDd8fGNoaWxkcmVuJTIwbWF0aGVtYXRpY3N8ZW58MHx8MHx8fDA%3D", aiHint: "math game" },
  { icon: BarChartHorizontal, title: (username?: string | null) => "Track Your Progress", description: "See your learning journey on your personal profile.", imageSrc: "https://images.unsplash.com/photo-1731877818770-820faabe2d4c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTIyfHxhcHAlMjBiYWNrZ3JvdW5kc3xlbnwwfHwwfHx8MA%3D%3D", aiHint: "abstract pattern profile" },
  { icon: Palette, title: (username?: string | null) => "Customize Your App", description: "Adjust themes, fonts, and audio settings.", imageSrc: "https://images.unsplash.com/photo-1690743300330-d190ad8f97dc?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTE1fHxhcHAlMjBiYWNrZ3JvdW5kc3xlbnwwfHwwfHx8MA%3D%3D", aiHint: "app background settings" },
  { icon: Map, title: (username?: string | null) => "Interactive Guides", description: "Easy-to-follow tutorials and walkthroughs.", imageSrc: "https://plus.unsplash.com/premium_photo-1722156533662-f58d3e13c07c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjV8fGFwcCUyMHdhbGslMjB0aHJvdWdofGVufDB8fDB8fHww", aiHint: "app walkthrough guide" },
];

const AUTOPLAY_INTERVAL = 7000; // Increased interval for more reading time

export default function IntroductionPage() {
  const router = useRouter();
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [isAutoplayActive, setIsAutoplayActive] = useState(true);
  const autoplayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { soundEffectsEnabled } = useAppSettingsStore();
  const { username } = useUserProfileStore();
  const { toast } = useToast();
  
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  const handleSpeechEnd = useCallback(() => {
    setIsAudioPlaying(false);
    setIsAudioPaused(false);
    setCurrentUtterance(null);
  }, []);

  const handleSpeechError = useCallback((event: SpeechSynthesisErrorEvent) => {
    if (event.error !== 'interrupted' && event.error !== 'canceled') {
      console.error("Intro speech error:", event.error);
      toast({ variant: "destructive", title: <div className="flex items-center gap-2"><XCircle className="h-5 w-5" />Audio Error</div>, description: "Could not play welcome audio." });
      if (soundEffectsEnabled) playErrorSound();
    }
    handleSpeechEnd();
  }, [toast, handleSpeechEnd, soundEffectsEnabled]);

  const stopCurrentSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    handleSpeechEnd();
  }, [handleSpeechEnd]);

  const playIntroAudio = useCallback(() => {
    if (!soundEffectsEnabled || typeof window === 'undefined' || !window.speechSynthesis) {
      if(soundEffectsEnabled && isMounted) toast({ variant: "info", title: "Audio Disabled", description: "Speech synthesis not available or sound is off." });
      return;
    }
    const synth = window.speechSynthesis;
    if (currentUtterance && synth.speaking) {
      if (!synth.paused) { synth.pause(); setIsAudioPaused(true); setIsAudioPlaying(false); }
      else { synth.resume(); setIsAudioPaused(false); setIsAudioPlaying(true); }
    } else {
      stopCurrentSpeech();
      const titleText = `Welcome to ChillLearn${username ? `, ${username}` : ''}!`;
      const descriptionText = "Discover a fun and interactive way to learn. Let's explore what you can do!";
      const fullText = `${titleText} ${descriptionText}`;
      const newUtterance = speakText(fullText, undefined, handleSpeechEnd, handleSpeechError);
      if (newUtterance) {
        setCurrentUtterance(newUtterance);
        setIsAudioPlaying(true);
        setIsAudioPaused(false);
      } else {
        handleSpeechEnd();
      }
    }
  }, [soundEffectsEnabled, username, currentUtterance, handleSpeechEnd, handleSpeechError, stopCurrentSpeech, toast, isMounted]);

  useEffect(() => {
    setIsMounted(true);
    const introSeen = getHasSeenIntroduction();
    const personalizationDone = getHasCompletedPersonalization();

    if (introSeen && personalizationDone) {
        // Only redirect to home if ALL onboarding (intro + personalization) is complete
        router.replace('/');
    }
    // Auto-play logic for audio is now handled by feature card change effect
  }, [router]);

  useEffect(() => {
    return () => {
      stopCurrentSpeech();
      if (autoplayIntervalRef.current) {
        clearInterval(autoplayIntervalRef.current);
      }
    };
  }, [stopCurrentSpeech]);

  const completeIntroduction = useCallback(() => {
    stopCurrentSpeech();
    setHasSeenIntroduction(true);
    playNotificationSound();
    router.push('/select-theme'); 
  },[router, stopCurrentSpeech]);

  const selectFeature = useCallback((newIndex: number, manualInteraction: boolean = true) => {
    if (manualInteraction) {
      setIsAutoplayActive(false); 
      if (newIndex !== currentFeatureIndex && soundEffectsEnabled) { 
        playNotificationSound();
      }
    }
    let targetIndex = newIndex;
    if (targetIndex >= features.length) targetIndex = 0; 
    else if (targetIndex < 0) targetIndex = features.length - 1; 
    
    if (targetIndex !== currentFeatureIndex) {
      setCurrentFeatureIndex(targetIndex);
    }
  }, [currentFeatureIndex, soundEffectsEnabled]); 

  useEffect(() => {
    const stopAutoplay = () => {
      if (autoplayIntervalRef.current) {
        clearInterval(autoplayIntervalRef.current);
        autoplayIntervalRef.current = null;
      }
    };

    if (isAutoplayActive && isMounted) {
      stopAutoplay(); 
      autoplayIntervalRef.current = setInterval(() => {
        setCurrentFeatureIndex(prevIndex => (prevIndex + 1) % features.length);
      }, AUTOPLAY_INTERVAL);
    } else {
      stopAutoplay();
    }
    return () => stopAutoplay();
  }, [isAutoplayActive, isMounted]);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEndX(null); 
    setTouchStartX(e.targetTouches[0].clientX);
    setIsAutoplayActive(false); 
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) selectFeature((currentFeatureIndex + 1) % features.length, true);
    else if (isRightSwipe) selectFeature((currentFeatureIndex - 1 + features.length) % features.length, true);
    setTouchStartX(null);
    setTouchEndX(null);
  };

  useEffect(() => {
    if (isMounted && soundEffectsEnabled && currentFeatureIndex === 0 && !currentUtterance) { // Play for first card on mount
      setTimeout(() => {
        if (!currentUtterance && !(window.speechSynthesis?.speaking)) playIntroAudio();
      }, 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, soundEffectsEnabled]); // Only on initial mount for first card

  if (!isMounted) {
      return <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5 flex items-center justify-center"><Sparkles className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  const currentFeature = features[currentFeatureIndex];
  const FeatureIcon = currentFeature.icon;

  const getButtonIcon = () => {
    if (isAudioPlaying) return <Pause className="h-6 w-6 sm:h-7 sm:w-7" />;
    if (isAudioPaused) return <PlayIcon className="h-6 w-6 sm:h-7 sm:w-7" />;
    return <Volume2 className="h-6 w-6 sm:h-7 sm:w-7" />;
  };
  const getAriaLabelForAudioButton = () => {
    if (isAudioPlaying) return "Pause welcome message";
    if (isAudioPaused) return "Resume welcome message";
    return "Play welcome message";
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5 text-foreground flex flex-col items-center justify-center p-4 sm:p-6">
      <main className="container mx-auto max-w-2xl text-center space-y-8 md:space-y-10 my-auto flex-grow flex flex-col justify-center">
        
        <div className="animate-in fade-in-0 slide-in-from-top-10 duration-700 delay-100">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-primary opacity-90" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gradient-primary-accent">
              Welcome to ChillLearn{username ? `, ${username}` : '!'}
            </h1>
             {soundEffectsEnabled && (
              <Button onClick={playIntroAudio} variant="ghost" size="icon" className="text-primary hover:bg-primary/10 rounded-full h-10 w-10 sm:h-12 sm:w-12" aria-label={getAriaLabelForAudioButton()}>
                {getButtonIcon()}
              </Button>
            )}
          </div>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
            Discover a fun and interactive way to learn. Let's explore what you can do!
          </p>
        </div>

        <section 
          className="relative animate-in fade-in-0 slide-in-from-bottom-10 duration-700 delay-200 w-full"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="overflow-hidden relative h-[400px] sm:h-[480px] md:h-[550px] select-none cursor-grab active:cursor-grabbing"> 
            {features.map((feature, index) => (
              <div
                key={feature.title(username)}
                className={cn(
                  "absolute inset-0 transition-all duration-500 ease-out transform flex justify-center items-center p-1",
                  index === currentFeatureIndex ? "opacity-100 translate-x-0" : "opacity-0",
                  index < currentFeatureIndex ? "-translate-x-full" : "",
                  index > currentFeatureIndex ? "translate-x-full" : ""
                )}
                aria-hidden={index !== currentFeatureIndex}
              >
                <Card className="w-full h-full shadow-xl border-border/20 rounded-xl overflow-hidden group">
                  <div className="relative w-full h-full">
                    <Image
                      src={feature.imageSrc}
                      alt={feature.title(username)}
                      fill
                      style={{objectFit:"cover"}}
                      className="transition-transform duration-300 ease-in-out group-hover:scale-105"
                      data-ai-hint={feature.aiHint}
                      priority={index === 0} 
                      sizes="(max-width: 640px) 90vw, (max-width: 768px) 80vw, 600px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent flex flex-col items-center justify-center text-center p-4 sm:p-6">
                      <feature.icon className="h-8 w-8 sm:h-10 sm:w-10 mb-2 sm:mb-3 text-white drop-shadow-md" />
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
                        {feature.title(username)}
                      </h2>
                      <p className="text-sm sm:text-base md:text-lg text-gray-100 leading-relaxed line-clamp-2 sm:line-clamp-3 max-w-md">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center mt-6 space-x-2.5" role="tablist" aria-label="Features navigation">
            {features.map((_, index) => (
              <button
                key={`dot-${index}`}
                onClick={() => selectFeature(index, true)}
                className={cn(
                  "h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  currentFeatureIndex === index ? "bg-primary scale-125 shadow-lg" : "bg-muted hover:bg-muted-foreground/50"
                )}
                aria-label={`Go to feature ${index + 1}: ${features[index].title(username)}`}
                aria-selected={currentFeatureIndex === index}
                role="tab"
              />
            ))}
          </div>
        </section>

        <div className="animate-in fade-in-0 slide-in-from-bottom-10 duration-700 delay-[400ms] pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={completeIntroduction}
            className="px-8 py-5 text-lg sm:text-xl font-semibold btn-glow shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ease-in-out w-full sm:w-auto"
            aria-label="Get started with ChillLearn AI"
          >
            Let's Get Started! <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={completeIntroduction} // Both buttons now lead to the same next step
            className="px-8 py-5 text-lg sm:text-xl font-medium w-full sm:w-auto hover:bg-primary/10 hover:text-primary transition-colors duration-200"
            aria-label="Skip introduction and go to app"
          >
             <SkipForward className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Skip to App
          </Button>
        </div>
      </main>
       <footer className="text-center text-xs text-muted-foreground py-4">
         © {new Date().getFullYear()} ChillLearn AI. An AI-Powered Learning Adventure.
      </footer>
    </div>
  );
}

    