
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
  // Short, crisp, slightly higher-pitched 'triangle' pluck (C5)
  playSoundWrapper('triangle', 523.25, 0.025, 0.04); 
}

export function playSuccessSound(): void {
  // More distinct ascending 'sawtooth' sweep for positive confirmation
  playSoundWrapper('sawtooth', { start: 500, end: 900, bendDuration: 0.08 }, 0.12, 0.25);
}

export function playErrorSound(): void {
  // More noticeable 'sawtooth' buzz, quick decay for error
  playSoundWrapper('sawtooth', { start: 180, end: 80, bendDuration: 0.08 }, 0.18, 0.3);
}

export function playNavigationSound(): void {
  // Softer, slightly longer 'triangle' wave for non-button navigation (e.g., next/prev word)
  playSoundWrapper('triangle', { start: 350, end: 500, bendDuration: 0.06 }, 0.035, 0.12);
}

export function playNotificationSound(): void {
  // Brighter, two-tone 'sine' ping for toasts, settings changes
  // Play first tone
  playSoundInternal('sine', 783.99, 0.06, 0.1); // G5
  // Play second tone slightly delayed and higher
  setTimeout(() => {
    playSoundInternal('sine', 987.77, 0.05, 0.12); // B5
  }, 70); // 70ms delay
}

export function speakText(
  textToSpeak: string, 
  onBoundary?: (event: SpeechSynthesisEvent) => void,
  onEnd?: () => void,
  onError?: (event: SpeechSynthesisErrorEvent) => void
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !window.speechSynthesis || !textToSpeak.trim()) {
    if (onError && textToSpeak.trim() === '') {
       const emptyTextError = new SpeechSynthesisErrorEvent("error", {
          utterance: null as any, charIndex: 0, elapsedTime: 0, name: "", error: "empty-text"
      });
      onError(emptyTextError);
    }
    return null;
  }
  const { soundEffectsEnabled, speechRate, speechPitch, selectedVoiceURI } = useAppSettingsStore.getState();
  
  if (!soundEffectsEnabled) {
    return null;
  }

  try {
    // It's important to cancel before creating a new utterance if there's a chance
    // an old one is speaking or paused, as some browsers handle queueing differently.
    window.speechSynthesis.cancel(); 
    
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
        // The calling component (e.g., ReadingPractice) will decide how to log/toast.
        // We just forward the event.
        if (onError) {
          onError(event);
        } else {
          // Fallback console logging if no specific onError handler is provided
           if (event.error && event.error !== 'interrupted' && event.error !== 'canceled') {
             console.error("Unhandled Speech synthesis error in speakText:", event.error, event.utterance?.text.substring(event.charIndex));
           } else if (event.error) {
             console.warn("Unhandled Speech synthesis event (interrupted/canceled) in speakText:", event.error);
           }
        }
    };
    utterance.onerror = handleError;


    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch (error) {
    console.error("Error in speakText setup:", error);
    if (onError) {
      const synthErrorEvent = new SpeechSynthesisErrorEvent("error", {
          utterance: null as any, 
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


