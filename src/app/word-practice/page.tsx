
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Edit3, Target, BookMarked, FileType2 as TextSelectIcon, GraduationCap, Pencil, BookOpen } from 'lucide-react'; // Updated icons

export default function WordPracticePage() {
  const practiceSections = [
    {
      title: "Learn New Words",
      description: "Discover new words with AI suggestions tailored to your level. Build your personal practice list.",
      href: "/learn",
      icon: GraduationCap, // Updated icon
      dataAiHint: "child learning alphabet", // Updated hint
    },
    {
      title: "Spelling Practice",
      description: "Sharpen your spelling skills. Practice words from your list and master them one by one.",
      href: "/spell",
      icon: Pencil, // Updated icon
      dataAiHint: "child writing letters", // Updated hint
    },
    {
      title: "Identify Words",
      description: "Test your word recognition! Listen and choose the correct word in a fun, interactive game.",
      href: "/identify",
      icon: Target,
      dataAiHint: "child pointing word", // Updated hint
    },
    {
      title: "Reading Adventures",
      description: "Dive into AI-generated stories featuring your practice words. Read or listen along!",
      href: "/read",
      icon: BookOpen, // Updated icon
      dataAiHint: "storybook open fantasy", // Updated hint
    },
  ];

  return (
    <div className="space-y-8">
      <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-full max-w-md mx-auto h-48 md:h-64 rounded-lg overflow-hidden shadow-lg">
          <Image 
            src="https://picsum.photos/seed/word-practice-banner/600/400" 
            alt="Children interacting with colorful letters and books"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="children letters books" // Updated hint
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex flex-col items-center justify-center p-4">
            <TextSelectIcon className="h-16 w-16 text-primary drop-shadow-lg animate-in fade-in zoom-in-50 duration-1000 delay-200" aria-hidden="true" />
            <h1 className="text-4xl font-bold text-gradient-primary-accent mt-2">Word Practice Zone</h1>
            <p className="text-lg text-foreground/90 drop-shadow-sm">Master words through various activities.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {practiceSections.map((section, index) => (
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
                  Go to {section.title}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

