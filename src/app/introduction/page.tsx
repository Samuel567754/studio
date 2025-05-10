
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { setHasSeenIntroduction } from '@/lib/storage';
import { BookOpenText, Lightbulb, Edit3, Target, BookMarked, Sigma, User, SettingsIcon, HelpCircle, Sparkles, ArrowRight, HomeIcon } from 'lucide-react';
import { playNotificationSound } from '@/lib/audio';
import { cn } from '@/lib/utils';

const features = [
  { icon: HomeIcon, title: "Homepage Hub", description: "Your central dashboard for accessing all learning activities.", imageSrc: "https://picsum.photos/seed/homepage/300/200", aiHint: "dashboard home screen" },
  { icon: Lightbulb, title: "AI Word Learning", description: "Get smart word suggestions tailored to your reading level.", imageSrc: "https://picsum.photos/seed/ai-learn/300/200", aiHint: "AI brain lightbulb" },
  { icon: Edit3, title: "Spelling Practice", description: "Master words with interactive spelling exercises.", imageSrc: "https://picsum.photos/seed/spelling/300/200", aiHint: "pencil letters blocks" },
  { icon: Target, title: "Word Identification", description: "Fun games to test your word recognition skills.", imageSrc: "https://picsum.photos/seed/identify-game/300/200", aiHint: "target word game" },
  { icon: BookMarked, title: "AI Reading Passages", description: "Read engaging stories created with your learned words.", imageSrc: "https://picsum.photos/seed/ai-read/300/200", aiHint: "AI book story" },
  { icon: Sigma, title: "Math Zone", description: "Explore numbers with fun arithmetic and times table games.", imageSrc: "https://picsum.photos/seed/math-fun/300/200", aiHint: "math symbols numbers" },
  { icon: User, title: "Track Your Progress", description: "See your learning journey on your personal profile.", imageSrc: "https://picsum.photos/seed/progress-track/300/200", aiHint: "chart graph progress" },
  { icon: SettingsIcon, title: "Customize Your App", description: "Adjust themes, fonts, and audio settings.", imageSrc: "https://picsum.photos/seed/customize/300/200", aiHint: "settings gear customize" },
  { icon: HelpCircle, title: "Interactive Guides", description: "Easy-to-follow tutorials and walkthroughs.", imageSrc: "https://picsum.photos/seed/guides/300/200", aiHint: "guide help map" },
];

export default function IntroductionPage() {
  const router = useRouter();
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  const handleGetStarted = () => {
    setHasSeenIntroduction(true);
    playNotificationSound();
    router.push('/'); // Navigate directly to homepage
  };

  const nextFeature = () => {
    playNotificationSound();
    setCurrentFeatureIndex((prevIndex) => (prevIndex + 1) % features.length);
  };

  const prevFeature = () => {
    playNotificationSound();
    setCurrentFeatureIndex((prevIndex) => (prevIndex - 1 + features.length) % features.length);
  };

  const currentFeature = features[currentFeatureIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 text-foreground flex flex-col items-center justify-center p-4 sm:p-8">
      <main className="container mx-auto max-w-xl text-center space-y-8 md:space-y-12 my-8">
        <header className="space-y-4 animate-in fade-in-0 zoom-in-75 duration-700 ease-out">
          <BookOpenText className="mx-auto h-20 w-20 md:h-28 md:w-28 text-primary drop-shadow-lg" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            Welcome to <span className="text-gradient-primary-accent">ChillLearn AI</span>!
          </h1>
          <p className="text-md sm:text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
            Swipe through to see what you can do, then let's begin your learning adventure!
          </p>
        </header>

        <section className="relative animate-in fade-in-0 slide-in-from-bottom-10 duration-700 delay-200 w-full">
          <div className="overflow-hidden relative h-[420px] sm:h-[450px] md:h-[480px]">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={cn(
                  "absolute inset-0 transition-all duration-500 ease-in-out transform flex justify-center items-center",
                  index === currentFeatureIndex ? "opacity-100 translate-x-0" : "opacity-0",
                  index < currentFeatureIndex ? "-translate-x-full" : "",
                  index > currentFeatureIndex ? "translate-x-full" : ""
                )}
              >
                <Card className="w-full max-w-sm bg-card/80 backdrop-blur-sm shadow-xl border border-border/30 transform hover:shadow-2xl transition-all duration-300 ease-in-out hover:scale-[1.02]">
                  <CardHeader className="p-4">
                    <div className="relative w-full h-40 sm:h-48 rounded-lg overflow-hidden mb-3">
                      <Image
                        src={feature.imageSrc}
                        alt={feature.title}
                        fill
                        style={{objectFit:"cover"}}
                        className="rounded-lg"
                        data-ai-hint={feature.aiHint}
                      />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                       <feature.icon className="absolute bottom-3 left-3 h-8 w-8 text-white drop-shadow-md" />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl font-semibold text-primary flex items-center">
                       {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed min-h-[60px] sm:min-h-[70px]">{feature.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {features.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={prevFeature}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/50 hover:bg-background/80 shadow-md h-10 w-10 sm:h-12 sm:w-12"
                aria-label="Previous feature"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextFeature}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/50 hover:bg-background/80 shadow-md h-10 w-10 sm:h-12 sm:w-12"
                aria-label="Next feature"
              >
                <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </>
          )}
          
          <div className="flex justify-center mt-4 space-x-2">
            {features.map((_, index) => (
              <button
                key={`dot-${index}`}
                onClick={() => { playNotificationSound(); setCurrentFeatureIndex(index); }}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-all duration-300 ease-in-out",
                  currentFeatureIndex === index ? "bg-primary scale-125" : "bg-muted hover:bg-muted-foreground/50"
                )}
                aria-label={`Go to feature ${index + 1}: ${features[index].title}`}
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
