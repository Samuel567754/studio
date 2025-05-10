
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Puzzle, Edit, BookOpenCheck, TextSelect } from 'lucide-react'; // Added BookOpenCheck

export default function AiGamesPage() {
  const gameSections = [
    {
      title: "Fill in the Blank",
      description: "Read a sentence and choose the word that best fits the blank. Tests vocabulary in context!",
      href: "/ai-games/fill-blank",
      icon: Edit,
      dataAiHint: "pencil writing sentence",
    },
    {
      title: "Word Definition Match",
      description: "Match words to their correct AI-generated definitions. Boost your understanding!",
      href: "/ai-games/definition-match",
      icon: BookOpenCheck, 
      dataAiHint: "dictionary book definition",
    },
    // Add more AI games here in the future
  ];

  return (
    <div className="space-y-8">
      <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-full max-w-md mx-auto h-48 md:h-64 rounded-lg overflow-hidden shadow-lg">
          <Image 
            src="https://picsum.photos/seed/ai-games-hub/600/400" 
            alt="Abstract representation of AI and games"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="AI brain game"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex flex-col items-center justify-center p-4">
            <Puzzle className="h-16 w-16 text-primary drop-shadow-lg animate-in fade-in zoom-in-50 duration-1000 delay-200" aria-hidden="true" />
            <h1 className="text-4xl font-bold text-gradient-primary-accent mt-2">AI Word Games</h1>
            <p className="text-lg text-foreground/90 drop-shadow-sm">Engage with fun, AI-powered word challenges!</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gameSections.map((section, index) => (
          <Card 
            key={section.title} 
            className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out"
            style={{ animationDelay: `${100 + index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
              <section.icon className="h-10 w-10 text-accent" aria-hidden="true" />
              <div className="flex-1">
                <CardTitle className="text-2xl font-semibold text-primary">{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="text-base text-foreground/80 min-h-[40px]">
                {section.description}
              </CardDescription>
              <Button asChild className="w-full btn-glow">
                <Link href={section.href}>
                  Play {section.title}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
         {gameSections.length === 0 && (
            <Card className="md:col-span-2 shadow-lg animate-in fade-in-0 duration-500">
                <CardHeader>
                    <CardTitle className="text-center text-primary">More Games Coming Soon!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground">Check back later for new AI-powered word adventures.</p>
                     <div className="flex justify-center mt-4">
                        <TextSelect className="h-12 w-12 text-accent/50" />
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
