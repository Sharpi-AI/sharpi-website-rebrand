import { Group, Vector3, SphereGeometry, Mesh, MeshBasicMaterial, Scene, Camera } from 'three';

export type AnimationStage = 'idle' | 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'completed' | 'returning';

export interface OrbitingTextItem {
  text1: string;
  text2?: string;
  icon?: string; // Since we can't use React nodes, we'll use strings for now
}

export interface OrbitingSpheresConfig {
  sphereCount?: number;
  orbitRadius?: number;
  sphereSize?: number;
  rotationSpeed?: number;
  color?: string;
  enabled?: boolean;

  // Text props
  textItems?: OrbitingTextItem[];
  showTexts?: boolean;
  textColor?: string;
  textSize?: number;
  textOffset?: number;

  // Animation controls
  isAnimating?: boolean;
  stage1Duration?: number;
  stage2Duration?: number;
  stage3Duration?: number;
  stage4Duration?: number;
  stage1Radius?: number;
  stage2Radius?: number;
  stage3Radius?: number;
  stage4Radius?: number;
  finalRadius?: number;
  initialRadius?: number;
  returnDelay?: number;
  returnDuration?: number;
  autoLoop?: boolean;


  // Text animation controls
  hideTextsOnStage?: AnimationStage;
  hideTextsByStage?: { [textIndex: number]: AnimationStage };
  textFadeDuration?: number;
  textFadeInDuration?: number;
  textFadeOutDuration?: number;

  // Callbacks
  onStageChange?: (stage: AnimationStage) => void;
  onAnimationComplete?: () => void;
  onReset?: () => void;
}

export class OrbitingSpheres {
  private group: Group;
  private spheres: Mesh[] = [];
  private textElements: HTMLElement[] = [];
  private textContainer: HTMLElement | null = null;
  private camera: Camera | null = null;
  private config: Required<Omit<OrbitingSpheresConfig, 'textItems' | 'hideTextsOnStage' | 'hideTextsByStage' | 'onStageChange' | 'onAnimationComplete' | 'onReset'>> & {
    textItems: OrbitingTextItem[];
    hideTextsOnStage?: AnimationStage;
    hideTextsByStage?: { [textIndex: number]: AnimationStage };
    onStageChange?: (stage: AnimationStage) => void;
    onAnimationComplete?: () => void;
    onReset?: () => void;
  };

  // Animation state
  private currentStage: AnimationStage = 'idle';
  private targetRadius: number;
  private currentAnimatedRadius: number;
  private loopCount: number = 0;
  private isUsingGlobalTiming: boolean = false;


  // Text animation state
  private textOpacity: number = 1;
  private textScale: number = 1;
  private isTextFadingOut: boolean = false;
  private isTextFadingIn: boolean = false;
  private hasTextsFaded: boolean = false;

  // Individual text animation states
  private textOpacities: number[] = [];
  private textScales: number[] = [];
  private isTextFadingOutArray: boolean[] = [];
  private isTextFadingInArray: boolean[] = [];
  private hasTextsFadedArray: boolean[] = [];

  // Text position states for movement animation
  private textPositions: Vector3[] = [];
  private originalTextPositions: Vector3[] = [];

  // Timers for auto-loop
  private returnTimeout: number | null = null;

  constructor(config: OrbitingSpheresConfig = {}) {
    this.config = {
      sphereCount: 12,
      orbitRadius: 3,
      sphereSize: 0.02,
      rotationSpeed: 0.1,
      color: "#888888",
      enabled: true,
      textItems: [],
      showTexts: true,
      textColor: "#000000",
      textSize: 16,
      textOffset: 0.2,
      isAnimating: true,
      stage1Duration: 2,
      stage2Duration: 2,
      stage3Duration: 2,
      stage4Duration: 2,
      stage1Radius: 2,
      stage2Radius: 4,
      stage3Radius: 6,
      stage4Radius: 8,
      finalRadius: 3,
      initialRadius: 3,
      returnDelay: 1000,
      returnDuration: 2,
      autoLoop: true,
      textFadeDuration: 0.5,
      textFadeInDuration: 0.2,
      textFadeOutDuration: 0.3,
      ...config
    };

    this.targetRadius = this.config.initialRadius;
    this.currentAnimatedRadius = this.config.initialRadius;

    this.group = new Group();
    this.textContainer = document.getElementById('orbit-texts-container');
    this.initializeSpheres();
    this.initializeTextStates();
    this.initializeTextElements();
  }

