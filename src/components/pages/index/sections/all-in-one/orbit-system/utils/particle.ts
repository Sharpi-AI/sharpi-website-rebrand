import { Mesh, SphereGeometry, MeshBasicMaterial, Vector3 } from 'three';
import type { AnimationType } from './config';

interface ParticleConfig {
  position: Vector3;
  size: number;
  index: number;
  color?: string;
}

export class Particle {
  private mesh: Mesh;
  private targetPosition: Vector3;
  private index: number;

  constructor(config: ParticleConfig) {
    this.index = config.index;
    this.targetPosition = config.position.clone();

    // Create geometry and material
    const geometry = new SphereGeometry(config.size, 16, 16);
    const material = new MeshBasicMaterial({
      color: config.color || '#8972ff',
      transparent: true
    });

    // Create mesh
    this.mesh = new Mesh(geometry, material);
    this.mesh.position.copy(config.position);
  }

  public getMesh(): Mesh {
    return this.mesh;
  }

  public getIndex(): number {
    return this.index;
  }

  public updatePosition(newPosition: Vector3): void {
    this.targetPosition = newPosition.clone();
    this.mesh.position.copy(newPosition);
  }

  public setColor(color: string): void {
    if (this.mesh.material && 'color' in this.mesh.material) {
      (this.mesh.material as any).color.set(color);
    }
  }

  public setOpacity(opacity: number): void {
    if (this.mesh.material && 'opacity' in this.mesh.material) {
      (this.mesh.material as any).opacity = opacity;
    }
  }

  public setScale(scale: number): void {
    this.mesh.scale.setScalar(scale);
  }

  public update(deltaTime: number): void {
    // For now, just static positioning
    // Future: Add basic animations here if needed
  }

  public dispose(): void {
    if (this.mesh.geometry) {
      this.mesh.geometry.dispose();
    }
    if (this.mesh.material && 'dispose' in this.mesh.material) {
      this.mesh.material.dispose();
    }
  }
}