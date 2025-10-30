import { Group, Vector3, SphereGeometry, MeshBasicMaterial, InstancedMesh, Object3D, Matrix4 } from 'three';
import { generateParticlePositions, type ParticlePosition } from './math/geometry-positions';
import type { ParticleSystemSettings, ArrangementType } from './config';

export class ParticleSystem {
  private group: Group;
  private settings: ParticleSystemSettings;
  private currentArrangementType: ArrangementType;

  // InstancedMesh optimization (C.1) - MAXIMUM performance gain
  // Replaces individual Particle objects with a single InstancedMesh
  private instancedMesh: InstancedMesh | null = null;
  private dummy = new Object3D(); // Helper for matrix transformations
  private instanceCount: number = 0;
  private particlePositions: Vector3[] = []; // Track current positions

  // Performance optimization flags (C.3/C.4)
  private lastUpdateTime: number = 0;
  private updateThrottle: number = 16.67; // ~60fps minimum

  // Transition state management
  private isTransitioning: boolean = false;
  private transitionStartTime: number = 0;
  private transitionDuration: number = 1.5; // seconds
  private previousPositions: ParticlePosition[] = [];

  constructor(settings: ParticleSystemSettings) {
    this.settings = { ...settings };
    this.currentArrangementType = settings.arrangementType;
    this.group = new Group();

    this.initializeParticles();
  }

  private initializeParticles(): void {
    // Clear existing instanced mesh
    if (this.instancedMesh) {
      this.group.remove(this.instancedMesh);
      this.instancedMesh.dispose();
      this.instancedMesh = null;
    }

    // Detect if mobile internally and apply responsiveScale only if mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const responsiveScale = this.settings.responsiveScale ?? 1.0;
    const effectiveScale = isMobile ? responsiveScale : 1.0;

    // Generate particle positions with scale applied
    const generatedPositions = generateParticlePositions(this.settings.arrangementType, {
      particleCount: this.settings.particleCount,
      radius: this.settings.radius * effectiveScale,
      numLines: this.settings.numLines,
      particlesPerLine: this.settings.particlesPerLine,
      numRings: this.settings.numRings,
      maxParticlesPerRing: this.settings.maxParticlesPerRing,
      spiralTurns: this.settings.spiralTurns
    });

    // Higher quality for particles inside lens (visible through glass refraction)
    // Both desktop and mobile use 24×24 for perfectly smooth spheres
    // InstancedMesh makes this very efficient even with higher poly count
    const segments = 24;

    // Create geometry and material
    const geometry = new SphereGeometry(this.settings.particleSize, segments, segments);
    const material = new MeshBasicMaterial({
      color: this.settings.particleColor,
      transparent: true
    });

    // Create InstancedMesh (C.1 optimization)
    this.instanceCount = generatedPositions.length;
    this.instancedMesh = new InstancedMesh(geometry, material, this.instanceCount);
    this.group.add(this.instancedMesh);

    // Store positions and update instance matrices
    this.particlePositions = generatedPositions.map(p => p.position.clone());
    this.updateInstanceMatrices(true); // Force update on init

    // Store positions for potential transitions
    this.previousPositions = [...generatedPositions];
  }

