
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
  // Sweet, soft, higher-pitched 'triangle' pluck (D#5)
  playSoundWrapper('triangle', 622.25, 0.02, 0.035); 
}

export function playSuccessSound(): void {
  // Slightly shorter, simpler ascending 'sine' sweep (C4 to E4)
  playSoundWrapper('sine', { start: 261.63, end: 329.63, bendDuration: 0.08 }, 0.07, 0.22);
}

export function playCompletionSound(): void {
  // More pronounced, celebratory melodic ascending 'sine' sweep (C4 to G4 to C5)
  // This will be a two-part sound for a more "complete" feel
  const { soundEffectsEnabled } = useAppSettingsStore.getState();
  if (!soundEffectsEnabled) return;

  playSoundInternal('sine', { start: 261.63, end: 392.00, bendDuration: 0.15 }, 0.09, 0.4); // C4 to G4
  setTimeout(() => {
    playSoundInternal('sine', { start: 392.00, end: 523.25, bendDuration: 0.12 }, 0.08, 0.3); // G4 to C5
  }, 120); 
  // Add a bright shimmer at the end
  setTimeout(() => {
    playSoundInternal('triangle', 1046.50, 0.05, 0.2); // C6
  }, 200);
}


export function playErrorSound(): void {
  // Less harsh descending 'square' wave buzz (A3 to F3)
  playSoundWrapper('square', { start: 220.00, end: 174.61, bendDuration: 0.12 }, 0.07, 0.35);
}

export function playNavigationSound(): void {
  // Gentle, short 'sine' wave pluck (A4)
  playSoundWrapper('sine', 440.00, 0.03, 0.08);
}

export function playNotificationSound(): void {
  // Brighter, two-tone 'triangle' ping for toasts, settings changes (G5 then C6)
  const { soundEffectsEnabled } = useAppSettingsStore.getState();
  if (!soundEffectsEnabled) return;
  playSoundInternal('triangle', 783.99, 0.05, 0.09); 
  setTimeout(() => {
    playSoundInternal('triangle', 1046.50, 0.04, 0.11); 
  }, 80); 
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
    // If sound effects (which includes speech) are off, call onEnd immediately if provided,
    // as the speech operation is effectively "ended" by not starting.
    if(onEnd) {
      onEnd();
    }
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
    // Ensure onEnd is called even if setup fails, to unblock any dependent logic
    if (onEnd) {
      onEnd();
    }
    return null;
  }
}




