
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { getHasSeenIntroduction, getHasCompletedPersonalization } from '@/lib/storage';
import { Sun, Moon, Laptop, ArrowRight, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playNotificationSound } from '@/lib/audio';
import { useUserProfileStore } from '@/stores/user-profile-store';

export default function SelectThemePage() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const { username } = useUserProfileStore();

  useEffect(() => {
    setIsMounted(true);
    const introSeen = getHasSeenIntroduction();
    const personalizationCompleted = getHasCompletedPersonalization();

    if (!introSeen) {
      router.replace('/introduction');
      return;
    }
    if (personalizationCompleted) {
      router.replace('/'); // Already personalized, go to home
      return;
    }
  }, [router]);

  const handleThemeSelection = (selectedTheme: string) => {
    setTheme(selectedTheme);
    playNotificationSound();
  };

  const handleContinue = () => {
    playNotificationSound();
    router.push('/personalize');
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5 flex items-center justify-center">
        <Palette className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Laptop },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5 text-foreground flex flex-col items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-2xl border-primary/20 animate-in fade-in-0 zoom-in-95 duration-700 ease-out">
        <CardHeader className="text-center items-center space-y-3">
          <div className="relative w-24 h-24 md:w-28 md:h-28 mx-auto rounded-full overflow-hidden shadow-lg border-4 border-accent/30 mb-3">
            <Image
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDN8fGFwcCUyMGJDFTNGLmRlc2lnbnxlbnwwfHwwfHx8MA%3D%3D"
                alt="Abstract colorful background for app theme selection"
                layout="fill"
                objectFit="cover"
                data-ai-hint="app design theme"
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent flex items-center justify-center p-2">
                <Palette className="h-10 w-10 text-white/90 drop-shadow-lg" aria-hidden="true" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gradient-primary-accent">
            Choose Your Look
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground px-2">
            Select a theme that feels right for you, {username || 'learner'}. You can always change this later in settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-2 rounded-lg bg-muted p-1">
            {themeOptions.map((item) => (
              <Button
                key={item.value}
                variant={(theme === item.value || (theme === 'system' && resolvedTheme === item.value && item.value !== 'system')) ? "default" : "ghost"}
                onClick={() => handleThemeSelection(item.value)}
                className="w-full justify-center py-3 text-base sm:text-sm h-auto"
                aria-pressed={theme === item.value}
                aria-label={`Set theme to ${item.label}`}
              >
                <item.icon className="w-5 h-5 mr-2" aria-hidden="true" />
                {item.label}
              </Button>
            ))}
          </div>
          <div className="p-4 border rounded-lg bg-background shadow-inner min-h-[100px] flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              The app's appearance will update in real-time as you select a theme.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            size="lg"
            onClick={handleContinue}
            className="w-full btn-glow text-lg py-7"
            aria-label="Continue to personalization settings"
          >
            Continue to Personalization <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardFooter>
      </Card>
      <footer className="text-center text-xs text-muted-foreground py-6 mt-4">
         Personalize your ChillLearn AI experience.
      </footer>
    </div>
  );
}

    