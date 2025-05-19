"use client";

import type { FC } from "react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  Menu,
  X,
  SettingsIcon,
  User,
  Map,
  Sigma,
  HomeIcon,
  Puzzle,
  FileType2 as TextSelectIcon,
  Trash2,
  GraduationCap,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDescriptionPrimitive,
  AlertDialogFooter,
  AlertDialogHeader as AlertDialogHeaderPrimitive,
  AlertDialogTitle as AlertDialogTitlePrimitive,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { clearProgressStoredData } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import {
  playNotificationSound,
  playErrorSound,
  playCoinsEarnedSound,
} from "@/lib/audio";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserProfileStore } from "@/stores/user-profile-store";
import { AchievementsDisplayModal } from "@/components/achievements-display-modal";

// Map point thresholds to image + alt text
const POINTS_IMAGE_MAP = [
  { threshold: 5000, src: "/assets/images/20250518_113441_0000.png", alt: "Mega Gold Reward" },
  { threshold: 300,  src: "/assets/images/Untitled design3.png",      alt: "Large Gold Reward" },
  { threshold: 175,  src: "/assets/images/Untitled design2.png",      alt: "Premium Gold Reward" },
  { threshold: 100,  src: "/assets/images/Untitled design.png",       alt: "Hundred Gold Reward" },
  { threshold: 25,   src: "/assets/images/20250518_114212_0000.png",  alt: "Twenty Five Gold Reward" },
  { threshold: 10,   src: "/assets/images/Untitled design1.png",      alt: "Ten Gold Reward" },
  { threshold: 4,    src: "/assets/images/four_gold_coins.png",       alt: "Four Gold Coins" },
  { threshold: 2,    src: "/assets/images/golden_coin_two_group.png", alt: "Two Gold Coins" },
  { threshold: 1,    src: "/assets/images/golden_star_coin.png",      alt: "Single Gold Coin" },
  { threshold: 0,    src: "/assets/images/empty_gold_chest.png",      alt: "Empty Gold Chest" },
];

/** Pick the highest‐threshold image the user qualifies for */
function getImageForPoints(points: number) {
  for (const candidate of POINTS_IMAGE_MAP) {
    if (points >= candidate.threshold) {
      return candidate;
    }
  }
  // Fallback star coin
  return { src: "/assets/images/golden_star_coin.png", alt: "Golden Star Coin" };
}

