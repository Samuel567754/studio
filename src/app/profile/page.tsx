
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getStoredWordList,
  getStoredMasteredWords,
  getStoredReadingLevel,
  getStoredWordLength,
  clearProgressStoredData,
  // getStoredGoldenStars, // Will be read from store
} from '@/lib/storage';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, BookOpen, BarChart3, Settings2, ListChecks, CheckSquare, Edit, Save, Smile, Heart, Award, Trash2, ShieldAlert, Star, Brain, Trophy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/hooks/use-toast";
import { playSuccessSound, playNotificationSound, playErrorSound } from '@/lib/audio';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';


interface ProfileStats {
  practiceWordCount: number;
  masteredWordCount: number;
  readingLevel: string;
  wordLength: number;
  practiceWords: string[];
  masteredWords: string[];
}

export interface Achievement { // Exporting for use in store
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  imageSrc: string;
  iconAlt: string;
  color: string;
  bonusStars: number;
}

// Define achievements here or import from a shared config
export const achievementsList: Achievement[] = [
    { id: "star_cadet", name: "Star Cadet", description: "Collected your first 25 Golden Stars!", pointsRequired: 25, imageSrc: "/assets/images/cute_smiling_star_illustration.png", iconAlt: "Smiling Star Badge", color: "text-yellow-400", bonusStars: 5 },
    { id: "coin_collector_1", name: "Coin Collector I", description: "Amassed 75 Golden Stars!", pointsRequired: 75, imageSrc: "/assets/images/pile_of_gold_coins_image.png", iconAlt: "Pile of Gold Coins", color: "text-amber-500", bonusStars: 10 },
    { id: "gem_seeker_1", name: "Gem Seeker I", description: "Discovered 150 Golden Stars!", pointsRequired: 150, imageSrc: "/assets/images/multicolored_geometric_crystal_shape.png", iconAlt: "Colorful Crystal Shape", color: "text-fuchsia-500", bonusStars: 15 },
    { id: "treasure_finder", name: "Treasure Discoverer", description: "Unearthed 300 Golden Stars!", pointsRequired: 300, imageSrc: "/assets/images/treasure_chest_with_gold_and_jewels.png", iconAlt: "Treasure Chest", color: "text-orange-500", bonusStars: 20 },
    { id: "chill_master", name: "ChillLearn Master", description: "Achieved 500 Golden Stars overall!", pointsRequired: 500, imageSrc: "/assets/images/gold_trophy_with_laurel_wreath.png", iconAlt: "Laurel Wreath Trophy", color: "text-green-500", bonusStars: 25 },
];


const availableTopics = [
  "Animals", "Space", "Dinosaurs", "Adventures", "Fairy Tales",
  "Superheroes", "Sports", "Music", "Nature", "Oceans",
  "Cars & Trucks", "Fantasy", "Science", "History", "Art", "Robots", "Mystery"
];


