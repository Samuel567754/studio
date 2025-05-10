
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpenText, Sigma, Sparkles, Puzzle, TextSelect } from 'lucide-react';

const mainSections = [
  {
    key: "word-practice",
    title: "Word Practice Zone",
    description: "Learn new words, practice spelling, identify words by ear, and read AI-generated stories.",
    href: "/word-practice",
    icon: TextSelect,
    imageSrc: "https://picsum.photos/seed/word-practice/600/400",
    imageAlt: "Collection of learning tools for words",
    aiHint: "letters books pen",
    color: "text-primary",
    bgFrom: "from-primary/10",
    bgTo: "to-primary/5",
  },
   {
    key: "ai-games",
    title: "AI Word Games",
    description: "Challenge yourself with interactive AI-powered word games like Fill-in-the-Blank and Definition Match.",
    href: "/ai-games",
    icon: Puzzle, 
    imageSrc: "https://picsum.photos/seed/ai-word-games/600/400",
    imageAlt: "Child playing an interactive word game on a tablet",
    aiHint: "child tablet game",
    color: "text-orange-500", 
    bgFrom: "from-orange-500/10",
    bgTo: "to-orange-500/5",
  },
  {
    key: "math",
    title: "Math Zone",
    description: "Explore a world of numbers with engaging arithmetic games, times tables, AI word problems, and more.",
    href: "/math",
    icon: Sigma,
    imageSrc: "https://picsum.photos/seed/math/600/400",
    imageAlt: "Colorful numbers and math symbols",
    aiHint: "numbers math symbols",
    color: "text-purple-500",
    bgFrom: "from-purple-500/10",
    bgTo: "to-purple-500/5",
  },
];

export default function OfficialHomePage() {
  return (
    <div className="space-y-12">
      <header className="relative text-center py-16 md:py-24 rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 shadow-inner border border-border/10">
        <div 
            className="absolute inset-0 opacity-10 dark:opacity-5 bg-repeat" 
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
            aria-hidden="true"
        ></div>
         <div className="absolute top-8 left-10 transform -rotate-12 opacity-20 dark:opacity-10">
            <Sparkles className="h-16 w-16 text-accent" />
        </div>
        <div className="absolute bottom-12 right-16 transform rotate-6 opacity-20 dark:opacity-10">
            <TextSelect className="h-20 w-20 text-primary" />
        </div>

        <div className="relative z-10 container mx-auto px-4">
          <BookOpenText className="mx-auto h-20 w-20 md:h-24 md:w-24 text-primary mb-6 animate-in fade-in-0 zoom-in-50 duration-700 ease-out" />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Welcome to <span className="text-gradient-primary-accent">ChillLearn</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 delay-200">
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
            className={`overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 bg-gradient-to-br ${section.bgFrom} ${section.bgTo} animate-in fade-in-0 slide-in-from-bottom-5 duration-500`}
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

      <section className="text-center py-12 animate-in fade-in-0 delay-500 duration-500">
         <Card className="max-w-2xl mx-auto p-6 md:p-8 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-semibold text-gradient-primary-accent">Ready to Explore More?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-lg text-muted-foreground">
                    Check out your <Link href="/profile" className="text-primary hover:underline font-medium">Profile</Link> to see your progress,
                    visit the <Link href="/tutorial" className="text-accent hover:underline font-medium">Tutorial</Link> for a detailed guide,
                    or customize your experience in <Link href="/settings" className="text-green-500 hover:underline font-medium">Settings</Link>.
                </p>
                <Button size="lg" variant="secondary" asChild>
                    <Link href="/tutorial">
                        <Sparkles className="mr-2 h-5 w-5" /> View Full Guide
                    </Link>
                </Button>
            </CardContent>
         </Card>
      </section>
    </div>
  );
}