  private initializeSpheres(): void {
    // Clear existing spheres
    this.spheres.forEach(sphere => this.group.remove(sphere));
    this.spheres = [];

    // Create new spheres
    const geometry = new SphereGeometry(this.config.sphereSize, 8, 8);
    const material = new MeshBasicMaterial({ color: this.config.color });

    for (let i = 0; i < this.config.sphereCount; i++) {
      const sphere = new Mesh(geometry, material);
      this.spheres.push(sphere);
      this.group.add(sphere);
    }

    this.updateSpherePositions();
  }

  private initializeTextStates(): void {
    const textCount = this.config.textItems.length;
    if (textCount > 0) {
      this.textOpacities = new Array(textCount).fill(1);
      this.textScales = new Array(textCount).fill(1);
      this.isTextFadingOutArray = new Array(textCount).fill(false);
      this.isTextFadingInArray = new Array(textCount).fill(false);
      this.hasTextsFadedArray = new Array(textCount).fill(false);
      this.textPositions = new Array(textCount).fill(null).map(() => new Vector3(0, 0, 0));
      this.originalTextPositions = new Array(textCount).fill(null).map(() => new Vector3(0, 0, 0));
      this.updateTextPositions();
    }
  }

  private initializeTextElements(): void {
    if (!this.textContainer || !this.config.showTexts || this.config.textItems.length === 0) return;

    // Clear existing text elements
    this.clearTextElements();

    // Create DOM elements for each text item
    for (let i = 0; i < this.config.textItems.length; i++) {
      const textItem = this.config.textItems[i];
      const textElement = this.createTextElement(textItem, i);
      this.textElements.push(textElement);
      this.textContainer.appendChild(textElement);
    }
  }

  private createTextElement(textItem: OrbitingTextItem, index: number): HTMLElement {
    const element = document.createElement('div');
    element.className = 'orbit-text';
    element.setAttribute('data-text-index', index.toString());

    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.innerHTML = textItem.icon || '🔵';

    const textContent = document.createElement('div');
    textContent.className = 'text-content';

    const text1 = document.createElement('span');
    text1.className = 'text1';
    text1.textContent = textItem.text1;
    textContent.appendChild(text1);

    if (textItem.text2) {
      const text2 = document.createElement('span');
      text2.className = 'text2';
      text2.textContent = textItem.text2;
      textContent.appendChild(text2);
    }

    element.appendChild(icon);
    element.appendChild(textContent);

    return element;
  }

  private clearTextElements(): void {
    if (this.textContainer) {
      this.textElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    }
    this.textElements = [];
  }

  private worldToScreen(worldPosition: Vector3): { x: number, y: number } {
    if (!this.camera) {
      return { x: 0, y: 0 };
    }

    // Clone the position to avoid modifying the original
    const vector = worldPosition.clone();

    // Apply the group's transformations
    vector.applyMatrix4(this.group.matrixWorld);

    // Project to screen space
    vector.project(this.camera);

    // Get container dimensions instead of window dimensions
    const container = document.getElementById('orbit-system-container');
    if (!container) {
      return { x: 0, y: 0 };
    }

    const containerRect = container.getBoundingClientRect();
    const widthHalf = containerRect.width / 2;
    const heightHalf = containerRect.height / 2;

    // Convert from normalized device coordinates to screen coordinates
    // The vector.x and vector.y are already in normalized device coordinates (-1 to 1)
    return {
      x: (vector.x * widthHalf) + widthHalf,
      y: -(vector.y * heightHalf) + heightHalf
    };
  }