const navLinks = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/word-practice", label: "Word Practice", icon: TextSelectIcon },
  { href: "/ai-games", label: "AI Games", icon: Puzzle },
  { href: "/math", label: "Math", icon: Sigma },
  { href: "/tutorial", label: "Guide", icon: Map },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export const MainNav: FC = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  // NEW – track animation + modal state
  const [animateCoins, setAnimateCoins] = useState(false);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const prevGoldenCoinsRef = useRef(0);

  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { goldenCoins } = useUserProfileStore();

  // On mount
  useEffect(() => {
    setIsMounted(true);
    prevGoldenCoinsRef.current = goldenCoins;
  }, []);

  // Trigger animation & sound when coins rise
  useEffect(() => {
    if (goldenCoins > prevGoldenCoinsRef.current) {
      setAnimateCoins(true);
      playCoinsEarnedSound();
    }
    prevGoldenCoinsRef.current = goldenCoins;
  }, [goldenCoins]);

  const handlePointsAnimationEnd = () => setAnimateCoins(false);

  const handleOpenAchievementsModal = () => {
    playNotificationSound();
    setIsAchievementsModalOpen(true);
  };

  const handleConfirmResetProgress = () => {
    clearProgressStoredData();
    setIsMobileMenuOpen(false);
    toast({
      title: (
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" /> Progress Reset
        </div>
      ),
      description:
        "Your learning and app usage data has been cleared. You will see the introduction again.",
      variant: "destructive",
    });
    playErrorSound();
    window.location.href = "/introduction";
    setIsConfirmResetOpen(false);
  };

  // Build CompactGoldenCoinsDisplay with dynamic image + click handler
  const CompactGoldenCoinsDisplay = (
    <div
      onClick={handleOpenAchievementsModal}
      role="button"
      tabIndex={0}
      aria-label="View Golden Coins and Achievements"
      className={cn(
        "flex items-center gap-1.5 p-1.5 rounded-full shadow-md transition-colors duration-300",
        "bg-[hsl(var(--nav-active-indicator-dark))]/30 text-[hsl(var(--nav-text-dark))]",
        "hover:bg-[hsl(var(--nav-active-indicator-dark))]/50 cursor-pointer"
      )}
    >
      {(() => {
        const { src, alt } = getImageForPoints(goldenCoins);
        return (
          <Image
            src={src}
            alt={alt}
            width={32}
            height={32}
            className={cn(
              "drop-shadow-sm",
              animateCoins && "golden-coins-update-animation"
            )}
            onAnimationEnd={handlePointsAnimationEnd}
          />
        );
      })()}
      <span
        onAnimationEnd={handlePointsAnimationEnd}
        className={cn(
          "text-lg font-semibold",
          animateCoins && "golden-coins-update-animation"
        )}
      >
        {goldenCoins}
      </span>
    </div>
  );

  if (!isMounted) {
    // Skeleton header (unchanged)
    return (
      <header className="sticky top-0 z-40 w-full h-16 bg-muted animate-pulse">
        {/* ... */}
      </header>
    );
  }

  const navBarBaseClasses =
    "sticky top-0 z-40 w-full bg-nav-gradient shadow-nav-bottom border-b";
  const navBarBorderColor = "border-[hsl(var(--nav-border-dark))]";

  const NavLinkItems: FC<{ isMobileSheet?: boolean }> = ({
    isMobileSheet = false,
  }) => (
    <>
      {navLinks.map((link) => {
        const isActive =
          pathname === link.href ||
          (pathname.startsWith(link.href) && link.href !== "/");

        let buttonClassName = cn(
          "justify-start w-full text-base md:text-sm md:w-auto group transition-colors duration-200 ease-in-out",
          "text-[hsl(var(--nav-text-dark))]",
          isMobileSheet
            ? "py-3 px-4 rounded-lg"
            : "py-2 px-3 rounded-md md:h-10"
        );

        if (isActive) {
          buttonClassName = cn(
            buttonClassName,
            "font-semibold",
            "bg-[hsl(var(--nav-active-indicator-dark))] text-[hsl(var(--nav-active-text-dark))]"
          );
        } else {
          buttonClassName = cn(
            buttonClassName,
            "hover:bg-[hsl(var(--nav-active-indicator-dark))]/50 hover:text-[hsl(var(--nav-active-text-dark))]"
          );
        }

        const IconComp = link.icon;
        return (
          <Button
            key={link.href}
            variant="ghost"
            asChild
            className={buttonClassName}
            onClick={() => isMobileSheet && setIsMobileMenuOpen(false)}
          >
            <Link
              href={link.href}
              className="flex items-center gap-2"
              aria-current={isActive ? "page" : undefined}
            >
              <IconComp
                className={cn(
                  "h-5 w-5",
                  isActive
                    ? "text-[hsl(var(--nav-active-text-dark))]"
                    : "text-[hsl(var(--nav-icon-dark))] group-hover:text-[hsl(var(--nav-active-text-dark))]"
                )}
                aria-hidden="true"
              />
              {link.label}
            </Link>
          </Button>
        );
      })}
    </>
  );

  return (
    <>
      <header className={cn(navBarBaseClasses, navBarBorderColor)}>
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 group"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <BookOpenText
                className={cn(
                  "h-8 w-8 transition-colors duration-300 ease-in-out text-[hsl(var(--nav-icon-dark))] group-hover:text-accent"
                )}
                aria-hidden="true"
              />
              <h1
                className={cn(
                  "text-2xl font-bold transition-colors duration-300 ease-in-out hidden sm:block text-[hsl(var(--nav-text-dark))] group-hover:text-accent"
                )}
              >
                ChillLearn
              </h1>
            </Link>
            <div className="hidden md:flex">{CompactGoldenCoinsDisplay}</div>
          </div>

          {/* Desktop nav links + Quick Learn */}
          <nav
            className="hidden md:flex items-center gap-1 lg:gap-2"
            aria-label="Main navigation"
          >
            <NavLinkItems />
            <Button
              variant="default"
              size="sm"
              className="ml-2 btn-glow md:h-10 md:px-4 md:py-2 bg-primary text-primary-foreground hover:bg-primary/90"
              asChild
            >
              <Link href="/learn">
                <GraduationCap className="mr-2 h-4 w-4" aria-hidden="true" />{" "}
                Quick Learn
              </Link>
            </Button>
          </nav>

          {/* Mobile header: coins + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {CompactGoldenCoinsDisplay}
            <Sheet
              open={isMobileMenuOpen}
              onOpenChange={setIsMobileMenuOpen}
            >
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-full aspect-square h-12 w-12 transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0",
                    "text-[hsl(var(--nav-icon-dark))]",
                    "hover:bg-[hsl(var(--nav-active-indicator-dark))]/50",
                    isMobileMenuOpen &&
                      "bg-[hsl(var(--nav-active-indicator-dark))]"
                  )}
                  aria-label="Open main navigation menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  <Menu
                    className={cn(
                      "h-7 w-7",
                      "text-[hsl(var(--nav-icon-dark))]",
                      isMobileMenuOpen && "hidden"
                    )}
                    aria-hidden="true"
                  />
                  <X
                    className={cn(
                      "h-7 w-7",
                      isMobileMenuOpen
                        ? "text-[hsl(var(--nav-active-text-dark))]"
                        : "text-[hsl(var(--nav-icon-dark))]",
                      !isMobileMenuOpen && "hidden"
                    )}
                    aria-hidden="true"
                  />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className={cn(
                  "w-full max-w-xs p-0 flex flex-col bg-nav-gradient border-l border-[hsl(var(--nav-border-dark))]"
                )}
              >
                <SheetHeader
                  className={cn(
                    "flex flex-row items-center justify-between p-4 border-b border-[hsl(var(--nav-border-dark))]"
                  )}
                >
                  <SheetTitle asChild>
                    <Link
                      href="/"
                      className="flex items-center gap-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <BookOpenText
                        className={cn(
                          "h-7 w-7 text-[hsl(var(--nav-icon-dark))]"
                        )}
                      />
                      <h1
                        className={cn(
                          "text-xl font-bold text-[hsl(var(--nav-text-dark))]"
                        )}
                      >
                        ChillLearn
                      </h1>
                    </Link>
                  </SheetTitle>
                  <SheetClose
                    className={cn(
                      "rounded-full p-1.5 opacity-80 ring-offset-background transition-all hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-transparent",
                      "hover:bg-[hsl(var(--nav-active-indicator-dark))]/50 hover:text-[hsl(var(--nav-active-text-dark))]",
                      isMobileMenuOpen
                        ? "text-[hsl(var(--nav-active-text-dark))]"
                        : "text-[hsl(var(--nav-icon-dark))]"
                    )}
                  >
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                  </SheetClose>
                </SheetHeader>
                <nav
                  className="flex flex-col gap-2 p-4"
                  aria-label="Mobile navigation"
                >
                  {/* Mobile sheet’s own coin display */}
                  <div
                    className={cn(
                      "flex items-center justify-center gap-1.5 p-2 mb-2 rounded-lg bg-[hsl(var(--nav-active-indicator-dark))]/30 shadow-inner text-[hsl(var(--nav-text-dark))]"
                    )}
                    onClick={handleOpenAchievementsModal}
                    role="button"
                    tabIndex={0}
                  >
                    {(() => {
                      const { src, alt } = getImageForPoints(
                        goldenCoins
                      );
                      return (
                        <Image
                          src={src}
                          alt={alt}
                          width={32}
                          height={32}
                          className={cn(
                            "drop-shadow-sm",
                            animateCoins && "golden-coins-update-animation"
                          )}
                          onAnimationEnd={handlePointsAnimationEnd}
                        />
                      );
                    })()}
                    <span
                      className={cn(
                        "text-lg font-semibold",
                        animateCoins && "golden-coins-update-animation"
                      )}
                      onAnimationEnd={handlePointsAnimationEnd}
                    >
                      {goldenCoins} Golden Coins
                    </span>
                  </div>
                  <NavLinkItems isMobileSheet />
                  <Button
                    variant="default"
                    size="lg"
                    asChild
                    className={cn(
                      "mt-4 w-full btn-glow bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href="/learn">
                      <GraduationCap
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />{" "}
                      Quick Learn
                    </Link>
                  </Button>
                </nav>

                {/* Reset section */}
                <div
                  className={cn(
                    "mt-auto p-4 border-t",
                    "border-[hsl(var(--nav-border-light))]"
                  )}
                >
                  <AlertDialog
                    open={isConfirmResetOpen}
                    onOpenChange={setIsConfirmResetOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className={cn(
                          "w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        )}
                      >
                        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                        Reset All Progress
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent
                      className={cn(
                        "bg-[hsl(var(--nav-gradient-from-dark))] border-[hsl(var(--nav-border-dark))] text-[hsl(var(--nav-text-dark))]"
                      )}
                    >
                      <AlertDialogHeaderPrimitive>
                        <AlertDialogTitlePrimitive
                          className={cn("flex items-center gap-2 text-destructive")}
                        >
                          <ShieldAlert className="h-6 w-6 text-destructive" />
                          Confirm Full Reset
                        </AlertDialogTitlePrimitive>
                        <AlertDialogDescriptionPrimitive
                          className={cn("text-[hsl(var(--nav-text-light))]/80")}
                        >
                          This action is irreversible and will clear all your
                          learning progress, including your word lists,
                          mastered words, reading level, word length
                          preferences, username, favorite topics, golden
                          coins, unlocked achievements, and tutorial
                          completion status. You will be taken back to the
                          app introduction.
                          <br />
                          <br />
                          <strong>
                            Are you absolutely sure you want to reset
                            everything?
                          </strong>
                        </AlertDialogDescriptionPrimitive>
                      </AlertDialogHeaderPrimitive>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          className={cn(
                            "border-[hsl(var(--nav-border-light))] text-[hsl(var(--nav-text-dark))] bg-transparent hover:bg-[hsl(var(--nav-active-indicator-dark))]/50"
                          )}
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleConfirmResetProgress}
                          className={cn(
                            "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          )}
                        >
                          Yes, Reset Everything
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <p
                    className={cn(
                      "text-xs mt-2 text-center text-[hsl(var(--nav-text-dark))]/70"
                    )}
                  >
                    This resets all learning data and app usage preferences.
                    You will see the introduction again.
                  </p>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Achievements modal */}
      <AchievementsDisplayModal
        isOpen={isAchievementsModalOpen}
        onClose={() => setIsAchievementsModalOpen(false)}
      />
    </>
  );
};
