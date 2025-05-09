
'use client';

// Helper function to create and play a sound
const playSound = (
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
        // Ensure end frequency is not zero for exponential ramp
        const targetFrequency = frequencyConfig.end === 0 ? 0.0001 : frequencyConfig.end;
        if (rampType === 'linear') {
             oscillator.frequency.linearRampToValueAtTime(targetFrequency, audioContext.currentTime + frequencyConfig.bendDuration);
        } else {
             oscillator.frequency.exponentialRampToValueAtTime(targetFrequency, audioContext.currentTime + frequencyConfig.bendDuration);
        }
      }
    }
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    // Ensure target gain is not zero for exponential ramp
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);


    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }
};

// Existing click sound - made quieter and shorter
export function playClickSound(): void {
  playSound('triangle', 200, 0.05, 0.05); 
}

// New sounds
export function playSuccessSound(): void {
  // A pleasant, short, ascending chime
  playSound('sine', { start: 600, end: 880, bendDuration: 0.05 }, 0.15, 0.2);
}

export function playErrorSound(): void {
  // A short, low, slightly dissonant buzz
  playSound('square', { start: 150, end: 100, bendDuration: 0.1 }, 0.15, 0.25);
}

export function playNavigationSound(): void {
  // A very subtle, short "tick"
  playSound('sine', 350, 0.08, 0.05);
}

export function playNotificationSound(): void {
  // A neutral, clear "pop" or "ding"
  playSound('triangle', 500, 0.12, 0.1);
}
