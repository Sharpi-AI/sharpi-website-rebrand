import * as THREE from 'three';
import { Group } from 'three';
import { Lens } from './lens';
import { ParticleSystem } from './particle-system';
import type { ParticleSystemSettings } from './config';

export type AnimationStage = 'idle' | 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'completed' | 'returning';

export interface LensParticleSystemOptions {
  // Animation controls
  stage1Duration?: number;
  stage2Duration?: number;
  stage3Duration?: number;
  stage4Duration?: number;
  stage1Scale?: number;
  stage2Scale?: number;
  stage3Scale?: number;
  stage4Scale?: number;
  finalScale?: number;
  initialScale?: number;
  returnDelay?: number;
  returnDuration?: number;
  autoLoop?: boolean;


  // Lens cursor properties
  lensCursorSize?: number;
  lensCursorIor?: number;
  lensCursorThickness?: number;
  lensCursorChromaticAberration?: number;
  lensCursorAnisotropy?: number;
  lensCursorTransmission?: number;
  lensCursorRoughness?: number;
  lensCursorDistortion?: number;
  lensCursorDistortionScale?: number;
  lensCursorTemporalDistortion?: number;
  lensCursorSamples?: number;
  lensCursorBackside?: boolean;
  lensCursorBacksideThickness?: number;
  lensCursorTransmissionSampler?: boolean;
  lensCursorResolution?: number;
  lensCursorBacksideResolution?: number;
  lensCursorBackground?: string;
  lensCursorBackgroundScale?: number;

  // Particle system settings
  particleSettings: ParticleSystemSettings;

  // Pulse controls
  pulseEnabled?: boolean;
  pulseMinScale?: number;
  pulseMaxScale?: number;
  pulseSpeed?: number;

  // Transition controls
  smoothingFactor?: number;

  // Global timing control
  useGlobalTiming?: boolean;

  // Responsive scaling
  responsiveScale?: number;

  // Callbacks
  onStageChange?: (stage: AnimationStage) => void;
  onAnimationComplete?: () => void;
  onReset?: () => void;
}

export class LensParticleSystem {
  private group: Group;
  private lens: Lens;
  private particleSystem: ParticleSystem;
  private options: Required<Omit<LensParticleSystemOptions, 'onStageChange' | 'onAnimationComplete' | 'onReset'>> & {
    onStageChange?: (stage: AnimationStage) => void;
    onAnimationComplete?: () => void;
    onReset?: () => void;
  };

  // Animation state
  private currentStage: AnimationStage = 'idle';
  private stageStartTime: number = 0;
  private targetScale: number;
  private currentScale: number;
  private targetParticleScale: number;
  private currentParticleScale: number;
  private loopCount: number = 0;
  private isAnimating: boolean = false;

  // Global timing state
  private isUsingGlobalTiming: boolean = false;

  // Pulse state
  private pulseTime: number = 0;

  // Timing
  private returnTimeout: number | null = null;

