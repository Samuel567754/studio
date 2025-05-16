
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
  playSoundWrapper('triangle', 622.25, 0.02, 0.035);
}

export function playSuccessSound(): void {
  playSoundWrapper('sine', { start: 261.63, end: 329.63, bendDuration: 0.08 }, 0.07, 0.22);
}

export function playCompletionSound(): void {
  const { soundEffectsEnabled } = useAppSettingsStore.getState();
  if (!soundEffectsEnabled) return;

  playSoundInternal('sine', { start: 261.63, end: 392.00, bendDuration: 0.15 }, 0.09, 0.4);
  setTimeout(() => {
    playSoundInternal('sine', { start: 392.00, end: 523.25, bendDuration: 0.12 }, 0.08, 0.3);
  }, 120);
  setTimeout(() => {
    playSoundInternal('triangle', 1046.50, 0.05, 0.2);
  }, 200);
}

export function playErrorSound(): void {
  playSoundWrapper('square', { start: 220.00, end: 174.61, bendDuration: 0.12 }, 0.07, 0.35);
}

export function playNavigationSound(): void {
  playSoundWrapper('sine', 440.00, 0.03, 0.08);
}

export function playNotificationSound(): void {
  const { soundEffectsEnabled } = useAppSettingsStore.getState();
  if (!soundEffectsEnabled) return;
  playSoundInternal('triangle', 783.99, 0.05, 0.09);
  setTimeout(() => {
    playSoundInternal('triangle', 1046.50, 0.04, 0.11);
  }, 80);
}

export function playCoinsEarnedSound(): void {
  const { soundEffectsEnabled } = useAppSettingsStore.getState();
  if (!soundEffectsEnabled) return;
  // Coin sound: a short, metallic "ching"
  playSoundInternal('triangle', { start: 1200, end: 1800, bendDuration: 0.03 }, 0.05, 0.12);
  setTimeout(() => {
    playSoundInternal('sine', 1500, 0.03, 0.08);
  }, 25);
}

export function playCoinsDeductedSound(): void {
  const { soundEffectsEnabled } = useAppSettingsStore.getState();
  if (!soundEffectsEnabled) return;
  // Lower pitch, slightly dissonant or "whoosh down"
  playSoundInternal('sawtooth', { start: 300, end: 150, bendDuration: 0.15 }, 0.06, 0.3);
  setTimeout(() => {
    playSoundInternal('square', 140, 0.04, 0.1);
  }, 50);
}


export function playAchievementUnlockedSound(): void {
  const { soundEffectsEnabled } = useAppSettingsStore.getState();
  if (!soundEffectsEnabled) return;
  // More significant, multi-tone celebratory sound
  playSoundInternal('sine', { start: 329.63, end: 440.00, bendDuration: 0.1 }, 0.08, 0.3); // E4 to A4
  setTimeout(() => {
    playSoundInternal('sine', { start: 440.00, end: 523.25, bendDuration: 0.1 }, 0.07, 0.3); // A4 to C5
  }, 100);
  setTimeout(() => {
    playSoundInternal('triangle', { start: 523.25, end: 659.25, bendDuration: 0.15 }, 0.06, 0.4); // C5 to E5
  }, 200);
  setTimeout(() => {
    playSoundInternal('triangle', 1046.50, 0.05, 0.25); // High C6
  }, 300);
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
    if (onEnd) onEnd(); 
    return null;
  }
  const { soundEffectsEnabled, speechRate, speechPitch, selectedVoiceURI } = useAppSettingsStore.getState();

  if (!soundEffectsEnabled) {
    if(onEnd) {
      onEnd();
    }
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

    const handleEnd = () => {
        if (onEnd) onEnd();
    };
    utterance.onend = handleEnd;

    const handleError = (event: SpeechSynthesisErrorEvent) => {
        if (onError) {
          onError(event);
        } else {
           if (event.error && event.error !== 'interrupted' && event.error !== 'canceled') {
             console.error("Unhandled Speech synthesis error in speakText:", event.error, event.utterance?.text.substring(event.charIndex));
           }
        }
        // Ensure onEnd is called even if there's an error, to prevent hangs in chained audio.
        if (onEnd) onEnd();
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
    if (onEnd) {
      onEnd();
    }
    return null;
  }
}
