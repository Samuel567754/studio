
"use client";

import { useEffect, useState } from 'react';
import { useTheme } from "next-themes";
import { useThemeStore } from '@/stores/theme-store';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sun, Moon, Laptop, Palette, Type, CaseSensitive } from "lucide-react";
import { playNotificationSound } from '@/lib/audio';

const fontFamilies = [
  { label: "Sans Serif (Default)", value: "var(--font-geist-sans)" },
  { label: "Monospace", value: "var(--font-geist-mono)" },
  { label: "Serif", value: "var(--font-serif-custom)" },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { fontSize, fontFamily, setFontSize, setFontFamily, resetThemeSettings } = useThemeStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-7 w-1/2 bg-muted rounded"></div>
            <div className="h-4 w-3/4 bg-muted rounded mt-2"></div>
          </CardHeader>
          <CardContent className="space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-5 w-1/4 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
                {i === 2 && <div className="h-6 w-full bg-muted rounded"></div>}
              </div>
            ))}
            <div className="h-10 w-1/3 bg-primary/50 rounded mt-6"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    playNotificationSound();
  };

  const handleFontFamilyChange = (newFontFamily: string) => {
    setFontFamily(newFontFamily);
    playNotificationSound();
  };

  const handleFontSizeChange = (newSize: number[]) => {
    setFontSize(newSize[0]);
    playNotificationSound();
  };
  
  const handleResetSettings = () => {
    resetThemeSettings();
    setTheme("system"); // Reset next-themes to system default
    playNotificationSound();
  };


  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Card className="shadow-lg border-border/30">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center text-primary">
            <Palette className="mr-3 h-8 w-8" />
            Appearance Settings
          </CardTitle>
          <CardDescription className="text-base">
            Customize the look and feel of the application to your liking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Theme Settings */}
          <div className="space-y-3">
            <Label htmlFor="theme-selector" className="text-lg font-semibold flex items-center">
              <Sun className="mr-2 h-5 w-5 text-accent" /> Theme
            </Label>
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-1">
              {[
                { value: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
                { value: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
                { value: "system", label: "System", icon: <Laptop className="w-4 h-4" /> },
              ].map((item) => (
                <Button
                  key={item.value}
                  variant={theme === item.value ? "default" : "ghost"}
                  onClick={() => handleThemeChange(item.value)}
                  className="w-full justify-center py-2 text-sm"
                  aria-pressed={theme === item.value}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Font Family Settings */}
          <div className="space-y-3">
            <Label htmlFor="font-family-selector" className="text-lg font-semibold flex items-center">
              <Type className="mr-2 h-5 w-5 text-accent" /> Font Family
            </Label>
            <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
              <SelectTrigger id="font-family-selector" className="w-full h-11 text-base shadow-sm">
                <SelectValue placeholder="Select font family" />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font.value} value={font.value} className="text-base">
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size Settings */}
          <div className="space-y-3">
            <Label htmlFor="font-size-slider" className="text-lg font-semibold flex items-center">
              <CaseSensitive className="mr-2 h-5 w-5 text-accent" /> Font Size: <span className="text-primary ml-2 font-bold">{fontSize}px</span>
            </Label>
            <Slider
              id="font-size-slider"
              min={12}
              max={20}
              step={1}
              value={[fontSize]}
              onValueChange={handleFontSizeChange}
              className="w-full [&>span:first-child]:h-3 [&>span:first-child_>span]:h-3 [&>span:last-child]:h-6 [&>span:last-child]:w-6"
            />
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>12px (Small)</span>
              <span>20px (Large)</span>
            </div>
          </div>
          
          {/* Reset Settings Button */}
          <div className="pt-4 border-t border-border/20">
             <Button variant="outline" onClick={handleResetSettings} className="w-full md:w-auto">
                Reset to Defaults
             </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
