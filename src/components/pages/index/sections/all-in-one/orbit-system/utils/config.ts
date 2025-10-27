// Types for particle system configuration
export type ArrangementType =
  | 'fibonacci'
  | 'spherical-lines'
  | 'spherical-rings'
  | 'spherical-spiral';

export type CameraType = 'perspective' | 'orthographic';

export type CameraPreset = 'frontal' | 'superior' | 'lateral' | 'isometric' | 'free';

export type AnimationType =
  | 'none'
  | 'enter-fade-bounce'
  | 'enter-wave-emerge'
  | 'enter-center-spawn'
  | 'enter-center-spawn-no-scale'
  | 'continuous-pulse'
  | 'continuous-float'
  | 'continuous-glow'
  | 'continuous-orbit'
  | 'continuous-spin'
  | 'continuous-breathe'
  | 'continuous-wave'
  | 'continuous-ripple'
  | 'loop-fade-bounce'
  | 'loop-center-spawn'
  | 'loop-wave-emerge'
  | 'loop-scatter-gather'
  | 'continuous-dna'
  | 'continuous-firefly';

export type AnimationDirection = 'clockwise' | 'counter-clockwise' | 'random';

export type TransitionEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

// Main configuration interface
export interface ParticleSystemSettings {
  // Particle arrangement
  arrangementType: ArrangementType;
  particleCount: number;
  numLines: number;
  particlesPerLine: number;
  numRings: number;
  maxParticlesPerRing: number;
  ringsRadius: number;
  spiralTurns: number;
  radius: number;
  particleSize: number;
  particleColor: string;

  // Animation
  continuousAnimation: boolean;
  animationSpeed: number;
  animationIntensity: number;
  animationType: AnimationType;
  animationDirection: AnimationDirection;
  animationPhase: number;
  animationAmplitude: number;

  // Arrangement Transitions
  arrangementTransitionsEnabled: boolean;
  transitionDuration: number;
  transitionEasing: TransitionEasing;

  // Object rotation
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  autoRotate: boolean;
  autoRotateSpeedX: number;
  autoRotateSpeedY: number;
  autoRotateSpeedZ: number;

  // Camera
  cameraType: CameraType;
  cameraPreset: CameraPreset;
  orbitControlsEnabled: boolean;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];

  // Visual effects
  backgroundColor: string;
  showGrid: boolean;

  // Bloom
  bloomEnabled: boolean;
  bloomThreshold: number;
  bloomStrength: number;
  bloomRadius: number;
  exposure: number;

  // Lens Cursor
  lensCursorEnabled: boolean;
  lensCursorSize: number;
  lensCursorDamping: number;
  lensCursorIor: number;
  lensCursorThickness: number;
  lensCursorChromaticAberration: number;
  lensCursorAnisotropy: number;
  lensCursorTransmission: number;
  lensCursorRoughness: number;
  lensCursorDistortion: number;
  lensCursorDistortionScale: number;
  lensCursorTemporalDistortion: number;
  lensCursorSamples: number;
  lensCursorBackside: boolean;
  lensCursorBacksideThickness: number;
  lensCursorTransmissionSampler: boolean;
  lensCursorResolution?: number;
  lensCursorBacksideResolution?: number;
  lensCursorBackground: string;

  // Orbital Texts - Layer 1
  orbitingTexts1: string[];
  showOrbitingTexts1: boolean;
  orbitingTextColor1: string;
  orbitingTextSize1: number;
  orbitingTextOffset1: number;

  // Orbital Texts - Layer 2
  orbitingTexts2: string[];
  showOrbitingTexts2: boolean;
  orbitingTextColor2: string;
  orbitingTextSize2: number;
  orbitingTextOffset2: number;

  // Responsive
  responsiveScale?: number;
}

