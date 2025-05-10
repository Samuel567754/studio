
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { setHasSeenIntroduction } from '@/lib/storage';
import { BookOpenText, Lightbulb, Edit3, Target, BookMarked, Sigma, User, SettingsIcon, HelpCircle, Sparkles, ArrowRight, HomeIcon } from 'lucide-react';
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
  
  const handleGetStarted = () => {
    setHasSeenIntroduction(true);
    playNotificationSound();
    router.push('/'); 
  };

  const selectFeature = useCallback((index: number) => {
    playNotificationSound();
    setCurrentFeatureIndex(index);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 text-foreground flex flex-col items-center justify-center p-4 sm:p-6">
      <main className="container mx-auto max-w-2xl text-center space-y-6 md:space-y-10 my-6">
        <div className="animate-in fade-in-0 zoom-in-75 duration-700 ease-out">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gradient-primary-accent">
                Welcome to ChillLearn AI
            </h1>
            <p className="text-md sm:text-lg md:text-xl text-muted-foreground mt-2">
                Explore key features by tapping the dots below.
            </p>
        </div>

        <section className="relative animate-in fade-in-0 slide-in-from-bottom-10 duration-700 delay-200 w-full">
          {/* Increased height for larger cards */}
          <div className="overflow-hidden relative h-[400px] sm:h-[480px] md:h-[550px]"> 
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={cn(
                  "absolute inset-0 transition-all duration-500 ease-in-out transform flex justify-center items-center p-1", // Added padding for card spacing effect
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
                      sizes="(max-width: 640px) 90vw, (max-width: 768px) 80vw, 600px" // Added sizes for optimization
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                      <div className="flex items-center mb-2 sm:mb-3">
                        <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-white drop-shadow-md" />
                        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">
                          {feature.title}
                        </h2>
                      </div>
                      <p className="text-xs sm:text-sm md:text-base text-gray-200 leading-relaxed line-clamp-2 sm:line-clamp-3">
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
                  currentFeatureIndex === index ? "bg-primary scale-125" : "bg-muted hover:bg-muted-foreground/50"
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
       <footer className="text-center text-xs text-muted-foreground py-4 mt-auto">
         © {new Date().getFullYear()} ChillLearn App. An AI-Powered Learning Adventure.
      </footer>
    </div>
  );
}