  private updateInstanceMatrices(force: boolean = false): void {
    if (!this.instancedMesh) return;

    // Throttle updates when not transitioning (C.3/C.4 optimization)
    // This saves CPU/GPU cycles during stable rotation
    const now = Date.now();
    if (!force && !this.isTransitioning && (now - this.lastUpdateTime) < this.updateThrottle) {
      return;
    }
    this.lastUpdateTime = now;

    // Update all instance positions using matrix transformations (C.1 optimization)
    for (let i = 0; i < this.particlePositions.length; i++) {
      const position = this.particlePositions[i];

      // Use dummy object to calculate matrix
      this.dummy.position.copy(position);
      this.dummy.updateMatrix();

      // Set matrix for this instance
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    // Mark instance matrix as needing update
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return t * (2 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default:
        return t; // linear
    }
  }

  public updateSettings(newSettings: Partial<ParticleSystemSettings>): void {
    const oldArrangementType = this.settings.arrangementType;
    this.settings = { ...this.settings, ...newSettings };

    // Check if arrangement type changed and transitions are enabled
    if (this.settings.arrangementTransitionsEnabled &&
        oldArrangementType !== this.settings.arrangementType &&
        this.particlePositions.length > 0) {

      // Store current positions as previous positions
      this.previousPositions = this.particlePositions.map((position, index) => ({
        position: position.clone(),
        index: index
      }));

      // Start transition
      this.isTransitioning = true;
      this.transitionStartTime = Date.now();
      this.transitionDuration = this.settings.transitionDuration;
    }

    // Update current arrangement type
    this.currentArrangementType = this.settings.arrangementType;

    // If not transitioning, reinitialize immediately
    if (!this.isTransitioning) {
      this.initializeParticles();
    }
  }

  public update(deltaTime: number): void {
    if (!this.group) return;

    // Handle arrangement transitions
    if (this.isTransitioning) {
      const elapsed = (Date.now() - this.transitionStartTime) / 1000;
      const progress = Math.min(1, elapsed / this.transitionDuration);
      const easedProgress = this.applyEasing(progress, this.settings.transitionEasing);

      if (progress >= 1) {
        // Transition complete
        this.isTransitioning = false;
        this.initializeParticles();
      } else {
        // Detect if mobile internally and apply responsiveScale only if mobile
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const responsiveScale = this.settings.responsiveScale ?? 1.0;
        const effectiveScale = isMobile ? responsiveScale : 1.0;

        // Generate target positions for transition with scale applied
        const targetPositions = generateParticlePositions(this.settings.arrangementType, {
          particleCount: this.settings.particleCount,
          radius: this.settings.radius * effectiveScale,
          numLines: this.settings.numLines,
          particlesPerLine: this.settings.particlesPerLine,
          numRings: this.settings.numRings,
          maxParticlesPerRing: this.settings.maxParticlesPerRing,
          spiralTurns: this.settings.spiralTurns
        });

        // Interpolate positions
        for (let i = 0; i < this.particlePositions.length && i < targetPositions.length; i++) {
          const previousPos = this.previousPositions[i]?.position || this.particlePositions[i];
          const targetPos = targetPositions[i].position;

          // Update position with interpolation
          this.particlePositions[i].set(
            this.lerp(previousPos.x, targetPos.x, easedProgress),
            this.lerp(previousPos.y, targetPos.y, easedProgress),
            this.lerp(previousPos.z, targetPos.z, easedProgress)
          );
        }

        // Update instance matrices with new positions (force during transitions)
        this.updateInstanceMatrices(true);
      }
    }

    // Handle rotation
    if (this.settings.autoRotate) {
      this.group.rotation.order = 'XYZ';
      this.group.rotation.x += (this.settings.autoRotateSpeedX * Math.PI * deltaTime) / 180;
      this.group.rotation.y += (this.settings.autoRotateSpeedY * Math.PI * deltaTime) / 180;
      this.group.rotation.z += (this.settings.autoRotateSpeedZ * Math.PI * deltaTime) / 180;
    } else {
      this.group.rotation.order = 'ZYX';
      this.group.rotation.x = (this.settings.rotationX * Math.PI) / 180;
      this.group.rotation.y = (this.settings.rotationY * Math.PI) / 180;
      this.group.rotation.z = (this.settings.rotationZ * Math.PI) / 180;
    }
  }

  public getGroup(): Group {
    return this.group;
  }

  public getParticleCount(): number {
    return this.instanceCount;
  }

  public dispose(): void {
    // Dispose InstancedMesh (C.1 optimization)
    if (this.instancedMesh) {
      if (this.instancedMesh.geometry) {
        this.instancedMesh.geometry.dispose();
      }
      if (this.instancedMesh.material && 'dispose' in this.instancedMesh.material) {
        this.instancedMesh.material.dispose();
      }
      this.instancedMesh.dispose();
      this.instancedMesh = null;
    }

    // Clear position arrays
    this.particlePositions = [];
    this.previousPositions = [];
  }
}