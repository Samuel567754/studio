
'use client';

import { useAppSettingsStore } from '@/stores/app-settings-store';

// Helper function to create and play a sound
const playSoundInternal = (
  type: OscillatorType,
  frequencyConfig: number | { start: number; end?: number; bendDuration?: number },
  volume: number,
  duration: number,
  rampType: 'linear' | 'exponential' = 'exponential'
) => {
  if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = type;

    if (typeof frequencyConfig === 'number') {
      oscillator.frequency.setValueAtTime(frequencyConfig, audioContext.currentTime);
    } else {
      oscillator.frequency.setValueAtTime(frequencyConfig.start, audioContext.currentTime);
      if (frequencyConfig.end && frequencyConfig.bendDuration) {
        const targetFrequency = frequencyConfig.end === 0 ? 0.0001 : frequencyConfig.end;
        if (rampType === 'linear') {
             oscillator.frequency.linearRampToValueAtTime(targetFrequency, audioContext.currentTime + frequencyConfig.bendDuration);
        } else {
             oscillator.frequency.exponentialRampToValueAtTime(targetFrequency, audioContext.currentTime + frequencyConfig.bendDuration);
        }
      }
    }
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }
};

const playSoundWrapper = (
  type: OscillatorType,
  frequencyConfig: number | { start: number; end?: number; bendDuration?: number },
  volume: number,
  duration: number,
  rampType: 'linear' | 'exponential' = 'exponential'
) => {
  const soundEffectsEnabled = useAppSettingsStore.getState().soundEffectsEnabled;
  if (soundEffectsEnabled) {
    playSoundInternal(type, frequencyConfig, volume, duration, rampType);
  }
};


export function playClickSound(): void {
  // Short, crisp, pleasant 'sine' pluck (A4)
  playSoundWrapper('sine', 440, 0.03, 0.05); 
}

export function playSuccessSound(): void {
  // Ascending sweep, positive confirmation
  playSoundWrapper('sine', { start: 600, end: 880, bendDuration: 0.05 }, 0.15, 0.2);
}

export function playErrorSound(): void {
  // Low, descending 'square' wave for a more "buzz" or "thud" error sound
  playSoundWrapper('square', { start: 150, end: 100, bendDuration: 0.1 }, 0.15, 0.25);
}

export function playNavigationSound(): void {
  // Gentle upward sweep for non-button navigation (e.g., next/prev word)
  playSoundWrapper('sine', { start: 380, end: 550, bendDuration: 0.05 }, 0.04, 0.1);
}

export function playNotificationSound(): void {
  // Clear, mellow 'sine' ping (C5) for toasts, settings changes, general feedback
  playSoundWrapper('sine', 523.25, 0.07, 0.15);
}

export function speakText(
  textToSpeak: string, 
  onBoundary?: (event: SpeechSynthesisEvent) => void,
  onEnd?: () => void,
  onError?: (event: SpeechSynthesisErrorEvent) => void
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !window.speechSynthesis || !textToSpeak) {
    return null;
  }
  const { soundEffectsEnabled, speechRate, speechPitch, selectedVoiceURI } = useAppSettingsStore.getState();
  
  if (!soundEffectsEnabled) {
    return null;
  }

  try {
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;

    if (selectedVoiceURI) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.voiceURI === selectedVoiceURI);
      if (voice) {
        utterance.voice = voice;
      }
    }
    
    if (onBoundary) utterance.onboundary = onBoundary;
    
    // Centralized end handling
    const handleEnd = () => {
        if (onEnd) onEnd();
    };
    utterance.onend = handleEnd;

    // Centralized error handling
    const handleError = (event: SpeechSynthesisErrorEvent) => {
        if (event.error === 'interrupted' || event.error === 'canceled') {
            console.warn("Speech synthesis event in speakText:", event.error);
            // 'canceled' will also trigger 'onend', so specific handling for 'onend' ensures cleanup.
            // 'interrupted' might not always trigger 'onend' if it's a recoverable interruption by the browser,
            // but often it means the utterance stops. If onEnd is used for cleanup, it should handle this.
        } else {
            console.error("Speech synthesis error in speakText default handler:", event.error, event.utterance?.text.substring(event.charIndex));
        }
        if (onError) onError(event); // Call the provided error handler
    };
    utterance.onerror = handleError;


    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch (error) {
    console.error("Error in speakText setup:", error);
    if (onError) {
      // Simulate an error event if setup fails before an utterance object exists
      const synthErrorEvent = new SpeechSynthesisErrorEvent("error", {
          utterance: null as any, // No utterance object if setup failed early
          charIndex: 0,
          elapsedTime: 0,
          name: "",
          error: "setup_failed"
      });
      onError(synthErrorEvent);
    }
    return null;
  }
}

