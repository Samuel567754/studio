
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2, Volume2, Calculator } from 'lucide-react';
import { mathTutor, type MathTutorInput } from '@/ai/flows/math-tutor-flow';
import { useToast } from '@/hooks/use-toast';
import { speakText, playNotificationSound, playErrorSound } from '@/lib/audio';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { useUserProfileStore } from '@/stores/user-profile-store';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
}

export function MathTutorAssistant() {
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { soundEffectsEnabled } = useAppSettingsStore();
  const { username } = useUserProfileStore();

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, scrollToBottom]);
  
  const handleSpeakMessage = (text: string) => {
    if (soundEffectsEnabled) {
      speakText(text);
    } else {
      toast({
        variant: "info",
        title: "Audio Disabled",
        description: "Sound effects are turned off in settings."
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      type: 'user',
      text: inputValue,
    };
    setChatHistory((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    if(soundEffectsEnabled) playNotificationSound();

    try {
      const input: MathTutorInput = { question: userMessage.text, username: username || undefined };
      const result = await mathTutor(input);
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '-ai',
        type: 'ai',
        text: result.answer,
      };
      setChatHistory((prev) => [...prev, aiMessage]);
      if (soundEffectsEnabled) speakText(result.answer);
    } catch (error) {
      console.error("Error with Math Tutor AI:", error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-error',
        type: 'ai',
        text: "I'm sorry, I encountered an issue trying to solve that. Please ensure your question is math-related or try rephrasing.",
      };
      setChatHistory((prev) => [...prev, errorMessage]);
      toast({
        variant: "destructive",
        title: "AI Math Assistant Error",
        description: "Could not get a response from the math assistant.",
      });
      if(soundEffectsEnabled) playErrorSound();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-xl border-accent/20 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-accent">
          <Calculator className="mr-2 h-6 w-6" /> Matteo - Your Math Problem Solver
        </CardTitle>
        <CardDescription>Ask me any math question or for help with a problem!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea ref={scrollAreaRef} className="h-80 w-full rounded-md border p-4 bg-background/60 shadow-inner">
          {chatHistory.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Bot size={48} className="mb-3 opacity-50" />
                <p className="text-sm">No messages yet. What math problem can I help you with?</p>
             </div>
          )}
          {chatHistory.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-end gap-2.5 my-3 animate-in fade-in-0",
                message.type === 'user' ? 'justify-end slide-in-from-right-5' : 'justify-start slide-in-from-left-5'
              )}
            >
              {message.type === 'ai' && (
                <Avatar className="h-8 w-8 border border-primary/30 shadow-sm flex-shrink-0">
                  <AvatarFallback className="bg-primary/10"><Bot size={18} className="text-primary"/></AvatarFallback>
                </Avatar>
              )}
              <div className="flex flex-col gap-1">
                <div
                    className={cn(
                    "max-w-xs sm:max-w-sm md:max-w-md rounded-xl px-3.5 py-2.5 shadow-md text-sm leading-relaxed",
                    message.type === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-card text-card-foreground border border-border/60 rounded-bl-none'
                    )}
                >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                </div>
                {message.type === 'ai' && soundEffectsEnabled && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSpeakMessage(message.text)} 
                    className="h-7 w-auto px-2 py-1 text-xs text-muted-foreground hover:text-accent self-start"
                    aria-label="Read Matteo's message aloud"
                  >
                    <Volume2 size={14} className="mr-1" /> Read Aloud
                  </Button>
                )}
              </div>
              {message.type === 'user' && (
                <Avatar className="h-8 w-8 border shadow-sm flex-shrink-0">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {username ? username.charAt(0).toUpperCase() : <User size={18} />}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2.5 my-3 justify-start animate-in fade-in-0 slide-in-from-left-5">
              <Avatar className="h-8 w-8 border border-primary/30 shadow-sm flex-shrink-0">
                 <AvatarFallback className="bg-primary/10"><Bot size={18} className="text-primary"/></AvatarFallback>
              </Avatar>
              <div className="max-w-xs sm:max-w-sm md:max-w-md rounded-xl px-3.5 py-2.5 shadow-md bg-card text-card-foreground border border-border/60 rounded-bl-none">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2 border-t border-border/30">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask Matteo a math question..."
            className="flex-grow text-base h-12 shadow-sm focus:ring-2 focus:ring-accent border-border/50"
            disabled={isLoading}
            aria-label="Your math question for Matteo"
          />
          <Button type="submit" size="icon" className="h-12 w-12 btn-glow bg-accent hover:bg-accent/90 text-accent-foreground rounded-full" disabled={isLoading || !inputValue.trim()} aria-label="Send question">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
