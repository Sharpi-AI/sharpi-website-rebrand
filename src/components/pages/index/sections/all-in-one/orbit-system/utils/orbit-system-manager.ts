import * as THREE from 'three';
import { OrbitingSpheres, type AnimationStage } from './orbiting-spheres';
import { LensParticleSystem } from './lens-particle-system';
import { DEFAULT_SETTINGS } from './config';

export interface OrbitSystemConfig {
  // Canvas elements
  container: HTMLElement;
  orbitCanvas: HTMLCanvasElement;
  blobCanvas: HTMLCanvasElement;
  
  // Responsive settings
  responsiveScale?: number;
  orbitsResponsiveScale?: number;
  
  // Animation settings
  stage1Duration?: number;
  stage2Duration?: number;
  stage3Duration?: number;
  stage4Duration?: number;
  returnDelay?: number;
  returnDuration?: number;
  autoLoop?: boolean;
  
  // Lens particle system settings
  lensSettings?: {
    stage1Scale?: number;
    stage2Scale?: number;
    stage3Scale?: number;
    stage4Scale?: number;
    finalScale?: number;
    initialScale?: number;
  };
  
  // Callbacks
  onStageChange?: (stage: AnimationStage) => void;
  onAnimationComplete?: () => void;
  onReset?: () => void;
}

export interface OrbitTextItem {
  text1: string;
  text2?: string;
  icon?: string;
}

export class OrbitSystemManager {
  private container: HTMLElement;
  private orbitCanvas: HTMLCanvasElement;
  private blobCanvas: HTMLCanvasElement;
  
  // Three.js components
  private orbitRenderer!: THREE.WebGLRenderer;
  private blobRenderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private orbitScene!: THREE.Scene;
  private blobScene!: THREE.Scene;
  
  // Animation systems
  private animatedParticleSystem!: LensParticleSystem;
  private orbit1!: OrbitingSpheres;
  private orbit2!: OrbitingSpheres;
  
  // Optimization state
  private animationFrameId: number | null = null;
  private isInViewport: boolean = false;
  private isPageVisible: boolean = true;
  private isRendering: boolean = false;
  private lastTime: number = 0;
  
  // Global animation timing
  private globalAnimationStartTime: number = 0;
  private isGlobalAnimationRunning: boolean = false;
  
  // Configuration
  private config: Required<OrbitSystemConfig> & {
    onStageChange: (stage: AnimationStage) => void;
    onAnimationComplete: () => void;
    onReset: () => void;
  };
  
  // Cloned cards management
  private lastStageForCards: AnimationStage = 'idle';
  private showCardsTimeout: number | null = null;
  
  // Resize handling
  private resizeTimeout: ReturnType<typeof setTimeout> | null = null;
  
  constructor(config: OrbitSystemConfig) {
    this.config = {
      responsiveScale: 1.0,
      orbitsResponsiveScale: 1.0,
      stage1Duration: 3,
      stage2Duration: 3,
      stage3Duration: 3,
      stage4Duration: 3,
      returnDelay: 3000,
      returnDuration: 1.2,
      autoLoop: true,
      lensSettings: {
        stage1Scale: 0.7,
        stage2Scale: 1.1,
        stage3Scale: 1.4,
        stage4Scale: 1.7,
        finalScale: 1.7,
        initialScale: 0.7,
      },
      onStageChange: () => {},
      onAnimationComplete: () => {},
      onReset: () => {},
      ...config
    };
    
    this.container = config.container;
    this.orbitCanvas = config.orbitCanvas;
    this.blobCanvas = config.blobCanvas;
    
    this.initializeThreeJS();
    this.initializeAnimationSystems();
    this.setupOptimizations();
  }
  
