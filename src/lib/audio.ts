
'use client';

export function playClickSound(): void {
  if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create oscillator and gain node
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect oscillator to gain node to control volume
    oscillator.connect(gainNode);
    // Connect gain node to destination (speakers)
    gainNode.connect(audioContext.destination);

    // Configure oscillator
    oscillator.type = 'triangle'; // Triangle wave for a softer, more "click-like" sound than sine
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime); // Low pitch for a subtle click/thump

    // Configure gain (volume)
    // Start with a small volume and quickly ramp down to create a "click" effect
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime); // Initial volume
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.1); // Decay quickly

    // Start and stop the sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1); // Sound duration of 100ms
  }
}
