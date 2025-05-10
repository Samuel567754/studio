
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, TableIcon as TimesTableIcon, Sigma, Puzzle, Scaling, ChevronsRight } from 'lucide-react';

export default function MathZonePage() {
  const mathSections = [
    {
      title: "Arithmetic Games",
      description: "Sharpen your skills with fun and interactive arithmetic challenges.",
      href: "/math/arithmetic-game",
      icon: Puzzle,
      dataAiHint: "chalkboard numbers",
    },
    {
      title: "Times Table Practice",
      description: "Master your multiplication tables with targeted practice.",
      href: "/math/times-table",
      icon: TimesTableIcon,
      dataAiHint: "multiplication grid",
    },
    {
      title: "Number Comparison",
      description: "Compare numbers and choose the biggest or smallest.",
      href: "/math/number-comparison",
      icon: Scaling,
      dataAiHint: "numbers comparison chart",
    },
    {
      title: "Number Sequencing",
      description: "Find the missing number in a sequence or complete patterns.",
      href: "/math/number-sequencing",
      icon: ChevronsRight,
      dataAiHint: "number line sequence",
    },
    // Add more sections here in the future e.g. Geometry, Fractions etc.
  ];

  return (
    <div className="space-y-8">
      <header className="text-center space-y-2 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
        <Sigma className="h-16 w-16 mx-auto text-primary animate-in fade-in zoom-in-50 duration-1000 delay-200" aria-hidden="true" />
        <h1 className="text-4xl font-bold text-gradient-primary-accent">Math Zone</h1>
        <p className="text-lg text-muted-foreground">Explore various math activities and games.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mathSections.map((section, index) => (
          <Card 
            key={section.title} 
            className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out"
            style={{ animationDelay: `${100 + index * 150}ms` }}
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

      {/* Placeholder for future overall math stats or settings specific to math */}
      {/* 
      <Card className="mt-10 shadow-md animate-in fade-in-0 delay-500 duration-500">
        <CardHeader>
          <CardTitle className="text-xl">Math Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Your math achievements will be displayed here soon!</p>
        </CardContent>
      </Card>
      */}
    </div>
  );
}