  private initializeThreeJS(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    
    // Responsive scale detection
    const isMobile = window.innerWidth < 768;
    const responsiveScale = isMobile ? this.config.responsiveScale : 1.0;
    const orbitsResponsiveScale = isMobile ? this.config.orbitsResponsiveScale : 1.0;
    
    // Orbit renderer (background layer)
    this.orbitRenderer = new THREE.WebGLRenderer({
      canvas: this.orbitCanvas,
      antialias: true,
      alpha: true,
    });
    this.orbitRenderer.setSize(width, height);
    this.orbitRenderer.setPixelRatio(pixelRatio);
    this.orbitRenderer.setClearColor(0x000000, 0);
    this.orbitRenderer.toneMapping = THREE.NoToneMapping;
    this.orbitRenderer.toneMappingExposure = 1.0;
    
    // Blob renderer (foreground layer)
    this.blobRenderer = new THREE.WebGLRenderer({
      canvas: this.blobCanvas,
      antialias: true,
      alpha: true,
    });
    this.blobRenderer.setSize(width, height);
    this.blobRenderer.setPixelRatio(pixelRatio);
    this.blobRenderer.setClearColor(0x000000, 0);
    this.blobRenderer.toneMapping = THREE.NoToneMapping;
    this.blobRenderer.toneMappingExposure = 1.0;
    
    // Camera setup
    const referenceHeight = 604;
    const referenceFOV = 50;
    const vFOV = (2 * Math.atan(Math.tan((referenceFOV * Math.PI) / 360) * (referenceHeight / height)) * 180) / Math.PI;
    const cameraZAdjustment = 8 * (height / referenceHeight);
    
    this.camera = new THREE.PerspectiveCamera(vFOV, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, cameraZAdjustment);
    this.camera.lookAt(0, 0, 0);
    
    // Scenes
    this.orbitScene = new THREE.Scene();
    this.blobScene = new THREE.Scene();
  }
  