// Default configuration values
export const DEFAULT_SETTINGS: ParticleSystemSettings = {
  // Particle arrangement
  arrangementType: 'fibonacci',
  particleCount: 200,
  numLines: 12,
  particlesPerLine: 20,
  numRings: 5,
  maxParticlesPerRing: 8,
  ringsRadius: 1,
  spiralTurns: 5,
  radius: 1,
  particleSize: 0.06,
  particleColor: '#2E15FE',

  // Animation
  continuousAnimation: false,
  animationSpeed: 1.0,
  animationIntensity: 0.3,
  animationType: 'none',
  animationDirection: 'clockwise',
  animationPhase: 0.2,
  animationAmplitude: 1.0,

  // Arrangement Transitions
  arrangementTransitionsEnabled: true,
  transitionDuration: 1.5,
  transitionEasing: 'ease-out',

  // Object rotation
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  autoRotate: true,
  autoRotateSpeedX: 0.0,
  autoRotateSpeedY: 0.5,
  autoRotateSpeedZ: 0.0,

  // Camera
  cameraType: 'orthographic',
  cameraPreset: 'free',
  orbitControlsEnabled: true,
  cameraPosition: [0, 0, 5],
  cameraTarget: [0, 0, 0],

  // Visual effects
  backgroundColor: '#ffffff',
  showGrid: true,

  // Bloom
  bloomEnabled: false,
  bloomThreshold: 0.5,
  bloomStrength: 1.5,
  bloomRadius: 0.4,
  exposure: 1.0,

  // Lens Cursor
  lensCursorEnabled: true,
  lensCursorSize: 1.0,
  lensCursorDamping: 0.15,
  lensCursorIor: 1.4,
  lensCursorThickness: 0.45,
  lensCursorChromaticAberration: 0.05,
  lensCursorAnisotropy: 0.1,
  lensCursorTransmission: 1.0,
  lensCursorRoughness: 0.001,
  lensCursorDistortion: 0.0,
  lensCursorDistortionScale: 0.5,
  lensCursorTemporalDistortion: 0.0,
  lensCursorSamples: 6,
  lensCursorBackside: false,
  lensCursorBacksideThickness: 0.0,
  lensCursorTransmissionSampler: false,
  lensCursorResolution: undefined,
  lensCursorBacksideResolution: undefined,
  lensCursorBackground: '#ffffff',

  // Orbital Texts - Layer 1
  orbitingTexts1: ['Text 1'],
  showOrbitingTexts1: false,
  orbitingTextColor1: '#2E15FE',
  orbitingTextSize1: 16,
  orbitingTextOffset1: 0.3,

  // Orbital Texts - Layer 2
  orbitingTexts2: ['Text 2'],
  showOrbitingTexts2: false,
  orbitingTextColor2: '#2E15FE',
  orbitingTextSize2: 14,
  orbitingTextOffset2: 0.25,
};

// Configuration presets for common use cases
export const PRESET_CONFIGS = {
  minimal: {
    ...DEFAULT_SETTINGS,
    particleCount: 20,
    particleSize: 0.1,
    showGrid: false,
    backgroundColor: '#000000',
  },

  showcase: {
    ...DEFAULT_SETTINGS,
    particleCount: 80,
    bloomEnabled: true,
    animationType: 'continuous-pulse' as AnimationType,
    continuousAnimation: true,
  },

  fibonacci_spiral: {
    ...DEFAULT_SETTINGS,
    arrangementType: 'fibonacci' as ArrangementType,
    particleCount: 144,
    animationType: 'continuous-orbit' as AnimationType,
    continuousAnimation: true,
  },

  spherical_dance: {
    ...DEFAULT_SETTINGS,
    arrangementType: 'spherical-spiral' as ArrangementType,
    animationType: 'continuous-dna' as AnimationType,
    continuousAnimation: true,
    spiralTurns: 8,
  }
};

// Utility functions for configuration management
export class ParticleConfigManager {
  private static STORAGE_KEY = 'particleSystemSettings';

  static save(settings: ParticleSystemSettings): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
  }

  static load(): ParticleSystemSettings | null {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  }

  static loadOrDefault(): ParticleSystemSettings {
    return this.load() || DEFAULT_SETTINGS;
  }

  static reset(): ParticleSystemSettings {
    localStorage.removeItem(this.STORAGE_KEY);
    return DEFAULT_SETTINGS;
  }

  static applyPreset(presetName: keyof typeof PRESET_CONFIGS): ParticleSystemSettings {
    return { ...PRESET_CONFIGS[presetName] };
  }
}