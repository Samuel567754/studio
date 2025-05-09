
"use client";

import { useEffect, useState } from 'react';
import { useTheme } from "next-themes";
import { useThemeStore } from '@/stores/theme-store';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon, Laptop, Palette, Type, CaseSensitive, Volume2, VolumeX, RefreshCw, Mic2, ChevronDown, SettingsIcon } from "lucide-react";
import { playNotificationSound } from '@/lib/audio';

const fontFamilies = [
  { label: "Sans Serif (Default)", value: "var(--font-geist-sans)" },
  { label: "Monospace", value: "var(--font-geist-mono)" },
  { label: "Serif", value: "var(--font-serif-custom)" },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { fontSize, fontFamily, setFontSize, setFontFamily, resetThemeSettings } = useThemeStore();
  const { 
    soundEffectsEnabled, setSoundEffectsEnabled, 
    speechRate, setSpeechRate, 
    speechPitch, setSpeechPitch, 
    selectedVoiceURI, setSelectedVoiceURI,
    resetAppSettings 
  } = useAppSettingsStore();
  
  const [isMounted, setIsMounted] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    setIsMounted(true);
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Filter for English voices, if possible, or provide a good variety
        const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
        setAvailableVoices(englishVoices.length > 0 ? englishVoices : voices);
        // If no voice is selected, or selected is not available, try to set a default
        if (!selectedVoiceURI && voices.length > 0) {
            const defaultVoice = voices.find(v => v.default) || voices[0];
            if (defaultVoice) {
                setSelectedVoiceURI(defaultVoice.voiceURI);
            }
        } else if (selectedVoiceURI && !voices.find(v => v.voiceURI === selectedVoiceURI)) {
            // Selected voice is no longer available, reset or pick new default
             const defaultVoice = voices.find(v => v.default) || voices[0];
            if (defaultVoice) {
                setSelectedVoiceURI(defaultVoice.voiceURI);
            } else {
                 setSelectedVoiceURI(null);
            }
        }
      }
    };

    loadVoices(); // Initial load
    // Voices list might populate asynchronously
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoiceURI, setSelectedVoiceURI]);

  if (!isMounted) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-7 w-1/2 bg-muted rounded"></div>
            <div className="h-4 w-3/4 bg-muted rounded mt-2"></div>
          </CardHeader>
          <CardContent className="space-y-8">
            {[1, 2, 3, 4, 5, 6].map(i => ( 
              <div key={i} className="space-y-3">
                <div className="h-5 w-1/4 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
                {(i === 2 || i === 4 || i === 5) && <div className="h-6 w-full bg-muted rounded"></div>}
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

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEffectsEnabled(enabled);
    playNotificationSound();
  }

  const handleSpeechRateChange = (newRate: number[]) => {
    setSpeechRate(newRate[0]);
    playNotificationSound();
  };

  const handleSpeechPitchChange = (newPitch: number[]) => {
    setSpeechPitch(newPitch[0]);
    playNotificationSound();
  };

  const handleVoiceChange = (voiceURI: string) => {
    setSelectedVoiceURI(voiceURI);
    playNotificationSound();
  };
  
  const handleResetSettings = () => {
    resetThemeSettings();
    resetAppSettings(); // Resets sound and speech settings
    setTheme("system"); 
    playNotificationSound();
  };


  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Card className="shadow-lg border-border/30">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center text-primary">
            <SettingsIcon className="mr-3 h-8 w-8" />
            Application Settings
          </CardTitle>
          <CardDescription className="text-base">
            Customize the appearance, audio, and speech behavior of the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-10">
          {/* Appearance Settings */}
          <section>
            <h3 className="text-xl font-semibold mb-4 flex items-center"><Palette className="mr-2 h-6 w-6 text-accent"/>Appearance</h3>
            <div className="space-y-6 pl-2 border-l-2 border-accent/30">
              <div className="space-y-3">
                <Label htmlFor="theme-selector" className="text-lg font-medium flex items-center">
                  <Sun className="mr-2 h-5 w-5 text-muted-foreground" /> Theme
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

              <div className="space-y-3">
                <Label htmlFor="font-family-selector" className="text-lg font-medium flex items-center">
                  <Type className="mr-2 h-5 w-5 text-muted-foreground" /> Font Family
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

              <div className="space-y-3">
                <Label htmlFor="font-size-slider" className="text-lg font-medium flex items-center">
                  <CaseSensitive className="mr-2 h-5 w-5 text-muted-foreground" /> Font Size: <span className="text-primary ml-2 font-bold">{fontSize}px</span>
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
            </div>
          </section>

          {/* Audio & Speech Settings */}
          <section>
             <h3 className="text-xl font-semibold mb-4 flex items-center"><Mic2 className="mr-2 h-6 w-6 text-accent"/>Audio & Speech</h3>
             <div className="space-y-6 pl-2 border-l-2 border-accent/30">
                <div className="space-y-3">
                  <Label className="text-lg font-medium flex items-center">
                    {soundEffectsEnabled ? <Volume2 className="mr-2 h-5 w-5 text-muted-foreground" /> : <VolumeX className="mr-2 h-5 w-5 text-muted-foreground" />} Sound Effects & Speech
                  </Label>
                  <div className="flex items-center space-x-2 rounded-lg border p-3 shadow-sm">
                    <Switch
                      id="sound-effects-toggle"
                      checked={soundEffectsEnabled}
                      onCheckedChange={handleSoundToggle}
                      aria-label="Toggle sound effects and speech"
                    />
                    <Label htmlFor="sound-effects-toggle" className="text-base flex-grow">
                      {soundEffectsEnabled ? "Enabled" : "Disabled"}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Toggle all application sound effects and text-to-speech on or off.
                  </p>
                </div>

                <div className="space-y-3">
                    <Label htmlFor="speech-rate-slider" className="text-lg font-medium flex items-center">
                        Speech Rate: <span className="text-primary ml-2 font-bold">{speechRate.toFixed(1)}x</span>
                    </Label>
                    <Slider
                        id="speech-rate-slider"
                        min={0.5} max={2} step={0.1}
                        value={[speechRate]}
                        onValueChange={handleSpeechRateChange}
                        disabled={!soundEffectsEnabled}
                        className="w-full [&>span:first-child]:h-3 [&>span:first-child_>span]:h-3 [&>span:last-child]:h-6 [&>span:last-child]:w-6"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground px-1">
                        <span>0.5x (Slower)</span>
                        <span>2.0x (Faster)</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <Label htmlFor="speech-pitch-slider" className="text-lg font-medium flex items-center">
                        Speech Pitch: <span className="text-primary ml-2 font-bold">{speechPitch.toFixed(1)}</span>
                    </Label>
                    <Slider
                        id="speech-pitch-slider"
                        min={0} max={2} step={0.1}
                        value={[speechPitch]}
                        onValueChange={handleSpeechPitchChange}
                        disabled={!soundEffectsEnabled}
                        className="w-full [&>span:first-child]:h-3 [&>span:first-child_>span]:h-3 [&>span:last-child]:h-6 [&>span:last-child]:w-6"
                    />
                     <div className="flex justify-between text-xs text-muted-foreground px-1">
                        <span>0.0 (Low)</span>
                        <span>2.0 (High)</span>
                    </div>
                </div>
                
                <div className="space-y-3">
                    <Label htmlFor="voice-selector" className="text-lg font-medium flex items-center">
                       <ChevronDown className="mr-2 h-5 w-5 text-muted-foreground" /> Speaking Voice
                    </Label>
                    <Select value={selectedVoiceURI || ""} onValueChange={handleVoiceChange} disabled={!soundEffectsEnabled || availableVoices.length === 0}>
                        <SelectTrigger id="voice-selector" className="w-full h-11 text-base shadow-sm">
                            <SelectValue placeholder={availableVoices.length === 0 ? "Loading voices..." : "Select voice"} />
                        </SelectTrigger>
                        <SelectContent>
                            {availableVoices.length > 0 ? availableVoices.map((voice) => (
                                <SelectItem key={voice.voiceURI} value={voice.voiceURI} className="text-base">
                                    {voice.name} ({voice.lang}) {voice.default && "(Default)"}
                                </SelectItem>
                            )) : <SelectItem value="loading" disabled>Loading voices...</SelectItem>}
                        </SelectContent>
                    </Select>
                     <p className="text-sm text-muted-foreground">
                        Available voices depend on your browser and operating system.
                    </p>
                </div>
             </div>
          </section>
          
        </CardContent>
        <CardFooter className="border-t border-border/20 pt-6">
           <Button variant="outline" onClick={handleResetSettings} className="w-full md:w-auto">
              <RefreshCw className="mr-2 h-4 w-4" /> Reset All Settings to Defaults
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