  constructor(options: LensParticleSystemOptions) {
    // Detect if mobile internally
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Extract responsiveScale before merging options
    const responsiveScale = options.responsiveScale ?? 1.0;

    this.options = {
      // Animation defaults with longer durations for smoother experience
      stage1Duration: 3,
      stage2Duration: 3,
      stage3Duration: 3,
      stage4Duration: 3,
      stage1Scale: 0.5,
      stage2Scale: 0.8,
      stage3Scale: 1.1,
      stage4Scale: 1.4,
      finalScale: 1.6,
      initialScale: 0.5,
      returnDelay: 3000,
      returnDuration: 1.2,
      autoLoop: true,


      // Lens defaults
      lensCursorSize: 1.5,
      lensCursorIor: 1.34,
      lensCursorThickness: 1.36,
      lensCursorChromaticAberration: 0.0,
      lensCursorAnisotropy: 0.1,
      lensCursorTransmission: 1.0,
      lensCursorRoughness: 0.0,
      lensCursorDistortion: 0.0,
      lensCursorDistortionScale: 0.5,
      lensCursorTemporalDistortion: 0.0,
      lensCursorSamples: 6,
      lensCursorBackside: false,
      lensCursorBacksideThickness: 0.0,
      lensCursorTransmissionSampler: false,
      lensCursorResolution: 1024,
      lensCursorBacksideResolution: 1024,
      lensCursorBackground: '#ffffff',

      // Pulse defaults with gentler breathing effect
      pulseEnabled: true, // Disabled by default to focus on stage transitions
      pulseMinScale: 0.98,
      pulseMaxScale: 1.02,
      pulseSpeed: 0.01,

      // Transition defaults
      smoothingFactor: 1.5,

      // Global timing defaults
      useGlobalTiming: false,

      // Responsive scale
      responsiveScale: 1.0,

      ...options
    };

    // Apply responsiveScale to relevant values only if mobile
    if (isMobile) {
      this.options.stage1Scale *= responsiveScale;
      this.options.stage2Scale *= responsiveScale;
      this.options.stage3Scale *= responsiveScale;
      this.options.stage4Scale *= responsiveScale;
      this.options.finalScale *= responsiveScale;
      this.options.initialScale *= responsiveScale;
      this.options.lensCursorSize *= responsiveScale;

      // Apply responsiveScale to particle settings particleSize
      if (this.options.particleSettings) {
        this.options.particleSettings = {
          ...this.options.particleSettings,
          particleSize: (this.options.particleSettings.particleSize ?? 0) * responsiveScale,
        };
      }
    }

    // Pass responsiveScale to particle settings so ParticleSystem can handle radius scaling
    if (this.options.particleSettings) {
      this.options.particleSettings = {
        ...this.options.particleSettings,
        responsiveScale: responsiveScale,
      };
    }

    this.targetScale = this.options.initialScale;
    this.currentScale = this.options.initialScale;
    this.targetParticleScale = this.options.initialScale;
    this.currentParticleScale = this.options.initialScale;
    this.isUsingGlobalTiming = this.options.useGlobalTiming;

    // Create group
    this.group = new Group();
    this.group.scale.setScalar(this.options.initialScale);

    // Create lens cursor
    this.lens = new Lens({
      size: this.options.lensCursorSize,
      ior: this.options.lensCursorIor,
      thickness: this.options.lensCursorThickness,
      chromaticAberration: this.options.lensCursorChromaticAberration,
      anisotropy: this.options.lensCursorAnisotropy,
      transmission: this.options.lensCursorTransmission,
      roughness: this.options.lensCursorRoughness,
      distortion: this.options.lensCursorDistortion,
      distortionScale: this.options.lensCursorDistortionScale,
      temporalDistortion: this.options.lensCursorTemporalDistortion,
      samples: this.options.lensCursorSamples,
      backside: this.options.lensCursorBackside,
      backsideThickness: this.options.lensCursorBacksideThickness,
      transmissionSampler: this.options.lensCursorTransmissionSampler,
      resolution: this.options.lensCursorResolution,
      backsideResolution: this.options.lensCursorBacksideResolution,
      background: this.options.lensCursorBackground,
      backgroundScale: this.options.lensCursorBackgroundScale,
      enabled: true
    });

    // Create particle system
    this.particleSystem = new ParticleSystem({...this.options.particleSettings, autoRotateSpeedY: 8});

    // Add particle system to lens scene
    this.lens.addChild(this.particleSystem.getGroup());

    // Add lens to main group
    this.group.add(this.lens.getMainScene().children[0]); // Add the lens mesh

  }

  public startAnimation(): void {
    if (this.currentStage === 'idle') {
      this.isAnimating = true;
      this.currentStage = 'stage1';
      this.stageStartTime = Date.now();
      this.targetScale = this.options.stage1Scale;
      this.options.onStageChange?.('stage1');
    }
  }

  public stopAnimation(): void {
    this.isAnimating = false;
    this.resetAnimation();
  }

