/**
 * Sonification Utilities
 * Audio representation of chart data for accessibility
 * Uses Web Audio API to create meaningful sound patterns
 */

export interface SonificationOptions {
  baseFrequency?: number; // Base frequency in Hz
  duration?: number; // Duration of each note in seconds
  volume?: number; // Volume (0-1)
  minFrequency?: number; // Minimum frequency for data mapping
  maxFrequency?: number; // Maximum frequency for data mapping
  useLogarithmicScale?: boolean; // Use logarithmic scale for frequency mapping
}

type AudioContextCtor = typeof AudioContext;
type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: AudioContextCtor;
  };

class SonificationPlayer {
  private audioContext: AudioContext | null;
  private isPlaying: boolean;
  private currentTimeout: NodeJS.Timeout | null;

  constructor() {
    this.audioContext = null;
    this.isPlaying = false;
    this.currentTimeout = null;
  }

  /**
   * Initialize audio context
   */
  private initializeAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioContextClass = this.getAudioContextClass();
      if (!AudioContextClass) {
        throw new Error('Web Audio API not available');
      }
      this.audioContext = new AudioContextClass();
    }
    return this.audioContext;
  }

  private getAudioContextClass(): AudioContextCtor | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const win = window as WindowWithWebkitAudio;
    return win.AudioContext || win.webkitAudioContext || null;
  }

  /**
   * Check if audio context is available
   */
  isAvailable(): boolean {
    try {
      return this.getAudioContextClass() !== null;
    } catch (e) {
      return false;
    }
  }

  /**
   * Stop any currently playing sonification
   */
  stop() {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    this.isPlaying = false;
  }

  /**
   * Play a single tone
   */
  playTone(frequency: number, duration: number = 0.2, volume: number = 0.5) {
    if (!this.isAvailable()) {
      console.warn('Web Audio API not available');
      return;
    }

    const audioContext = this.initializeAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  }

  /**
   * Map value to frequency range
   */
  private mapValueToFrequency(
    value: number,
    minValue: number,
    maxValue: number,
    minFreq: number = 220,
    maxFreq: number = 880,
    useLogScale: boolean = false
  ): number {
    // Handle edge cases
    if (minValue === maxValue) return (minFreq + maxFreq) / 2;
    if (value <= minValue) return minFreq;
    if (value >= maxValue) return maxFreq;

    // Normalize value to 0-1 range
    let normalized = (value - minValue) / (maxValue - minValue);

    // Apply logarithmic scale if requested
    if (useLogScale) {
      normalized = Math.pow(normalized, 0.5); // Square root for logarithmic feel
    }

    // Map to frequency range
    return minFreq + (maxFreq - minFreq) * normalized;
  }

  /**
   * Sonify a single data point
   */
  sonifyDataPoint(
    value: number,
    minValue: number,
    maxValue: number,
    options: SonificationOptions = {}
  ) {
    const {
      baseFrequency = 440,
      duration = 0.3,
      volume = 0.7,
      minFrequency = 220,
      maxFrequency = 880,
      useLogarithmicScale = true,
    } = options;

    const frequency = this.mapValueToFrequency(
      value,
      minValue,
      maxValue,
      minFrequency,
      maxFrequency,
      useLogarithmicScale
    );

    this.playTone(frequency, duration, volume);
  }

  /**
   * Sonify a trend (sequence of data points)
   */
  async sonifyTrend(
    values: number[],
    options: SonificationOptions & { delayBetweenNotes?: number } = {}
  ) {
    if (!this.isAvailable()) {
      console.warn('Web Audio API not available');
      return;
    }

    const {
      delayBetweenNotes = 150,
      ...sonificationOptions
    } = options;

    // Find min/max for normalization
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    this.isPlaying = true;

    for (let i = 0; i < values.length; i++) {
      if (!this.isPlaying) break;

      this.sonifyDataPoint(values[i], minValue, maxValue, sonificationOptions);

      // Wait before playing next note
      await new Promise(resolve => {
        this.currentTimeout = setTimeout(resolve, delayBetweenNotes);
      });
    }

    this.isPlaying = false;
  }

  /**
   * Sonify progress toward goal
   */
  sonifyGoalProgress(
    currentValue: number,
    goalValue: number,
    options: SonificationOptions = {}
  ) {
    const progress = Math.min(1, Math.max(0, currentValue / goalValue));
    
    // Use a rising scale to represent progress
    const frequency = 220 + (880 - 220) * progress;
    const duration = 0.5 + progress * 0.5; // Longer duration for higher progress
    
    this.playTone(frequency, duration, options.volume || 0.7);
    
    // Add a second tone for harmony if progress is good
    if (progress > 0.7) {
      setTimeout(() => {
        this.playTone(frequency * 1.5, duration * 0.8, (options.volume || 0.7) * 0.6);
      }, 100);
    }
  }

  /**
   * Sonify portfolio performance
   */
  sonifyPortfolioPerformance(
    currentValue: number,
    initialValue: number,
    options: SonificationOptions = {}
  ) {
    const gain = currentValue - initialValue;
    const gainPercent = initialValue > 0 ? gain / initialValue : 0;

    // Different sounds for positive vs negative performance
    if (gainPercent > 0) {
      // Positive performance - ascending scale
      const frequency = 440 + Math.min(400, gainPercent * 1000); // Cap at reasonable frequency
      this.playTone(frequency, 0.4, options.volume || 0.7);
      
      // Add harmony for good performance
      if (gainPercent > 0.1) {
        setTimeout(() => {
          this.playTone(frequency * 1.25, 0.3, (options.volume || 0.7) * 0.5);
        }, 150);
      }
    } else {
      // Negative performance - descending scale with lower frequencies
      const frequency = 220 - Math.min(100, Math.abs(gainPercent) * 500);
      this.playTone(frequency, 0.6, options.volume || 0.7);
    }
  }

  /**
   * Create a melody representing data trends
   */
  async createDataMelody(
    values: number[],
    options: SonificationOptions & { 
      notesPerDataPoint?: number;
      melodyType?: 'arpeggio' | 'scale' | 'harmony';
      delayBetweenNotes?: number;
    } = {}
  ) {
    if (!this.isAvailable()) {
      console.warn('Web Audio API not available');
      return;
    }

    const {
      notesPerDataPoint = 1,
      melodyType = 'scale',
      delayBetweenNotes = 200,
      ...sonificationOptions
    } = options;

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    this.isPlaying = true;

    for (let i = 0; i < values.length; i++) {
      if (!this.isPlaying) break;

      const value = values[i];
      const baseFrequency = this.mapValueToFrequency(
        value,
        minValue,
        maxValue,
        sonificationOptions.minFrequency,
        sonificationOptions.maxFrequency,
        sonificationOptions.useLogarithmicScale
      );

      // Create melody based on type
      if (melodyType === 'arpeggio') {
        // Play multiple notes in quick succession
        const frequencies = [baseFrequency, baseFrequency * 1.5, baseFrequency * 2];
        for (let j = 0; j < frequencies.length; j++) {
          this.playTone(frequencies[j], 0.15, (sonificationOptions.volume || 0.7) * 0.8);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else if (melodyType === 'harmony') {
        // Play base note with harmony
        this.playTone(baseFrequency, 0.3, sonificationOptions.volume || 0.7);
        setTimeout(() => {
          this.playTone(baseFrequency * 1.5, 0.25, (sonificationOptions.volume || 0.7) * 0.6);
        }, 50);
        await new Promise(resolve => setTimeout(resolve, delayBetweenNotes));
      } else {
        // Simple scale
        this.playTone(baseFrequency, sonificationOptions.duration || 0.3, sonificationOptions.volume || 0.7);
        await new Promise(resolve => setTimeout(resolve, delayBetweenNotes));
      }
    }

    this.isPlaying = false;
  }

  /**
   * Sonify milestone achievement
   */
  sonifyMilestoneAchievement(milestone: string, progress: number) {
    if (progress >= 1) {
      // Achievement sound - ascending scale
      const frequencies = [440, 523.25, 659.25, 783.99]; // C, E, G, B
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          this.playTone(freq, 0.2, 0.8);
        }, index * 150);
      });
    } else if (progress >= 0.75) {
      // Close to achievement - encouraging sound
      this.playTone(659.25, 0.3, 0.7); // E
      setTimeout(() => {
        this.playTone(783.99, 0.2, 0.6); // G
      }, 200);
    } else if (progress >= 0.5) {
      // Halfway - steady sound
      this.playTone(523.25, 0.4, 0.6); // C
    } else {
      // Early progress - lower sound
      this.playTone(392, 0.3, 0.5); // G below middle C
    }
  }

  /**
   * Clean up audio context
   */
  cleanup() {
    this.stop();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {
        console.warn('Error closing audio context:', e);
      }
      this.audioContext = null;
    }
  }
}

