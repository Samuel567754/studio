
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { TouchEvent } from 'react'; // Import TouchEvent for type safety
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { setHasSeenIntroduction } from '@/lib/storage';
import { Lightbulb, Edit3, Target, BookMarked, Sigma, User, SettingsIcon, HelpCircle, Sparkles, ArrowRight, HomeIcon } from 'lucide-react';
import { playNotificationSound } from '@/lib/audio';
import { cn } from '@/lib/utils';

const features = [
  { icon: HomeIcon, title: "Homepage Hub", description: "Your central dashboard for accessing all learning activities.", imageSrc: "https://picsum.photos/seed/homepage/600/400", aiHint: "dashboard home screen" },
  { icon: Lightbulb, title: "AI Word Learning", description: "Get smart word suggestions tailored to your reading level.", imageSrc: "https://picsum.photos/seed/ai-learn/600/400", aiHint: "AI brain lightbulb" },
  { icon: Edit3, title: "Spelling Practice", description: "Master words with interactive spelling exercises.", imageSrc: "https://picsum.photos/seed/spelling/600/400", aiHint: "pencil letters blocks" },
  { icon: Target, title: "Word Identification", description: "Fun games to test your word recognition skills.", imageSrc: "https://picsum.photos/seed/identify-game/600/400", aiHint: "target word game" },
  { icon: BookMarked, title: "AI Reading Passages", description: "Read engaging stories created with your learned words.", imageSrc: "https://picsum.photos/seed/ai-read/600/400", aiHint: "AI book story" },
  { icon: Sigma, title: "Math Zone", description: "Explore numbers with fun arithmetic and times table games.", imageSrc: "https://picsum.photos/seed/math-fun/600/400", aiHint: "math symbols numbers" },
  { icon: User, title: "Track Your Progress", description: "See your learning journey on your personal profile.", imageSrc: "https://picsum.photos/seed/progress-track/600/400", aiHint: "chart graph progress" },
  { icon: SettingsIcon, title: "Customize Your App", description: "Adjust themes, fonts, and audio settings.", imageSrc: "https://picsum.photos/seed/customize/600/400", aiHint: "settings gear customize" },
  { icon: HelpCircle, title: "Interactive Guides", description: "Easy-to-follow tutorials and walkthroughs.", imageSrc: "https://picsum.photos/seed/guides/600/400", aiHint: "guide help map" },
];

export default function IntroductionPage() {
  const router = useRouter();
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const handleGetStarted = () => {
    setHasSeenIntroduction(true);
    playNotificationSound();
    router.push('/'); 
  };

  const selectFeature = useCallback((newIndex: number) => {
    if (newIndex === currentFeatureIndex) return; 

    if (newIndex >= 0 && newIndex < features.length) {
      playNotificationSound();
      setCurrentFeatureIndex(newIndex);
    } else if (newIndex >= features.length) { // Loop to start
        playNotificationSound();
        setCurrentFeatureIndex(0);
    } else if (newIndex < 0) { // Loop to end
        playNotificationSound();
        setCurrentFeatureIndex(features.length - 1);
    }
  }, [currentFeatureIndex]); 

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEndX(null); 
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      selectFeature(currentFeatureIndex + 1);
    } else if (isRightSwipe) {
      selectFeature(currentFeatureIndex - 1);
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5 text-foreground flex flex-col items-center justify-center p-4 sm:p-6">
      <main className="container mx-auto max-w-2xl text-center space-y-8 md:space-y-10 my-auto flex-grow flex flex-col justify-center">
        
        <div className="animate-in fade-in-0 slide-in-from-top-10 duration-700 delay-100">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gradient-primary-accent mb-4 flex items-center justify-center gap-3">
            <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-primary opacity-90" />
            Welcome to ChillLearn AI
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
            Discover a fun and interactive way to learn. Let's explore what you can do!
          </p>
        </div>

        <section className="relative animate-in fade-in-0 slide-in-from-bottom-10 duration-700 delay-200 w-full">
          <div 
            className="overflow-hidden relative h-[400px] sm:h-[480px] md:h-[550px] select-none cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          > 
            {features.map((feature, index) => (
              <div
                key={feature.title}
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
                      alt={feature.title}
                      fill
                      style={{objectFit:"cover"}}
                      className="transition-transform duration-300 ease-in-out group-hover:scale-105"
                      data-ai-hint={feature.aiHint}
                      priority={index === 0} 
                      sizes="(max-width: 640px) 90vw, (max-width: 768px) 80vw, 600px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col items-center justify-center text-center p-4 sm:p-6">
                      <feature.icon className="h-8 w-8 sm:h-10 sm:w-10 mb-2 sm:mb-3 text-white drop-shadow-md" />
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
                        {feature.title}
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
                onClick={() => selectFeature(index)}
                className={cn(
                  "h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  currentFeatureIndex === index ? "bg-primary scale-125 shadow-lg" : "bg-muted hover:bg-muted-foreground/50"
                )}
                aria-label={`Go to feature ${index + 1}: ${features[index].title}`}
                aria-selected={currentFeatureIndex === index}
                role="tab"
              />
            ))}
          </div>
        </section>

        <div className="animate-in fade-in-0 slide-in-from-bottom-10 duration-700 delay-[400ms] pt-4">
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="px-8 py-5 text-lg sm:text-xl font-semibold btn-glow shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ease-in-out"
            aria-label="Get started with ChillLearn AI"
          >
            Let's Get Started! <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>
      </main>
       <footer className="text-center text-xs text-muted-foreground py-4">
         © {new Date().getFullYear()} ChillLearn AI. An AI-Powered Learning Adventure.
      </footer>
    </div>
  );
}

