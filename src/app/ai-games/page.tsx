
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Puzzle, Brain, Edit, BookOpenCheck } from 'lucide-react';

export default function AiGamesPage() {
  const gameSections = [
    {
      title: "Fill in the Blank",
      description: "Read a sentence and choose the word that best fits the blank. Tests vocabulary in context!",
      href: "/ai-games/fill-blank",
      icon: Edit,
      imageSrc: "https://plus.unsplash.com/premium_photo-1682756540097-6a887bbcf9b0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjl8fGFpfGVufDB8fDB8fHww",
      dataAiHint: "AI sentence puzzle", 
    },
    {
      title: "Word Definition Match",
      description: "Match words to their correct AI-generated definitions. Boost your understanding!",
      href: "/ai-games/definition-match",
      icon: BookOpenCheck, 
      imageSrc: "https://plus.unsplash.com/premium_photo-1725907643701-9ba38affe7bb?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nzd8fGFpfGVufDB8fDB8fHww",
      dataAiHint: "AI definition match", 
    },
    // Add more AI games here in the future
  ];

  return (
    <div className="space-y-8 max-w-4xl lg:max-w-5xl mx-auto">
      <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-full max-w-md mx-auto h-48 md:h-64 rounded-lg overflow-hidden shadow-lg">
          <Image 
            src="https://images.unsplash.com/photo-1674027444485-cec3da58eef4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8YWl8ZW58MHx8MHx8fDA%3D" 
            alt="AI powered word games concept with abstract neural network and letters"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="AI games abstract" 
          />
          <div className="absolute inset-0 bg-black/60" /> {/* Dark overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <Puzzle className="h-12 w-12 md:h-16 md:w-16 text-primary drop-shadow-lg animate-in fade-in zoom-in-50 duration-1000 delay-200" aria-hidden="true" />
            <h1 className="text-3xl md:text-4xl font-bold text-gradient-primary-accent mt-2 drop-shadow-md">AI Word Games</h1>
            <p className="text-md md:text-lg text-gray-100 drop-shadow-sm mt-1">Engage with fun, AI-powered word challenges!</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gameSections.map((section, index) => (
          <Card 
            key={section.title} 
            className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out overflow-hidden group"
            style={{ animationDelay: `${100 + index * 100}ms` }}
          >
            <div className="relative h-48 w-full">
               <Image
                src={section.imageSrc}
                alt={section.title}
                layout="fill"
                objectFit="cover"
                className="opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 ease-in-out"
                data-ai-hint={section.dataAiHint}
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                 <section.icon className="h-16 w-16 text-white/80 opacity-80 drop-shadow-lg" />
              </div>
            </div>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2 pt-4">
              <section.icon className="h-8 w-8 text-accent hidden" aria-hidden="true" /> {/* Icon hidden here, shown on image */}
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
                        <Brain className="h-12 w-12 text-accent/50" /> 
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}