// Singleton instance
let sonificationPlayer: SonificationPlayer | null = null;

/**
 * Get singleton sonification player instance
 */
export function getSonificationPlayer(): SonificationPlayer {
  if (!sonificationPlayer) {
    sonificationPlayer = new SonificationPlayer();
  }
  return sonificationPlayer;
}

/**
 * Sonify investment goal progress
 */
export function sonifyInvestmentGoalProgress(
  currentValue: number,
  goalValue: number,
  options: SonificationOptions = {}
) {
  const player = getSonificationPlayer();
  player.sonifyGoalProgress(currentValue, goalValue, options);
}

/**
 * Sonify portfolio trend
 */
export function sonifyPortfolioTrend(
  values: number[],
  options: SonificationOptions = {}
) {
  const player = getSonificationPlayer();
  player.sonifyTrend(values, options);
}

/**
 * Sonify milestone achievement
 */
export function sonifyMilestone(
  milestone: string,
  progress: number,
  options: SonificationOptions = {}
) {
  const player = getSonificationPlayer();
  player.sonifyMilestoneAchievement(milestone, progress);
}

/**
 * Create melody from projection data
 */
export async function createProjectionMelody(
  projectionData: { value: number; date: string }[],
  options: SonificationOptions = {}
) {
  const player = getSonificationPlayer();
  const values = projectionData.map(d => d.value);
  await player.createDataMelody(values, { ...options, melodyType: 'scale' });
}

/**
 * Check if sonification is supported
 */
export function isSonificationSupported(): boolean {
  const player = getSonificationPlayer();
  return player.isAvailable();
}
