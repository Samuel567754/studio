
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Pencil, Target, BookOpen, FileType2 as TextSelectIcon, Sparkles } from 'lucide-react';

export default function WordPracticePage() {
  const practiceSections = [
    {
      title: "Learn New Words",
      description: "Discover new words with AI suggestions tailored to your level. Build your personal practice list.",
      href: "/learn",
      icon: GraduationCap, 
      imageSrc: "https://plus.unsplash.com/premium_photo-1687819872154-9d4fd3cb7cca?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjl8fGxlYXJuJTIwd29yZHN8ZW58MHx8MHx8fDA%3D",
      dataAiHint: "AI learning words", 
    },
    {
      title: "Spelling Practice",
      description: "Sharpen your spelling skills. Practice words from your list and master them one by one.",
      href: "/spell",
      icon: Pencil, 
      imageSrc: "https://images.unsplash.com/photo-1740479049022-5bc6d96cfc73?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHNwZWxsJTIwd29yZHN8ZW58MHx8MHx8fDA%3D",
      dataAiHint: "spell words keyboard", 
    },
    {
      title: "Identify Words",
      description: "Test your word recognition! Listen and choose the correct word in a fun, interactive game.",
      href: "/identify",
      icon: Target,
      imageSrc: "https://images.unsplash.com/photo-1653276055789-26fdc328680f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTR8fGxlYXJuJTIwd29yZHN8ZW58MHx8MHx8fDA%3D",
      dataAiHint: "word identification game", 
    },
    {
      title: "Standard Reading",
      description: "Dive into AI-generated stories featuring your practice words. Read or listen along!",
      href: "/read",
      icon: BookOpen, 
      imageSrc: "https://images.unsplash.com/photo-1604342162684-0cb7869cc445?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzl8fGxlYXJuJTIwd29yZHN8ZW58MHx8MHx8fDA%3D",
      dataAiHint: "reading adventure child", 
    },
     {
      title: "Fun AI Reading Time!",
      description: "Engage with AI-generated stories in a more playful and interactive way. Perfect for practice!",
      href: "/word-practice/fun-reading",
      icon: Sparkles, 
      imageSrc: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGZ1biUyMHJlYWRpbmd8ZW58MHx8MHx8fDA%3D",
      dataAiHint: "fun reading kids",
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl lg:max-w-5xl mx-auto">
      <header className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <div className="relative w-full max-w-md mx-auto h-48 md:h-64 rounded-lg overflow-hidden shadow-lg">
          <Image 
            src="https://plus.unsplash.com/premium_photo-1683749808835-6f8f186a903e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzN8fHdvcmQlMjBwcmFjdGljZXxlbnwwfHwwfHx8MA%3D%3D" 
            alt="Colorful letters and learning tools for word practice"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
            data-ai-hint="children letters learning" 
          />
          <div className="absolute inset-0 bg-black/60" /> 
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <TextSelectIcon className="h-12 w-12 md:h-16 md:w-16 text-primary drop-shadow-lg animate-in fade-in zoom-in-50 duration-1000 delay-200" aria-hidden="true" />
            <h1 className="text-3xl md:text-4xl font-bold text-gradient-primary-accent mt-2 drop-shadow-md">Word Practice Zone</h1>
            <p className="text-md md:text-lg text-gray-100 drop-shadow-sm mt-1">Master words through various activities.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {practiceSections.map((section, index) => (
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
              <section.icon className="h-8 w-8 text-accent hidden" aria-hidden="true" />
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