export default function ProfilePage() {
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const {
    username,
    favoriteTopics,
    goldenStars,
    unlockedAchievements,
    isAchievementUnlocked,
    setUsername: setStoreUsername,
    setFavoriteTopics: setStoreFavoriteTopics,
    loadUserProfileFromStorage
  } = useUserProfileStore();

  const [usernameInput, setUsernameInput] = useState<string>('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);


  useEffect(() => {
    loadUserProfileFromStorage(); // Load username, topics, stars, achievements from store/localStorage
    const practiceList = getStoredWordList();
    const masteredList = getStoredMasteredWords();
    const level = getStoredReadingLevel();
    const length = getStoredWordLength();

    setProfileStats({
      practiceWordCount: practiceList.length,
      masteredWordCount: masteredList.length,
      readingLevel: level,
      wordLength: length,
      practiceWords: practiceList,
      masteredWords: masteredList,
    });
    setIsMounted(true);
  }, [loadUserProfileFromStorage]);

  useEffect(() => {
    if (isMounted) {
      setUsernameInput(username || '');
      setSelectedTopics(favoriteTopics ? favoriteTopics.split(',').map(t => t.trim()).filter(t => t) : []);
    }
  }, [username, favoriteTopics, isMounted]);

  const handleTopicChange = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleProfileInfoSave = (e: FormEvent) => {
    e.preventDefault();
    const trimmedUsername = usernameInput.trim();
    const topicsString = selectedTopics.join(', ');

    setStoreUsername(trimmedUsername || null);
    setStoreFavoriteTopics(topicsString || null);

    toast({
      variant: "success",
      title: <div className="flex items-center gap-2"><Smile className="h-5 w-5" />Profile Updated!</div>,
      description: `Your information has been saved.`,
    });
    playSuccessSound();
  };

  const handleConfirmResetProgress = () => {
    if (typeof window !== 'undefined') {
        clearProgressStoredData();
        toast({
            title: <div className="flex items-center gap-2"><Trash2 className="h-5 w-5" />Progress Reset</div>,
            description: "Your learning and app usage data has been cleared. You will see the introduction again.",
            variant: "destructive"
        });
        playErrorSound();
        router.push('/introduction');
    }
    setIsConfirmResetOpen(false);
  };


  if (!isMounted || !profileStats) {
    return (
      <div className="space-y-6" aria-live="polite" aria-busy="true">
        {/* Skeleton remains the same */}
      </div>
    );
  }

  const earnedAchievementsToDisplay = achievementsList.filter(ach => isAchievementUnlocked(ach.id));

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header className="relative text-center space-y-4 mb-10 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out rounded-xl overflow-hidden shadow-2xl p-8 md:p-12 min-h-[300px] flex flex-col justify-center items-center">
        <Image
          src="https://images.unsplash.com/photo-1731877818770-820faabe2d4c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTIyfHxhcHAlMjBiYWNrZ3JvdW5kc3xlbnwwfHwwfHx8MA%3D%3D"
          alt={username ? `${username}'s profile header background with abstract pattern` : "User profile header background with abstract pattern"}
          layout="fill"
          objectFit="cover"
          className="brightness-50"
          priority
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="relative z-10 text-white">
          <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full overflow-hidden shadow-lg border-4 border-yellow-400/70 mb-4">
              <Image
                  src="https://images.unsplash.com/photo-1690743300330-d190ad8f97dc?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTE1fHxhcHAlMjBiYWNrZ3JvdW5kc3xlbnwwfHwwfHx8MA%3D%3D"
                  alt={username ? `${username}'s profile avatar - abstract colorful lights` : "User profile avatar - abstract colorful lights"}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-full p-1"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end justify-center p-2">
                   <User className="h-10 w-10 text-white/90 drop-shadow-lg animate-in fade-in zoom-in-50 duration-1000 delay-200" aria-hidden="true" />
              </div>
          </div>
          <h1 className="text-4xl font-bold text-gradient-primary-accent drop-shadow-md">
            {username ? `${username}'s Learning Profile` : "Your Learning Profile"}
          </h1>
          <p className="text-lg text-gray-200 mt-2 drop-shadow-sm">A snapshot of your progress and preferences.</p>
        </div>
      </header>

      <Card className="shadow-xl border-accent/30 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-100">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-semibold text-accent">
             <Edit className="mr-3 h-6 w-6" aria-hidden="true" /> Edit Your Information
          </CardTitle>
          <CardDescription>Update your name and favorite topics to personalize your experience.</CardDescription>
        </CardHeader>
        <form onSubmit={handleProfileInfoSave}>
          <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username-input" className="text-base font-medium flex items-center gap-2">
                    <Smile className="h-5 w-5 text-muted-foreground" /> Your Name:
                </Label>
                <Input
                    id="username-input"
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter your name"
                    className="text-lg p-3 h-12 shadow-sm focus:ring-2 focus:ring-accent border-border/50"
                    aria-label="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-medium flex items-center gap-2">
                    <Heart className="h-5 w-5 text-muted-foreground" /> Your Favorite Topics:
                </Label>
                <ScrollArea className="h-40 w-full rounded-md border p-3 shadow-sm bg-background/50">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                    {availableTopics.map((topic) => (
                      <div key={topic} className="flex items-center space-x-2">
                        <Checkbox
                          id={`profile-topic-${topic.toLowerCase().replace(/\s+/g, '-')}`}
                          checked={selectedTopics.includes(topic)}
                          onCheckedChange={() => handleTopicChange(topic)}
                          aria-label={topic}
                        />
                        <Label
                          htmlFor={`profile-topic-${topic.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-base font-normal cursor-pointer hover:text-accent"
                        >
                          {topic}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                 <p className="text-xs text-muted-foreground">Select topics that interest you for tailored reading passages.</p>
              </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto" aria-label="Save profile information">
                <Save className="mr-2 h-5 w-5" /> Save Information
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-lg border-primary/20 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-200">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-semibold text-primary">
            <BarChart3 className="mr-3 h-6 w-6" aria-hidden="true" />
            Progress Overview
          </CardTitle>
          <CardDescription>Key metrics about your learning journey.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 text-lg">
          <div className="flex items-center space-x-3 p-4 bg-secondary/30 rounded-lg shadow-sm animate-in fade-in-0 slide-in-from-left-5 duration-500 ease-out delay-300">
            <Image src="/assets/images/gold_star_icon.png" alt="Golden Stars" width={32} height={32} className="drop-shadow-sm" />
            <div>
              <p className="font-semibold text-foreground">{goldenStars}</p>
              <p className="text-sm text-muted-foreground">Golden Stars Earned</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-secondary/30 rounded-lg shadow-sm animate-in fade-in-0 slide-in-from-left-5 duration-500 ease-out delay-350">
            <ListChecks className="h-8 w-8 text-accent" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">{profileStats.practiceWordCount}</p>
              <p className="text-sm text-muted-foreground">Words in Practice List</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-secondary/30 rounded-lg shadow-sm animate-in fade-in-0 slide-in-from-right-5 duration-500 ease-out delay-400">
            <CheckSquare className="h-8 w-8 text-green-500" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">{profileStats.masteredWordCount}</p>
              <p className="text-sm text-muted-foreground">Words Mastered</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-yellow-500/30 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-300">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-semibold text-yellow-500">
            <Trophy className="mr-3 h-6 w-6" aria-hidden="true" /> My Trophies & Badges
          </CardTitle>
          <CardDescription>Celebrate your learning milestones by collecting Golden Stars!</CardDescription>
        </CardHeader>
        <CardContent>
          {earnedAchievementsToDisplay.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {earnedAchievementsToDisplay.map((ach, index) => (
                <div
                  key={ach.id}
                  className={cn(
                    "p-4 rounded-lg border flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:scale-105",
                    "bg-gradient-to-br from-card via-card/90 to-secondary/10 dark:from-card dark:via-card/90 dark:to-secondary/5",
                    "border-yellow-500/50",
                    "animate-in fade-in-0 zoom-in-90"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Image
                    src={ach.imageSrc}
                    alt={ach.iconAlt}
                    width={64}
                    height={64}
                    className="mb-3 drop-shadow-lg"
                  />
                  <h3 className={cn("text-lg font-semibold mb-1", ach.color)}>{ach.name}</h3>
                  <p className="text-xs text-muted-foreground">{ach.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <Alert variant="info" className="animate-in fade-in-0 zoom-in-95 duration-300">
              <AlertTitle>Keep Learning!</AlertTitle>
              <AlertDescription>
                You haven't unlocked any trophies or badges yet. Keep practicing and earning Golden Stars to see them here!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg border-accent/20 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-300">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-semibold text-accent">
            <Settings2 className="mr-3 h-6 w-6" aria-hidden="true" />
            Current Preferences
          </CardTitle>
          <CardDescription>Your current settings for word suggestions. You can change these on the "Learn Words" or "Settings" page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-lg">
          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg animate-in fade-in-0 zoom-in-95 duration-300 delay-400">
            <span className="text-foreground font-medium" id="reading-level-label">Reading Level:</span>
            <Badge variant="outline" className="text-base px-3 py-1 capitalize" aria-labelledby="reading-level-label">{profileStats.readingLevel}</Badge>
          </div>
          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg animate-in fade-in-0 zoom-in-95 duration-300 delay-500">
            <span className="text-foreground font-medium" id="word-length-label">Preferred Word Length:</span>
            <Badge variant="outline" className="text-base px-3 py-1" aria-labelledby="word-length-label">{profileStats.wordLength} letters</Badge>
          </div>
           <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button asChild variant="outline" className="w-full sm:flex-1">
              <Link href="/learn">
                <Edit className="mr-2 h-4 w-4" /> Change Word Preferences
              </Link>
            </Button>
             <Button asChild variant="outline" className="w-full sm:flex-1">
              <Link href="/settings">
                <Settings2 className="mr-2 h-4 w-4" /> Go to App Settings
              </Link>
            </Button>
           </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md border-border/30 animate-in fade-in-0 slide-in-from-left-5 duration-500 ease-out delay-400">
            <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold" id="practice-words-heading">
                    <BookOpen className="mr-2 h-5 w-5 text-primary" aria-hidden="true" /> Practice Words
                </CardTitle>
            </CardHeader>
            <CardContent>
                {profileStats.practiceWords.length > 0 ? (
                    <ScrollArea className="h-48 w-full rounded-md border p-3 bg-background/50">
                        <div className="flex flex-wrap gap-2" role="list" aria-labelledby="practice-words-heading">
                        {profileStats.practiceWords.map((word, index) => (
                            <Badge key={`practice-${index}`} variant="secondary" className="text-sm px-2 py-1 animate-in fade-in zoom-in-95 duration-300" style={{ animationDelay: `${index * 20}ms` }} role="listitem">{word}</Badge>
                        ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <Alert variant="info" className="animate-in fade-in-0 zoom-in-95 duration-300" aria-live="polite">
                        <AlertTitle>No Practice Words</AlertTitle>
                        <AlertDescription>Your practice list is currently empty. Go to the <Link href="/learn" className="font-semibold text-primary hover:underline">Learn Words</Link> page to add words!</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>

        <Card className="shadow-md border-border/30 animate-in fade-in-0 slide-in-from-right-5 duration-500 ease-out delay-500">
            <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold" id="mastered-words-heading">
                   <CheckSquare className="mr-2 h-5 w-5 text-green-500" aria-hidden="true" /> Mastered Words
                </CardTitle>
            </CardHeader>
            <CardContent>
                 {profileStats.masteredWords.length > 0 ? (
                    <ScrollArea className="h-48 w-full rounded-md border p-3 bg-background/50">
                         <div className="flex flex-wrap gap-2" role="list" aria-labelledby="mastered-words-heading">
                        {profileStats.masteredWords.map((word, index) => (
                            <Badge key={`mastered-${index}`} variant="success" className="text-sm px-2 py-1 bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-500/30 animate-in fade-in zoom-in-95 duration-300" style={{ animationDelay: `${index * 20}ms` }} role="listitem">{word}</Badge>
                        ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <Alert variant="info" className="animate-in fade-in-0 zoom-in-95 duration-300" aria-live="polite">
                        <AlertTitle>No Mastered Words Yet</AlertTitle>
                        <AlertDescription>Keep practicing your spelling to master more words!</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-destructive/30 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out delay-600">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-semibold text-destructive">
            <Trash2 className="mr-3 h-6 w-6" aria-hidden="true" />
            Reset All Progress
          </CardTitle>
          <CardDescription>
            This will clear all your learning data, including word lists, mastered words, preferences, and tutorial status. This action is irreversible.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <AlertDialog open={isConfirmResetOpen} onOpenChange={setIsConfirmResetOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                Confirm Reset All Progress
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <ShieldAlert className="h-6 w-6 text-destructive" />
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All your learning progress, word lists, mastered words, settings preferences (username, topics, theme, audio), tutorial completion status, and Golden Stars will be permanently deleted. You will be taken back to the app introduction.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsConfirmResetOpen(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmResetProgress}
                  className={cn("bg-destructive hover:bg-destructive/90 text-destructive-foreground")}
                >
                  Yes, Reset Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