  private updateTextElementsPosition(): void {
    if (!this.config.showTexts || this.textElements.length === 0) return;

    for (let i = 0; i < this.textElements.length && i < this.textPositions.length; i++) {
      const element = this.textElements[i];
      const worldPosition = this.textPositions[i];

      // Convert 3D position to screen coordinates
      const screenPosition = this.worldToScreen(worldPosition);

      // Get container position to offset correctly
      const container = document.getElementById('orbit-system-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();

      // Apply position relative to container
      element.style.left = `${screenPosition.x}px`;
      element.style.top = `${screenPosition.y}px`;
      element.style.transform = `translate(-50%, -50%) scale(${this.textScales[i]})`;
      element.style.opacity = this.textOpacities[i].toString();
    }
  }

  private updateSpherePositions(): void {
    for (let i = 0; i < this.spheres.length; i++) {
      const angle = (i / this.config.sphereCount) * Math.PI * 2;
      const x = Math.cos(angle) * this.currentAnimatedRadius;
      const y = Math.sin(angle) * this.currentAnimatedRadius;
      this.spheres[i].position.set(x, y, 0);
    }
  }

  private updateTextPositions(): void {
    if (!this.config.showTexts || this.config.textItems.length === 0) return;

    const textRadius = this.currentAnimatedRadius + this.config.textOffset;

    for (let i = 0; i < this.config.textItems.length; i++) {
      // Calculate angle based on current group rotation to keep texts aligned with spheres
      const baseAngle = (i / this.config.textItems.length) * Math.PI * 2;
      const currentRotation = this.group.rotation.z;
      const angle = baseAngle + currentRotation;
      
      const x = Math.cos(angle) * textRadius;
      const y = Math.sin(angle) * textRadius;

      const newPosition = new Vector3(x, y, 0);

      // Update positions only for texts not currently animating or faded out
      const isThisTextFading = this.isTextFadingOutArray[i] || this.isTextFadingInArray[i] || this.hasTextsFadedArray[i];
      if (!isThisTextFading) {
        this.textPositions[i] = newPosition;
      }

      // Only update original positions when text is not fading out or faded out
      if (!this.isTextFadingOutArray[i] && !this.hasTextsFadedArray[i]) {
        this.originalTextPositions[i] = newPosition.clone();
      }
    }
  }

  public startAnimation(): void {
    if (!this.isUsingGlobalTiming && this.currentStage === 'idle') {
      this.currentStage = 'stage1';
      this.targetRadius = this.config.stage1Radius;
      this.config.onStageChange?.('stage1');
    }
  }

  public initializeForGlobalTiming(): void {
    this.isUsingGlobalTiming = true;
    this.currentStage = 'idle';
    this.targetRadius = this.config.initialRadius;
    this.currentAnimatedRadius = this.config.initialRadius;
  }

  public stopAnimation(): void {
    if (this.currentStage !== 'idle') {
      this.resetAnimation();
    }
  }

  private resetAnimation(): void {
    this.currentStage = 'idle';
    this.targetRadius = this.config.initialRadius;
    this.loopCount = 0;

    // Clear timeout if exists
    if (this.returnTimeout) {
      window.clearTimeout(this.returnTimeout);
      this.returnTimeout = null;
    }

    // Reset text states
    this.isTextFadingOut = false;
    this.isTextFadingIn = false;
    this.hasTextsFaded = false;
    this.textOpacity = 1;
    this.textScale = 1;

    // Reset individual text states
    const textCount = this.config.textItems.length;
    if (textCount > 0) {
      this.textOpacities = new Array(textCount).fill(1);
      this.textScales = new Array(textCount).fill(1);
      this.isTextFadingOutArray = new Array(textCount).fill(false);
      this.isTextFadingInArray = new Array(textCount).fill(false);
      this.hasTextsFadedArray = new Array(textCount).fill(false);

      // Reset positions to original positions
      if (this.originalTextPositions.length > 0) {
        this.textPositions = this.originalTextPositions.map(pos => pos.clone());
      }
    }

    this.config.onReset?.();
  }

  public update(deltaTime: number, globalElapsed?: number, globalStage?: AnimationStage): void {
    if (!this.config.enabled) return;

    // Continue rotating the group
    this.group.rotation.z += this.config.rotationSpeed * deltaTime;

    // Handle global timing vs local timing
    if (this.isUsingGlobalTiming && globalElapsed !== undefined && globalStage !== undefined) {
      // Use global timing system
      this.handleGlobalTiming(globalElapsed, globalStage);
    }

    // Use target radius directly without pulse
    const finalRadius = this.targetRadius;

    // Handle text fade OUT animation (when reaching hideTextsOnStage)
    if (this.config.hideTextsOnStage && this.currentStage === this.config.hideTextsOnStage && !this.hasTextsFaded && !this.isTextFadingOut) {
      this.isTextFadingOut = true;
      this.hasTextsFaded = true;
    }

    // Handle text fade IN animation (when loop restarts)
    if (this.hasTextsFaded && this.currentStage === 'stage1' && this.config.isAnimating && !this.isTextFadingIn && !this.isTextFadingOut) {
      this.isTextFadingIn = true;
      this.hasTextsFaded = false;
    }

    // Animate text opacity and scale during fade OUT
    if (this.isTextFadingOut) {
      const fadeSpeed = 1 / (this.config.textFadeOutDuration || this.config.textFadeDuration);
      this.textOpacity = Math.max(0, this.textOpacity - fadeSpeed * deltaTime);
      this.textScale = Math.max(0, this.textScale - fadeSpeed * deltaTime);

      // Stop fading out when reached 0
      if (this.textOpacity <= 0 && this.textScale <= 0) {
        this.isTextFadingOut = false;
      }
    }

    // Animate text opacity and scale during fade IN
    if (this.isTextFadingIn) {
      const fadeSpeed = 1 / (this.config.textFadeInDuration || this.config.textFadeDuration);
      this.textOpacity = Math.min(1, this.textOpacity + fadeSpeed * deltaTime);
      this.textScale = Math.min(1, this.textScale + fadeSpeed * deltaTime);

      // Stop fading in when reached 1
      if (this.textOpacity >= 1 && this.textScale >= 1) {
        this.isTextFadingIn = false;
      }
    }

    // Handle individual text fade logic
    if (this.config.hideTextsByStage && this.config.textItems.length > 0) {
      Object.entries(this.config.hideTextsByStage).forEach(([textIndexStr, stage]) => {
        const textIndex = parseInt(textIndexStr);
        if (textIndex >= 0 && textIndex < this.config.textItems.length) {
          // Handle fade OUT for this specific text
          if (this.currentStage === stage && !this.hasTextsFadedArray[textIndex] && !this.isTextFadingOutArray[textIndex]) {
            this.isTextFadingOutArray[textIndex] = true;
            this.hasTextsFadedArray[textIndex] = true;
          }

          // Handle fade IN for this specific text when loop restarts
          if (this.hasTextsFadedArray[textIndex] && this.currentStage === 'stage1' && this.config.isAnimating &&
              !this.isTextFadingInArray[textIndex] && !this.isTextFadingOutArray[textIndex]) {

            // Set position directly to original position
            if (this.originalTextPositions[textIndex]) {
              this.textPositions[textIndex] = this.originalTextPositions[textIndex].clone();
            }

            this.isTextFadingInArray[textIndex] = true;
            this.hasTextsFadedArray[textIndex] = false;
          }

          // Animate individual text fade OUT
          if (this.isTextFadingOutArray[textIndex]) {
            const fadeSpeed = 1 / (this.config.textFadeOutDuration || this.config.textFadeDuration);
            this.textOpacities[textIndex] = Math.max(0, this.textOpacities[textIndex] - fadeSpeed * deltaTime);
            this.textScales[textIndex] = Math.max(0, this.textScales[textIndex] - fadeSpeed * deltaTime);

            // Animate position towards center during fade out
            if (this.originalTextPositions[textIndex]) {
              const originalPos = this.originalTextPositions[textIndex];
              const centerPos = new Vector3(0, 0, 0);

              // Calculate progress based on opacity (1 = original position, 0 = center)
              const progress = 1 - this.textOpacities[textIndex];

              // Interpolate between original position and center
              this.textPositions[textIndex] = originalPos.clone().lerp(centerPos, progress);
            }

            // Stop fading out when reached 0
            if (this.textOpacities[textIndex] <= 0 && this.textScales[textIndex] <= 0) {
              this.isTextFadingOutArray[textIndex] = false;
            }
          }

          // Animate individual text fade IN
          if (this.isTextFadingInArray[textIndex]) {
            const fadeSpeed = 1 / (this.config.textFadeInDuration || this.config.textFadeDuration);
            this.textOpacities[textIndex] = Math.min(1, this.textOpacities[textIndex] + fadeSpeed * deltaTime);
            this.textScales[textIndex] = Math.min(1, this.textScales[textIndex] + fadeSpeed * deltaTime);

            // Stop fading in when reached 1
            if (this.textOpacities[textIndex] >= 1 && this.textScales[textIndex] >= 1) {
              this.isTextFadingInArray[textIndex] = false;
            }
          }
        }
      });
    }

    // Smooth radius interpolation using easing
    const currentRadius = this.currentAnimatedRadius;
    const radiusDifference = finalRadius - currentRadius;
    const easingFactor = 1 - Math.exp(-deltaTime * 5);
    const newRadius = currentRadius + radiusDifference * easingFactor;
    
    this.currentAnimatedRadius = newRadius;

    // Update positions
    this.updateSpherePositions();
    this.updateTextPositions();
    this.updateTextElementsPosition();

    // Stage progression logic - only for local timing
    if (!this.isUsingGlobalTiming && this.config.isAnimating) {
      // Legacy local timing logic would go here if needed
      console.warn('Local timing not implemented - use global timing system');
    }
  }

  public getGroup(): Group {
    return this.group;
  }

  public getCurrentStage(): AnimationStage {
    return this.currentStage;
  }

  public getCurrentRadius(): number {
    return this.currentAnimatedRadius;
  }

  public getLoopCount(): number {
    return this.loopCount;
  }

  public setCamera(camera: Camera): void {
    this.camera = camera;
  }

  public updateConfig(newConfig: Partial<OrbitingSpheresConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Reinitialize if structural properties changed
    if (newConfig.sphereCount !== undefined || newConfig.sphereSize !== undefined || newConfig.color !== undefined) {
      this.initializeSpheres();
    }

    if (newConfig.textItems !== undefined) {
      this.initializeTextStates();
      this.initializeTextElements();
    }
  }

  public dispose(): void {
    // Clear timeout if exists
    if (this.returnTimeout) {
      window.clearTimeout(this.returnTimeout);
      this.returnTimeout = null;
    }

    // Clear text elements
    this.clearTextElements();

    // Dispose geometries and materials
    this.spheres.forEach(sphere => {
      if (sphere.geometry) {
        sphere.geometry.dispose();
      }
      if (sphere.material && 'dispose' in sphere.material) {
        sphere.material.dispose();
      }
    });

    // Clear arrays
    this.spheres = [];
    this.textOpacities = [];
    this.textScales = [];
    this.isTextFadingOutArray = [];
    this.isTextFadingInArray = [];
    this.hasTextsFadedArray = [];
    this.textPositions = [];
    this.originalTextPositions = [];
  }

  private handleGlobalTiming(globalElapsed: number, globalStage: AnimationStage): void {
    // Update current stage if it changed
    if (this.currentStage !== globalStage) {
      const previousStage = this.currentStage;
      this.currentStage = globalStage;

      // Update target radius based on new stage
      this.targetRadius = this.getTargetRadiusForStage(globalStage);

      // Notify of stage change
      if (previousStage !== globalStage) {
        this.config.onStageChange?.(globalStage);

        // Track loop count when returning to stage1
        if (globalStage === 'stage1' && previousStage === 'returning') {
          this.loopCount += 1;
        }

        // Notify animation complete when reaching completed stage
        if (globalStage === 'completed') {
          this.config.onAnimationComplete?.();
        }
      }
    }
  }

  private getTargetRadiusForStage(stage: AnimationStage): number {
    switch (stage) {
      case 'idle':
        return this.config.initialRadius;
      case 'stage1':
        return this.config.stage1Radius;
      case 'stage2':
        return this.config.stage2Radius;
      case 'stage3':
        return this.config.stage3Radius;
      case 'stage4':
        return this.config.stage4Radius;
      case 'completed':
        return this.config.finalRadius;
      case 'returning':
        return this.config.initialRadius;
      default:
        return this.config.initialRadius;
    }
  }
}