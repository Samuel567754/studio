
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpenText, Lightbulb, Edit3, Target, BookMarked, Sigma, Sparkles } from 'lucide-react';

const mainSections = [
  {
    title: "Learn New Words",
    description: "Discover new words with AI suggestions tailored to your level. Build your personal practice list.",
    href: "/learn",
    icon: Lightbulb,
    imageSrc: "https://picsum.photos/seed/learn/600/400",
    imageAlt: "Child with a bright lightbulb over their head",
    aiHint: "child idea lightbulb",
    color: "text-primary",
    bgFrom: "from-primary/10",
    bgTo: "to-primary/5",
  },
  {
    title: "Spelling Practice",
    description: "Sharpen your spelling skills. Practice words from your list and master them one by one.",
    href: "/spell",
    icon: Edit3,
    imageSrc: "https://picsum.photos/seed/spell/600/400",
    imageAlt: "Pencils and letter blocks",
    aiHint: "pencil letters",
    color: "text-accent",
    bgFrom: "from-accent/10",
    bgTo: "to-accent/5",
  },
  {
    title: "Identify Words",
    description: "Test your word recognition! Listen and choose the correct word in a fun, interactive game.",
    href: "/identify",
    icon: Target,
    imageSrc: "https://picsum.photos/seed/identify/600/400",
    imageAlt: "Magnifying glass over a word",
    aiHint: "magnifying glass word",
    color: "text-green-500",
    bgFrom: "from-green-500/10",
    bgTo: "to-green-500/5",
  },
  {
    title: "Reading Adventures",
    description: "Dive into AI-generated stories featuring your practice words. Read or listen along!",
    href: "/read",
    icon: BookMarked,
    imageSrc: "https://picsum.photos/seed/read/600/400",
    imageAlt: "Open storybook with fantastical elements",
    aiHint: "storybook adventure",
    color: "text-blue-500",
    bgFrom: "from-blue-500/10",
    bgTo: "to-blue-500/5",
  },
  {
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
            <Lightbulb className="h-20 w-20 text-primary" />
        </div>

        <div className="relative z-10 container mx-auto px-4">
          <BookOpenText className="mx-auto h-20 w-20 md:h-24 md:w-24 text-primary mb-6 animate-in fade-in-0 zoom-in-50 duration-700 ease-out" />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Welcome to <span className="text-gradient-primary-accent">ChillLearn AI</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 delay-200">
            Your fun and interactive partner for mastering words, practicing spelling, enjoying AI-powered reading, and exploring the world of math!
          </p>
          <Button asChild size="lg" className="btn-glow text-lg animate-in fade-in-0 zoom-in-75 duration-500 delay-400">
            <Link href="/learn">
              Start Learning Words <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {mainSections.map((section, index) => (
          <Card 
            key={section.title} 
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
