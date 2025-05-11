
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpenText, Sigma, Sparkles, Puzzle, FileType2 as TextSelectIcon } from 'lucide-react';

const mainSections = [
  {
    key: "word-practice",
    title: "Word Practice Zone",
    description: "Learn new words, practice spelling, identify words by ear, and read AI-generated stories.",
    href: "/word-practice",
    icon: TextSelectIcon,
    imageSrc: "https://plus.unsplash.com/premium_photo-1687819872154-9d4fd3cb7cca?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjl8fGxlYXJuJTIwd29yZHN8ZW58MHx8MHx8fDA%3D",
    imageAlt: "Child learning words with AI assistance",
    aiHint: "AI learning words",
    color: "text-primary",
  },
   {
    key: "ai-games",
    title: "AI Word Games",
    description: "Challenge yourself with interactive AI-powered word games like Fill-in-the-Blank and Definition Match.",
    href: "/ai-games",
    icon: Puzzle, 
    imageSrc: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YWl8ZW58MHx8MHx8fDA%3D",
    imageAlt: "Abstract AI patterns representing word games",
    aiHint: "AI games abstract",
    color: "text-orange-500", 
  },
  {
    key: "math",
    title: "Math Zone",
    description: "Explore a world of numbers with engaging arithmetic games, times tables, AI word problems, and more.",
    href: "/math",
    icon: Sigma,
    imageSrc: "https://images.unsplash.com/photo-1718306201865-cae4a08311fe?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzR8fGNoaWxkcmVuJTIwbWF0aGVtYXRpY3MlMjBiYWNrZ3JvdW5kfGVufDB8fDB8fHww",
    imageAlt: "Colorful math background with numbers and symbols",
    aiHint: "math background",
    color: "text-purple-500",
  },
];

export default function OfficialHomePage() {
  return (
    <div className="space-y-12">
      <header className="relative text-center rounded-xl overflow-hidden shadow-2xl h-[calc(100vh-200px)] min-h-[400px] md:min-h-[500px] lg:min-h-[600px] flex flex-col justify-center items-center mt-8">
        <Image
          src="https://plus.unsplash.com/premium_photo-1722156533656-b22cbcf1c82e?w=1200&h=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzd8fGxlYXJuaW5nJTIwYXBwfGVufDB8fDB8fHww"
          alt="Children interacting with colorful letters and learning tools"
          layout="fill"
          objectFit="cover"
          className="brightness-50" 
          data-ai-hint="learning app children"
          priority
        />
        <div className="absolute inset-0 bg-black/60" /> 
        <div className="relative z-10 container mx-auto px-4 py-10 text-white">
          <BookOpenText className="mx-auto h-16 w-16 md:h-20 md:w-20 text-white mb-4 animate-in fade-in-0 zoom-in-50 duration-700 ease-out" />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Welcome to <span className="text-gradient-primary-accent">ChillLearn</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-10 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 delay-200">
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
            className={`overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 bg-card animate-in fade-in-0 slide-in-from-bottom-5 duration-500`}
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

      <section className="relative text-center py-16 md:py-24 animate-in fade-in-0 delay-500 duration-500 rounded-xl overflow-hidden shadow-2xl">
         <Image
            src="https://plus.unsplash.com/premium_photo-1722156533662-f58d3e13c07c?w=1200&h=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjV8fGFwcCUyMHdhbGslMjB0aHJvdWdofGVufDB8fDB8fHww"
            alt="Abstract background with subtle learning motifs and app walkthrough guide visuals"
            layout="fill"
            objectFit="cover"
            className="brightness-50"
            data-ai-hint="learning abstract walkthrough"
         />
         <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
         <div className="relative z-10 container mx-auto px-4">
            <Card className="max-w-2xl mx-auto p-6 md:p-10 shadow-xl bg-card/80 dark:bg-card/70 border border-primary/20">
                <CardHeader>
                    <CardTitle className="text-3xl md:text-4xl font-semibold text-gradient-primary-accent mb-2">Ready to Explore More?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-lg md:text-xl text-gray-200 dark:text-gray-200">
                        Check out your <Link href="/profile" className="text-primary hover:underline font-semibold">Profile</Link> to see your progress,
                        visit the <Link href="/tutorial" className="text-accent hover:underline font-semibold">Tutorial</Link> for a detailed guide,
                        or customize your experience in <Link href="/settings" className="text-green-400 hover:underline font-semibold">Settings</Link>.
                    </p>
                    <Button size="lg" variant="secondary" asChild className="text-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-transform">
                        <Link href="/tutorial">
                            <Sparkles className="mr-2 h-5 w-5" /> View Full Guide
                        </Link>
                    </Button>
                </CardContent>
            </Card>
         </div>
      </section>
    </div>
  );
}
