import { Group, Vector3 } from 'three';
import { Particle } from './particle';
import { generateParticlePositions, type ParticlePosition } from './math/geometry-positions';
import type { ParticleSystemSettings, ArrangementType } from './config';

export class ParticleSystem {
  private group: Group;
  private particles: Particle[] = [];
  private settings: ParticleSystemSettings;
  private currentArrangementType: ArrangementType;
  private scale: number;

  // Transition state management
  private isTransitioning: boolean = false;
  private transitionStartTime: number = 0;
  private transitionDuration: number = 1.5; // seconds
  private previousPositions: ParticlePosition[] = [];

  constructor(settings: ParticleSystemSettings, scale: number = 1.0) {
    this.settings = { ...settings };
    this.currentArrangementType = settings.arrangementType;
    this.scale = scale;
    this.group = new Group();

    this.initializeParticles();
  }

  private initializeParticles(): void {
    // Clear existing particles
    this.clearParticles();

    // Generate particle positions
    const particlePositions = generateParticlePositions(this.settings.arrangementType, {
      particleCount: this.settings.particleCount,
      radius: 0.7,
      numLines: this.settings.numLines,
      particlesPerLine: this.settings.particlesPerLine,
      numRings: this.settings.numRings,
      maxParticlesPerRing: this.settings.maxParticlesPerRing,
      spiralTurns: this.settings.spiralTurns
    });

    // Create particles
    for (const particlePos of particlePositions) {
      const particle = new Particle({
        position: particlePos.position,
        size: this.settings.particleSize,
        index: particlePos.index,
        color: this.settings.particleColor
      });

      this.particles.push(particle);
      this.group.add(particle.getMesh());
    }

    // Store positions for potential transitions
    this.previousPositions = [...particlePositions];
  }

  private clearParticles(): void {
    for (const particle of this.particles) {
      this.group.remove(particle.getMesh());
      particle.dispose();
    }
    this.particles = [];
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
        this.particles.length > 0) {

      // Store current positions as previous positions
      this.previousPositions = this.particles.map((particle, index) => ({
        position: particle.getMesh().position.clone(),
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
        // Generate target positions for transition
        const targetPositions = generateParticlePositions(this.settings.arrangementType, {
          particleCount: this.settings.particleCount,
          radius: this.settings.radius,
          numLines: this.settings.numLines,
          particlesPerLine: this.settings.particlesPerLine,
          numRings: this.settings.numRings,
          maxParticlesPerRing: this.settings.maxParticlesPerRing,
          spiralTurns: this.settings.spiralTurns
        });

        // Interpolate positions
        for (let i = 0; i < this.particles.length && i < targetPositions.length; i++) {
          const particle = this.particles[i];
          const previousPos = this.previousPositions[i]?.position || particle.getMesh().position;
          const targetPos = targetPositions[i].position;

          const interpolatedPos = new Vector3(
            this.lerp(previousPos.x, targetPos.x, easedProgress),
            this.lerp(previousPos.y, targetPos.y, easedProgress),
            this.lerp(previousPos.z, targetPos.z, easedProgress)
          );

          particle.updatePosition(interpolatedPos);
        }
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

    // Update individual particles
    for (const particle of this.particles) {
      particle.update(deltaTime);
    }
  }

  public getGroup(): Group {
    return this.group;
  }

  public getParticleCount(): number {
    return this.particles.length;
  }

  public dispose(): void {
    this.clearParticles();
  }
}