  private initializeAnimationSystems(): void {
    const isMobile = window.innerWidth < 768;
    const responsiveScale = isMobile ? this.config.responsiveScale : 1.0;
    const orbitsResponsiveScale = isMobile ? this.config.orbitsResponsiveScale : 1.0;
    
    // Lens particle system
    this.animatedParticleSystem = new LensParticleSystem({
      stage1Duration: this.config.stage1Duration,
      stage2Duration: this.config.stage2Duration,
      stage3Duration: this.config.stage3Duration,
      stage4Duration: this.config.stage4Duration,
      stage1Scale: this.config.lensSettings.stage1Scale,
      stage2Scale: this.config.lensSettings.stage2Scale,
      stage3Scale: this.config.lensSettings.stage3Scale,
      stage4Scale: this.config.lensSettings.stage4Scale,
      finalScale: this.config.lensSettings.finalScale,
      initialScale: this.config.lensSettings.initialScale,
      returnDelay: this.config.returnDelay,
      returnDuration: this.config.returnDuration,
      autoLoop: this.config.autoLoop,
      
      lensCursorSize: DEFAULT_SETTINGS.lensCursorSize,
      lensCursorIor: DEFAULT_SETTINGS.lensCursorIor,
      lensCursorThickness: DEFAULT_SETTINGS.lensCursorThickness,
      lensCursorChromaticAberration: DEFAULT_SETTINGS.lensCursorChromaticAberration,
      lensCursorAnisotropy: DEFAULT_SETTINGS.lensCursorAnisotropy,
      lensCursorTransmission: DEFAULT_SETTINGS.lensCursorTransmission,
      lensCursorRoughness: DEFAULT_SETTINGS.lensCursorRoughness,
      lensCursorDistortion: DEFAULT_SETTINGS.lensCursorDistortion,
      lensCursorDistortionScale: DEFAULT_SETTINGS.lensCursorDistortionScale,
      lensCursorTemporalDistortion: DEFAULT_SETTINGS.lensCursorTemporalDistortion,
      lensCursorSamples: 4,
      lensCursorBackside: false,
      lensCursorBacksideThickness: DEFAULT_SETTINGS.lensCursorBacksideThickness,
      lensCursorTransmissionSampler: DEFAULT_SETTINGS.lensCursorTransmissionSampler,
      lensCursorResolution: 2024,
      lensCursorBacksideResolution: DEFAULT_SETTINGS.lensCursorBacksideResolution,
      lensCursorBackground: "#CCE4F3",
      lensCursorBackgroundScale: 0.2,
      
      pulseEnabled: true,
      pulseMinScale: 0.98,
      pulseMaxScale: 1.02,
      pulseSpeed: 0.0005,
      
      smoothingFactor: 2.5,
      useGlobalTiming: true,
      responsiveScale: responsiveScale,
      
      particleSettings: {
        ...DEFAULT_SETTINGS,
        particleSize: DEFAULT_SETTINGS.particleSize,
        radius: DEFAULT_SETTINGS.radius,
      },
      
      onStageChange: this.config.onStageChange,
    });
    
    this.blobScene.add(this.animatedParticleSystem.getGroup());
    
    // Orbit 1 configuration
    const orbitingTextItems1: OrbitTextItem[] = [
      {
        text1: "CRM",
        icon: '<svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 8.36133C17.4706 8.36133 21.5 7.01818 21.5 5.36133C21.5 3.70447 17.4706 2.36133 12.5 2.36133C7.52944 2.36133 3.5 3.70447 3.5 5.36133C3.5 7.01818 7.52944 8.36133 12.5 8.36133Z" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.5 5.36133V19.3613C3.5 20.157 4.44821 20.92 6.13604 21.4826C7.82387 22.0453 10.1131 22.3613 12.5 22.3613C14.8869 22.3613 17.1761 22.0453 18.864 21.4826C20.5518 20.92 21.5 20.157 21.5 19.3613V5.36133" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.5 12.3613C3.5 13.157 4.44821 13.92 6.13604 14.4826C7.82387 15.0453 10.1131 15.3613 12.5 15.3613C14.8869 15.3613 17.1761 15.0453 18.864 14.4826C20.5518 13.92 21.5 13.157 21.5 12.3613" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      },
    ];
    
    // Orbit 2 configuration
    const orbitingTextItems2: OrbitTextItem[] = [
      {
        text1: "Plataforma de atendimento",
        text2: "no WhatsApp",
        icon: '<svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.49169 15.703C2.63873 16.0739 2.67147 16.4804 2.58569 16.87L1.52069 20.16C1.48638 20.3269 1.49525 20.4997 1.54647 20.6622C1.59769 20.8246 1.68955 20.9713 1.81336 21.0883C1.93716 21.2053 2.0888 21.2887 2.25389 21.3307C2.41898 21.3726 2.59205 21.3717 2.75669 21.328L6.16969 20.33C6.53741 20.2571 6.91822 20.289 7.26869 20.422C9.40408 21.4192 11.8231 21.6302 14.0988 21.0177C16.3746 20.4053 18.361 19.0087 19.7074 17.0744C21.0538 15.1401 21.6738 12.7924 21.458 10.4456C21.2422 8.09871 20.2044 5.90349 18.5278 4.24722C16.8511 2.59094 14.6434 1.58006 12.2941 1.39292C9.94475 1.20578 7.60483 1.8544 5.68713 3.22436C3.76944 4.59432 2.39722 6.59756 1.81258 8.88066C1.22795 11.1638 1.46846 13.58 2.49169 15.703Z" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      },
      {
        text1: "App de força",
        text2: "de Vendas",
        icon: '<svg width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.3333 2.69434H8.66659C7.37792 2.69434 6.33325 3.739 6.33325 5.02767V23.6943C6.33325 24.983 7.37792 26.0277 8.66659 26.0277H20.3333C21.6219 26.0277 22.6666 24.983 22.6666 23.6943V5.02767C22.6666 3.739 21.6219 2.69434 20.3333 2.69434Z" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.5 21.3613H14.5117" stroke="black" stroke-width="2.33333" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      },
    ];
    
    const orbit1Config = {
      sphereCount: 300,
      initialRadius: 3.6,
      sphereSize: 0.01,
      rotationSpeed: 0.03,
      rotationOffset: 0.5 * Math.PI,
      rotationOffsetMobile: 1.2 * Math.PI,
      color: DEFAULT_SETTINGS.particleColor,
      enabled: true,
      isAnimating: true,
      
      textItems: orbitingTextItems1,
      showTexts: true,
      textOffset: 0,
      
      stage1Duration: this.config.stage1Duration,
      stage2Duration: this.config.stage2Duration,
      stage3Duration: this.config.stage3Duration,
      stage4Duration: this.config.stage4Duration,
      stage1Radius: 3.6,
      stage2Radius: 3.2,
      stage3Radius: 2.5,
      stage4Radius: 1.6,
      finalRadius: 1.6,
      autoLoop: this.config.autoLoop,
      returnDelay: this.config.returnDelay,
      returnDuration: this.config.returnDuration,
      
      hideTextsByStage: { 0: "stage4" as AnimationStage },
      textFadeInDuration: 0.2,
      textFadeOutDuration: 0.3,
      
      responsiveScale: orbitsResponsiveScale,
      
      onStageChange: this.config.onStageChange,
    };
    
    const orbit2Config = {
      sphereCount: 220,
      initialRadius: 2.2,
      sphereSize: 0.01,
      rotationSpeed: 0.03,
      rotationOffset: 0.4 * Math.PI,
      rotationOffsetMobile: 0.2 * Math.PI,
      color: DEFAULT_SETTINGS.particleColor,
      enabled: true,
      isAnimating: true,
      
      textItems: orbitingTextItems2,
      showTexts: true,
      textOffset: 0,
      
      stage1Duration: this.config.stage1Duration,
      stage2Duration: this.config.stage2Duration,
      stage3Duration: this.config.stage3Duration,
      stage4Duration: this.config.stage4Duration,
      stage1Radius: 2.2,
      stage2Radius: 1.8,
      stage3Radius: 1.3,
      stage4Radius: 1,
      finalRadius: 1,
      autoLoop: this.config.autoLoop,
      returnDelay: this.config.returnDelay,
      returnDuration: this.config.returnDuration,
      
      hideTextsByStage: { 0: "stage2" as AnimationStage, 1: "stage3" as AnimationStage },
      textFadeInDuration: 0.2,
      textFadeOutDuration: 0.3,
      
      responsiveScale: orbitsResponsiveScale,
      
      onStageChange: this.config.onStageChange,
    };
    
    this.orbit1 = new OrbitingSpheres(orbit1Config);
    this.orbit2 = new OrbitingSpheres(orbit2Config);
    
    // Add orbits to orbit scene
    this.orbitScene.add(this.orbit1.getGroup());
    this.orbitScene.add(this.orbit2.getGroup());
    
    // Set camera reference for text positioning
    this.orbit1.setCamera(this.camera);
    this.orbit2.setCamera(this.camera);
    
    // Initialize for global timing
    this.orbit1.initializeForGlobalTiming();
    this.orbit2.initializeForGlobalTiming();
  }
  
  private setupOptimizations(): void {
    // 1. Intersection Observer API - Pausa renderização fora da viewport
    this.setupIntersectionObserver();
    
    // 2. Page Visibility API - Pausa quando aba fica inativa
    this.setupPageVisibility();
    
    // 3. RequestAnimationFrame com controle
    this.setupResizeHandler();
  }
  
  private setupIntersectionObserver(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const wasInViewport = this.isInViewport;
        this.isInViewport = entry.isIntersecting;
        
        if (!wasInViewport && this.isInViewport) {
          // Entrando na viewport - resetar animação completamente
          this.resetAnimation();
          this.startRenderLoop();
          console.log('🎯 Canvas entered viewport - resuming render');
          
          // Fade in orbit texts after delay
          setTimeout(() => {
            this.orbit1.fadeInTexts(0.2);
            this.orbit2.fadeInTexts(0.2);
            console.log('✨ Fading in orbit texts');
          }, 300);
        } else if (wasInViewport && !this.isInViewport) {
          // Saindo da viewport
          this.stopRenderLoop();
          console.log('⏸️ Canvas left viewport - pausing render');
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );
    
    observer.observe(this.container);
  }
  
  private setupPageVisibility(): void {
    const handleVisibilityChange = () => {
      this.isPageVisible = !document.hidden;
      
      if (this.isPageVisible && this.isInViewport) {
        this.startRenderLoop();
        console.log('👁️ Page became visible - resuming render');
      } else {
        this.stopRenderLoop();
        console.log('🙈 Page became hidden - pausing render');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
  
  private setupResizeHandler(): void {
    const handleResize = () => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      
      this.resizeTimeout = setTimeout(() => {
        const newWidth = this.container.clientWidth;
        const newHeight = this.container.clientHeight;
        
        this.camera.aspect = newWidth / newHeight;
        this.camera.updateProjectionMatrix();
        
        this.orbitRenderer.setSize(newWidth, newHeight);
        this.orbitRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        this.blobRenderer.setSize(newWidth, newHeight);
        this.blobRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        this.resizeTimeout = null;
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
  }
  
  private startRenderLoop(): void {
    if (this.isRendering || !this.isInViewport || !this.isPageVisible) return;
    
    this.isRendering = true;
    this.lastTime = performance.now();
    this.renderLoop();
  }
  
  private stopRenderLoop(): void {
    this.isRendering = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  private renderLoop = (): void => {
    if (!this.isRendering || !this.isInViewport || !this.isPageVisible) {
      this.isRendering = false;
      return;
    }
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    // Calculate global elapsed time
    const globalElapsed = (Date.now() - this.globalAnimationStartTime) / 1000;
    const globalStage = this.getCurrentGlobalStage(globalElapsed);
    
    // Update cloned cards visibility based on stage
    this.updateClonedCardsVisibility(globalStage);
    
    // Update all systems with global timing
    this.animatedParticleSystem.update(deltaTime, globalElapsed, globalStage);
    this.orbit1.update(deltaTime, globalElapsed, globalStage);
    this.orbit2.update(deltaTime, globalElapsed, globalStage);
    
    // Render orbits (background layer)
    this.orbitRenderer.render(this.orbitScene, this.camera);
    
    // Render blob with lens effects (foreground layer)
    this.animatedParticleSystem.render(this.blobRenderer, this.camera, this.blobScene);
    
    // Continue loop
    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  };
  
  private getCurrentGlobalStage(globalElapsed: number): AnimationStage {
    if (!this.isGlobalAnimationRunning) return 'idle';
    
    const STAGE_CYCLE_TIME = this.config.stage1Duration + this.config.stage2Duration + 
                            this.config.stage3Duration + this.config.stage4Duration;
    const TOTAL_CYCLE_TIME = STAGE_CYCLE_TIME + this.config.returnDelay / 1000 + this.config.returnDuration;
    
    // If autoLoop is disabled, lock at stage4 after completing all stages
    if (!this.config.autoLoop && globalElapsed >= STAGE_CYCLE_TIME) {
      return 'stage4';
    }
    
    // Handle looping
    const cycleElapsed = this.config.autoLoop ? globalElapsed % TOTAL_CYCLE_TIME : globalElapsed;
    
    if (cycleElapsed < this.config.stage1Duration) {
      return 'stage1';
    } else if (cycleElapsed < this.config.stage1Duration + this.config.stage2Duration) {
      return 'stage2';
    } else if (cycleElapsed < this.config.stage1Duration + this.config.stage2Duration + this.config.stage3Duration) {
      return 'stage3';
    } else if (cycleElapsed < STAGE_CYCLE_TIME) {
      return 'stage4' as AnimationStage;
    } else if (cycleElapsed < STAGE_CYCLE_TIME + this.config.returnDelay / 1000) {
      return 'completed';
    } else {
      return 'returning';
    }
  }
  
  private resetAnimation(): void {
    this.globalAnimationStartTime = Date.now();
    this.isGlobalAnimationRunning = true;
    this.lastTime = 0;
    
    // Reset orbit rotations to initial positions
    const isMobile = window.innerWidth < 768;
    const orbit1Rotation = isMobile ? 1.2 * Math.PI : 0.5 * Math.PI;
    const orbit2Rotation = isMobile ? 0.2 * Math.PI : 0.4 * Math.PI;
    
    this.orbit1.getGroup().rotation.z = orbit1Rotation;
    this.orbit2.getGroup().rotation.z = orbit2Rotation;
    
    // Force immediate text position resync
    this.orbit1.resyncTextPositions();
    this.orbit2.resyncTextPositions();
    
    console.log('🔄 Reset orbits - orbit1:', orbit1Rotation, 'orbit2:', orbit2Rotation);
  }
  
  private updateClonedCardsVisibility(stage: AnimationStage): void {
    const container = document.getElementById('cloned-cards-container');
    if (!container) return;
    
    const cards = container.querySelectorAll('.cloned-card');
    
    if (stage === 'stage4') {
      // Wait 500ms before showing cards after stage4 starts
      this.showCardsTimeout = window.setTimeout(() => {
        container.classList.remove('opacity-0');
        container.classList.add('opacity-100');
        
        cards.forEach((card) => {
          (card as HTMLElement).style.transitionDelay = '';
          card.classList.remove('translate-y-20', 'scale-75', 'opacity-0');
          card.classList.add('translate-y-0', 'scale-100', 'opacity-100');
        });
      }, 500);
    } else if (this.lastStageForCards === 'stage4' && stage === 'returning') {
      // Cancel pending show animation if any
      if (this.showCardsTimeout !== null) {
        window.clearTimeout(this.showCardsTimeout);
        this.showCardsTimeout = null;
      }
      
      // Hide cards when leaving stage4
      cards.forEach((card, index) => {
        const invertedDelay = (cards.length - 1 - index) * 100;
        (card as HTMLElement).style.transitionDelay = `${invertedDelay}ms`;
        card.classList.remove('translate-y-0', 'opacity-100');
        card.classList.add('translate-y-20', 'opacity-0');
      });
      
      setTimeout(() => {
        container.classList.remove('opacity-100');
        container.classList.add('opacity-0');
      }, 400);
    } else if (stage !== 'stage4' as AnimationStage) {
      // Cancel pending show animation if any
      if (this.showCardsTimeout !== null) {
        window.clearTimeout(this.showCardsTimeout);
        this.showCardsTimeout = null;
      }
      
      // Ensure container is hidden when not in stage4
      container.classList.remove('opacity-100');
      container.classList.add('opacity-0');
      cards.forEach((card, index) => {
        const invertedDelay = (cards.length - 1 - index) * 100;
        (card as HTMLElement).style.transitionDelay = `${invertedDelay}ms`;
        card.classList.remove('translate-y-0', 'opacity-100');
        card.classList.add('translate-y-20', 'opacity-0');
      });
    }
    
    this.lastStageForCards = stage;
  }
  
  public start(): void {
    this.resetAnimation();
    console.log('🚀 Orbit system started');
  }
  
  public pause(): void {
    this.stopRenderLoop();
    console.log('⏸️ Orbit system paused');
  }
  
  public resume(): void {
    if (this.isInViewport && this.isPageVisible) {
      this.startRenderLoop();
      console.log('▶️ Orbit system resumed');
    }
  }
  
  public dispose(): void {
    // Stop render loop
    this.stopRenderLoop();
    
    // Clear timeout if exists
    if (this.showCardsTimeout !== null) {
      window.clearTimeout(this.showCardsTimeout);
      this.showCardsTimeout = null;
    }
    
    // Clear resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    // Dispose Three.js objects
    this.animatedParticleSystem.dispose();
    this.orbit1.dispose();
    this.orbit2.dispose();
    
    // Dispose renderers
    this.orbitRenderer.dispose();
    this.blobRenderer.dispose();
    
    console.log('🧹 Orbit system cleaned up');
  }
  
  // Public getters for external access
  public getOrbit1(): OrbitingSpheres {
    return this.orbit1;
  }
  
  public getOrbit2(): OrbitingSpheres {
    return this.orbit2;
  }
  
  public getParticleSystem(): LensParticleSystem {
    return this.animatedParticleSystem;
  }
  
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
  
  public isCurrentlyRendering(): boolean {
    return this.isRendering;
  }
  
  public getIsInViewport(): boolean {
    return this.isInViewport;
  }
  
  public getIsPageVisible(): boolean {
    return this.isPageVisible;
  }
}