  private resetAnimation(): void {
    this.currentStage = 'idle';
    this.targetScale = this.options.initialScale;
    this.targetParticleScale = this.options.initialScale;
    this.loopCount = 0;

    // Clear timeout if exists
    if (this.returnTimeout) {
      window.clearTimeout(this.returnTimeout);
      this.returnTimeout = null;
    }

    this.options.onReset?.();
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private updateWithGlobalTiming(deltaTime: number, globalElapsed: number, globalStage: AnimationStage): void {
    // Handle stage changes based on global timing
    if (globalStage !== this.currentStage) {
      this.currentStage = globalStage;
      this.options.onStageChange?.(globalStage);

      // Set target scale based on global stage
      switch (globalStage) {
        case 'stage1':
          this.targetScale = this.options.stage1Scale;
          this.targetParticleScale = this.options.stage1Scale;
          break;
        case 'stage2':
          this.targetScale = this.options.stage2Scale;
          this.targetParticleScale = this.options.stage2Scale;
          break;
        case 'stage3':
          this.targetScale = this.options.stage3Scale;
          this.targetParticleScale = this.options.stage3Scale;
          break;
        case 'stage4':
          this.targetScale = this.options.stage4Scale;
          this.targetParticleScale = this.options.stage4Scale;
          break;
        case 'completed':
          this.targetScale = this.options.finalScale;
          this.targetParticleScale = this.options.finalScale;
          this.options.onAnimationComplete?.();
          break;
        case 'returning':
          this.targetScale = this.options.initialScale;
          this.targetParticleScale = this.options.initialScale;
          break;
        case 'idle':
          this.targetScale = this.options.initialScale;
          this.targetParticleScale = this.options.initialScale;
          break;
      }
    }

    // Calculate pulse multiplier with smoother breathing effect
    let pulseMultiplier = 1;
    if (this.options.pulseEnabled) {
      const pulseValue = (Math.sin(this.pulseTime * this.options.pulseSpeed * Math.PI * 2) + 1) / 2;
      pulseMultiplier = this.options.pulseMinScale + (this.options.pulseMaxScale - this.options.pulseMinScale) * pulseValue;
      this.pulseTime += deltaTime;
    }

    const finalScale = this.targetScale * pulseMultiplier;

    // Smooth scale interpolation with configurable easing
    const smoothingFactor = 1 - Math.exp(-deltaTime * this.options.smoothingFactor);
    this.currentScale = this.lerp(this.currentScale, finalScale, smoothingFactor);
    this.group.scale.setScalar(this.currentScale);

    // Apply particle scale
    this.currentParticleScale = this.lerp(this.currentParticleScale, this.targetParticleScale, smoothingFactor);
    this.particleSystem.getGroup().scale.setScalar(this.currentParticleScale);

    // Update lens cursor and particle system
    this.lens.update(deltaTime);
    this.particleSystem.update(deltaTime);
  }


  public update(deltaTime: number, globalElapsed?: number, globalStage?: AnimationStage): void {
    if (this.isUsingGlobalTiming && globalElapsed !== undefined && globalStage !== undefined) {
      this.updateWithGlobalTiming(deltaTime, globalElapsed, globalStage);
      return;
    }

    if (!this.isAnimating) return;

    const now = Date.now();
    const elapsed = (now - this.stageStartTime) / 1000;

    // Calculate pulse multiplier with smoother breathing effect
    let pulseMultiplier = 1;
    if (this.options.pulseEnabled) {
      // Use smooth sine wave instead of absolute sine for natural breathing
      const pulseValue = (Math.sin(this.pulseTime * this.options.pulseSpeed * Math.PI * 2) + 1) / 2;
      pulseMultiplier = this.options.pulseMinScale + (this.options.pulseMaxScale - this.options.pulseMinScale) * pulseValue;
      this.pulseTime += deltaTime;
    }

    const finalScale = this.targetScale * pulseMultiplier;

    // Smooth scale interpolation with configurable easing
    const smoothingFactor = 1 - Math.exp(-deltaTime * this.options.smoothingFactor);
    this.currentScale = this.lerp(this.currentScale, finalScale, smoothingFactor);
    this.group.scale.setScalar(this.currentScale);

    // Apply particle scale
    this.currentParticleScale = this.lerp(this.currentParticleScale, this.targetParticleScale, smoothingFactor);
    this.particleSystem.getGroup().scale.setScalar(this.currentParticleScale);

    // Update lens cursor
    this.lens.update(deltaTime);

    // Update particle system
    this.particleSystem.update(deltaTime);

    // Stage progression logic
    switch (this.currentStage) {
      case 'stage1':
        if (elapsed >= this.options.stage1Duration) {
          this.currentStage = 'stage2';
          this.stageStartTime = now;
          this.targetScale = this.options.stage2Scale;
          this.targetParticleScale = this.options.stage2Scale;
          this.options.onStageChange?.('stage2');
        }
        break;

      case 'stage2':
        if (elapsed >= this.options.stage2Duration) {
          this.currentStage = 'stage3';
          this.stageStartTime = now;
          this.targetScale = this.options.stage3Scale;
          this.targetParticleScale = this.options.stage3Scale;
          this.options.onStageChange?.('stage3');
        }
        break;

      case 'stage3':
        if (elapsed >= this.options.stage3Duration) {
          this.currentStage = 'stage4';
          this.stageStartTime = now;
          this.targetScale = this.options.stage4Scale;
          this.targetParticleScale = this.options.stage4Scale;
          this.options.onStageChange?.('stage4');
        }
        break;

      case 'stage4':
        if (elapsed >= this.options.stage4Duration) {
          this.currentStage = 'completed';
          this.targetScale = this.options.finalScale;
          this.targetParticleScale = this.options.finalScale;
          this.options.onStageChange?.('completed');
          this.options.onAnimationComplete?.();

          if (this.options.autoLoop) {
            // Transition to returning stage after delay
            this.returnTimeout = window.setTimeout(() => {
              if (this.isAnimating) {
                this.currentStage = 'returning';
                this.stageStartTime = Date.now();
                this.targetScale = this.options.initialScale;
                this.targetParticleScale = this.options.initialScale;
                this.options.onStageChange?.('returning');
              }
            }, this.options.returnDelay);
          }
        }
        break;

      case 'returning':
        if (elapsed >= this.options.returnDuration) {
          // Start new loop
          this.currentStage = 'stage1';
          this.stageStartTime = Date.now();
          this.targetScale = this.options.stage1Scale;
          this.targetParticleScale = this.options.stage1Scale;
          this.loopCount += 1;
          this.options.onStageChange?.('stage1');
        }
        break;
    }
  }

  public render(renderer: THREE.WebGLRenderer, camera: THREE.Camera, scene: THREE.Scene): void {
    // Render lens cursor with all the content inside
    this.lens.render(renderer, camera, scene);
  }

  public getGroup(): Group {
    return this.group;
  }

  public getCurrentStage(): AnimationStage {
    return this.currentStage;
  }

  public getCurrentScale(): number {
    return this.currentScale;
  }

  public getTargetScale(): number {
    return this.targetScale;
  }

  public getLoopCount(): number {
    return this.loopCount;
  }

  public isCurrentlyAnimating(): boolean {
    return this.isAnimating;
  }

  public getLensCursor(): Lens {
    return this.lens;
  }

  public initializeForGlobalTiming(): void {
    this.isUsingGlobalTiming = true;
    this.isAnimating = true; // Always active when using global timing
    this.currentStage = 'idle';
    this.targetScale = this.options.initialScale;
    this.currentScale = this.options.initialScale;
    this.targetParticleScale = this.options.initialScale;
    this.currentParticleScale = this.options.initialScale;
  }

  public updateOptions(newOptions: Partial<LensParticleSystem>): void {
    this.options = { ...this.options, ...newOptions };

    // Update lens cursor options
    const lensOptions: any = {};
    Object.keys(newOptions).forEach(key => {
      if (key.startsWith('lensCursor')) {
        const lensKey = key.replace('lensCursor', '').toLowerCase();
        lensOptions[lensKey] = (newOptions as any)[key];
      }
    });

    if (Object.keys(lensOptions).length > 0) {
      this.lens.updateOptions(lensOptions);
    }


  }

  public dispose(): void {
    // Clear timeout if exists
    if (this.returnTimeout) {
      window.clearTimeout(this.returnTimeout);
      this.returnTimeout = null;
    }

    // Dispose components
    this.lens.dispose();
    this.particleSystem.dispose();
  }
}