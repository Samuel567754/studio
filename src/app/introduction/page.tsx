
"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { setHasSeenIntroduction } from '@/lib/storage';
import { BookOpenText, Lightbulb, Edit3, Target, BookMarked, Sigma, User, SettingsIcon, HelpCircle, Sparkles, ArrowRight } from 'lucide-react';
import { playNotificationSound } from '@/lib/audio';

const features = [
  { icon: Lightbulb, title: "AI Word Learning", description: "Get smart word suggestions tailored to your reading level." },
  { icon: Edit3, title: "Spelling Practice", description: "Master words with interactive spelling exercises." },
  { icon: Target, title: "Word Identification", description: "Fun games to test your word recognition skills." },
  { icon: BookMarked, title: "AI Reading Passages", description: "Read engaging stories created with your learned words." },
  { icon: Sigma, title: "Math Zone", description: "Explore numbers with fun arithmetic and times table games." },
  { icon: User, title: "Track Your Progress", description: "See your learning journey on your personal profile." },
  { icon: SettingsIcon, title: "Customize Your App", description: "Adjust themes, fonts, and audio settings." },
  { icon: HelpCircle, title: "Interactive Guides", description: "Easy-to-follow tutorials and walkthroughs." },
];

export default function IntroductionPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    setHasSeenIntroduction(true);
    playNotificationSound();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 text-foreground flex flex-col items-center justify-center p-4 sm:p-8">
      <main className="container mx-auto max-w-4xl text-center space-y-10 md:space-y-16 my-10">
        <header className="space-y-6 animate-in fade-in-0 zoom-in-75 duration-700 ease-out">
          <BookOpenText className="mx-auto h-24 w-24 md:h-32 md:w-32 text-primary drop-shadow-lg" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">
            Welcome to <span className="text-gradient-primary-accent">ChillLearn AI</span>!
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Your friendly AI companion for mastering literacy and numeracy through fun, interactive learning.
          </p>
        </header>

        <section className="animate-in fade-in-0 slide-in-from-bottom-10 duration-700 delay-200">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-8 text-primary flex items-center justify-center">
            <Sparkles className="mr-3 h-7 w-7" />
            Explore What Awaits You
            <Sparkles className="ml-3 h-7 w-7" />
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div 
                key={feature.title} 
                className="bg-card/70 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-border/20 hover:shadow-xl hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center space-y-3 animate-in fade-in-0 zoom-in-90 duration-500"
                style={{ animationDelay: `${200 + index * 100}ms` }}
              >
                <feature.icon className="h-10 w-10 text-accent mb-2" />
                <h3 className="text-lg font-semibold text-card-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="animate-in fade-in-0 slide-in-from-bottom-10 duration-700 delay-[1200ms]">
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="px-10 py-6 text-xl font-semibold btn-glow shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            aria-label="Get started with ChillLearn AI"
          >
            Let's Get Started! <ArrowRight className="ml-3 h-6 w-6" />
          </Button>
        </div>
      </main>
       <footer className="text-center text-xs text-muted-foreground py-4 mt-auto">
         © {new Date().getFullYear()} ChillLearn App. An AI-Powered Learning Adventure.
      </footer>
    </div>
  );
}
