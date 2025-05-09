
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
  playSoundWrapper('triangle', 200, 0.05, 0.05); 
}

export function playSuccessSound(): void {
  playSoundWrapper('sine', { start: 600, end: 880, bendDuration: 0.05 }, 0.15, 0.2);
}

export function playErrorSound(): void {
  playSoundWrapper('square', { start: 150, end: 100, bendDuration: 0.1 }, 0.15, 0.25);
}

export function playNavigationSound(): void {
  playSoundWrapper('sine', 350, 0.08, 0.05);
}

export function playNotificationSound(): void {
  playSoundWrapper('triangle', 500, 0.12, 0.1);
}

export function speakText(textToSpeak: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis || !textToSpeak) {
    return;
  }
  const soundEffectsEnabled = useAppSettingsStore.getState().soundEffectsEnabled;
  if (!soundEffectsEnabled) {
    // If general sound effects are off, don't speak either.
    // Could be a separate setting in the future.
    return;
  }

  try {
    // Cancel any ongoing speech to prevent overlap
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    // utterance.lang = 'en-US'; // Optional: specify language if needed
    // utterance.rate = 1; // Optional: control speed
    // utterance.pitch = 1; // Optional: control pitch
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error("Error in speakText:", error);
    // Optionally, provide feedback to the user if speech synthesis fails
  }
}
