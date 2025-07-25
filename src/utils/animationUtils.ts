import { AccessibilityInfo } from 'react-native';
import { withTiming, withSpring, ReduceMotion } from 'react-native-reanimated';

/**
 * Animation utility functions that respect user's reduced motion preferences
 */
export class AnimationUtils {
  private static isReducedMotionEnabled: boolean | null = null;

  /**
   * Check if reduced motion is enabled on the device
   */
  static async checkReducedMotionEnabled(): Promise<boolean> {
    try {
      const isEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      this.isReducedMotionEnabled = isEnabled;
      return isEnabled;
    } catch (error) {
      console.warn('Could not check reduced motion setting:', error);
      return false;
    }
  }

  /**
   * Get cached reduced motion setting or check it
   */
  static async getReducedMotionSetting(): Promise<boolean> {
    if (this.isReducedMotionEnabled === null) {
      return await this.checkReducedMotionEnabled();
    }
    return this.isReducedMotionEnabled;
  }

  /**
   * Create a spring animation that respects reduced motion settings
   */
  static createSpringAnimation(
    toValue: number,
    config: {
      duration?: number;
      dampingRatio?: number;
      stiffness?: number;
    } = {}
  ) {
    return withSpring(toValue, {
      duration: config.duration,
      dampingRatio: config.dampingRatio,
      stiffness: config.stiffness,
      reduceMotion: ReduceMotion.System, // Respect system settings
    });
  }

  /**
   * Create a timing animation that respects reduced motion settings
   */
  static createTimingAnimation(
    toValue: number,
    config: {
      duration?: number;
      easing?: any;
    } = {}
  ) {
    return withTiming(toValue, {
      duration: config.duration || 300,
      ...config,
      reduceMotion: ReduceMotion.System, // Respect system settings
    });
  }

  /**
   * Get animation duration based on reduced motion setting
   */
  static getAnimationDuration(normalDuration: number, reducedDuration: number = 0): number {
    return this.isReducedMotionEnabled ? reducedDuration : normalDuration;
  }

  /**
   * Get animation config for Moti components
   */
  static getMotiAnimationConfig(isReducedMotion?: boolean) {
    const reduced = isReducedMotion ?? this.isReducedMotionEnabled ?? false;
    
    return {
      duration: reduced ? 0 : 600,
      type: reduced ? 'timing' as const : 'spring' as const,
      delay: reduced ? 0 : undefined,
    };
  }

  /**
   * Initialize animation utils - call this in your app startup
   */
  static async initialize(): Promise<void> {
    await this.checkReducedMotionEnabled();
    
    // Listen for changes in accessibility settings
    AccessibilityInfo.addEventListener('reduceMotionChanged', (isEnabled) => {
      this.isReducedMotionEnabled = isEnabled;
    });
  }
}
