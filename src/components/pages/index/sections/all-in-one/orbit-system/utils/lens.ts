import * as THREE from 'three';
import { MeshTransmissionMaterial } from './materials/mesh-transmission-material';
import { DiscardMaterial } from './materials/discard-material';

export interface LensOptions {
  size?: number;
  ior?: number;
  thickness?: number;
  chromaticAberration?: number;
  anisotropy?: number;
  transmission?: number;
  roughness?: number;
  distortion?: number;
  distortionScale?: number;
  temporalDistortion?: number;
  samples?: number;
  backside?: boolean;
  backsideThickness?: number;
  transmissionSampler?: boolean;
  resolution?: number;
  backsideResolution?: number;
  background?: string;
  enabled?: boolean;
}

export class Lens {
  private mainScene: THREE.Scene;
  private lensScene: THREE.Scene;
  private backgroundScene: THREE.Scene;
  private lensMesh!: THREE.Mesh;
  private backgroundMesh!: THREE.Mesh;
  private discardMaterial: DiscardMaterial;
  private transmissionMaterial: MeshTransmissionMaterial;
  private renderTargetMain!: THREE.WebGLRenderTarget;
  private renderTargetBack?: THREE.WebGLRenderTarget;
  private camera: THREE.Camera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private options: Required<Omit<LensOptions, 'backsideResolution'>> & {
    backsideResolution?: number;
  };

  // State for rendering
  private oldBackground: THREE.Color | THREE.Texture | null = null;
  private oldToneMapping: THREE.ToneMapping = THREE.ACESFilmicToneMapping;
  private childObjects: THREE.Object3D[] = [];

  constructor(options: LensOptions = {}) {
    this.options = {
      size: 0.25,
      ior: 1.2,
      thickness: 1.5,
      chromaticAberration: 0.04,
      anisotropy: 0.1,
      transmission: 1,
      roughness: 0,
      distortion: 0,
      distortionScale: 0.5,
      temporalDistortion: 0,
      samples: 6,
      backside: false,
      backsideThickness: 0,
      transmissionSampler: false,
      resolution: 1024,
      background: '#ffffff',
      enabled: true,
      ...options
    };

    // Create scenes
    this.mainScene = new THREE.Scene();
    this.lensScene = new THREE.Scene();
    this.backgroundScene = new THREE.Scene();

    // Create materials
    this.discardMaterial = new DiscardMaterial();
    this.transmissionMaterial = new MeshTransmissionMaterial({
      transmission: this.options.transmission,
      thickness: this.options.thickness,
      roughness: this.options.roughness,
      chromaticAberration: this.options.chromaticAberration,
      anisotropicBlur: this.options.anisotropy,
      distortion: this.options.distortion,
      distortionScale: this.options.distortionScale,
      temporalDistortion: this.options.temporalDistortion,
      samples: this.options.samples,
      transmissionSampler: this.options.transmissionSampler,
      backside: this.options.backside,
      backsideThickness: this.options.backsideThickness
    });

    // Set IOR
    this.transmissionMaterial.ior = this.options.ior;

    // Create render targets
    this.createRenderTargets();

    // Create lens mesh
    this.createLensMesh();

    // Create background mesh
    this.createBackgroundMesh();
  }

  private createRenderTargets(): void {
    const resolution = this.options.resolution!;
    const backsideResolution = this.options.backsideResolution || resolution;

    console.log('Creating render targets with resolution:', resolution);

    this.renderTargetMain = new THREE.WebGLRenderTarget(resolution, resolution, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    });

    console.log('Created main render target:', this.renderTargetMain);

    if (this.options.backside) {
      this.renderTargetBack = new THREE.WebGLRenderTarget(backsideResolution, backsideResolution, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
      });
      console.log('Created backside render target:', this.renderTargetBack);
    }

    // Set the buffer texture for the transmission material
    this.transmissionMaterial.setBuffer(this.renderTargetMain.texture);
    console.log('Set buffer texture on transmission material');
  }

  private createLensMesh(): void {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    this.lensMesh = new THREE.Mesh(geometry, this.transmissionMaterial);
    this.lensMesh.scale.setScalar(this.options.size);
    this.lensMesh.position.set(0, 0, 0);
    this.mainScene.add(this.lensMesh);
  }

  private createBackgroundMesh(): void {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({
      map: this.renderTargetMain.texture,
      transparent: true
    });

    this.backgroundMesh = new THREE.Mesh(geometry, material);
    this.backgroundMesh.position.set(0, 0, -1);
    this.backgroundScene.add(this.backgroundMesh);
  }

  public setCamera(camera: THREE.Camera): void {
    this.camera = camera;
    this.updateBackgroundMeshScale();
  }

  public setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
  }

  private updateBackgroundMeshScale(): void {
    if (!this.camera) return;

    if (this.camera instanceof THREE.PerspectiveCamera) {
      const distance = Math.abs(this.backgroundMesh.position.z);
      const vFov = (this.camera.fov * Math.PI) / 180;
      const height = 2 * Math.tan(vFov / 2) * distance;
      const width = height * this.camera.aspect;
      this.backgroundMesh.scale.set(width, height, 1);
    } else if (this.camera instanceof THREE.OrthographicCamera) {
      const width = Math.abs(this.camera.right - this.camera.left);
      const height = Math.abs(this.camera.top - this.camera.bottom);
      this.backgroundMesh.scale.set(width, height, 1);
    }
  }

  public addChild(object: THREE.Object3D): void {
    this.lensScene.add(object);
    this.childObjects.push(object);
  }

  public removeChild(object: THREE.Object3D): void {
    this.lensScene.remove(object);
    const index = this.childObjects.indexOf(object);
    if (index > -1) {
      this.childObjects.splice(index, 1);
    }
  }

  public update(deltaTime: number): void {
    if (!this.options.enabled) return;

    // Update transmission material time
    this.transmissionMaterial.updateTime(deltaTime);
  }

  public render(renderer: THREE.WebGLRenderer, camera: THREE.Camera, mainScene: THREE.Scene): void {
    if (!this.options.enabled) {
      console.log('Lens disabled, rendering normally');
      renderer.render(mainScene, camera);
      return;
    }

    console.log('Lens render start');

    // Store original state
    this.oldBackground = mainScene.background;
    this.oldToneMapping = renderer.toneMapping;

    // Set background if specified
    const backgroundTexture = this.options.background ? new THREE.Color(this.options.background) : null;

    // Disable tone mapping for accurate captures
    renderer.toneMapping = THREE.NoToneMapping;
    if (backgroundTexture) {
      mainScene.background = backgroundTexture;
      console.log('Set background color:', this.options.background);
    }

    // Render backside if needed
    if (this.options.backside && this.renderTargetBack) {
      console.log('Rendering backside to render target');
      renderer.setRenderTarget(this.renderTargetBack);
      renderer.render(this.lensScene, camera);

      // Update material for backside rendering
      this.transmissionMaterial.setBuffer(this.renderTargetBack.texture);
      this.transmissionMaterial.side = THREE.BackSide;
      this.transmissionMaterial.uniforms.thickness.value = this.options.backsideThickness;
    }

    // Render main lens scene to buffer
    console.log('Rendering lens scene to main render target');
    console.log('Lens scene children:', this.lensScene.children.length);
    renderer.setRenderTarget(this.renderTargetMain);
    renderer.clear();
    renderer.render(this.lensScene, camera);

    // Update material for front side rendering
    this.transmissionMaterial.setBuffer(this.renderTargetMain.texture);
    this.transmissionMaterial.side = THREE.FrontSide;
    this.transmissionMaterial.uniforms.thickness.value = this.options.thickness;
    console.log('Updated transmission material with buffer texture');

    // Restore render target
    renderer.setRenderTarget(null);

    // Restore original state
    mainScene.background = this.oldBackground;
    renderer.toneMapping = this.oldToneMapping;

    // Now render the main scene normally - the lens will use the captured buffer
    console.log('Rendering main scene with lens');
    renderer.render(mainScene, camera);

    // Render background mesh with captured texture
    console.log('Rendering background mesh');
    renderer.autoClear = false;
    renderer.render(this.backgroundScene, camera);
    renderer.autoClear = true;

    console.log('Lens render complete');
  }

  public getMainScene(): THREE.Scene {
    return this.mainScene;
  }

  public getLensScene(): THREE.Scene {
    return this.lensScene;
  }

  public updateOptions(newOptions: Partial<LensOptions>): void {
    this.options = { ...this.options, ...newOptions };

    // Update transmission material properties
    if (newOptions.transmission !== undefined) {
      this.transmissionMaterial.uniforms._transmission.value = newOptions.transmission;
    }
    if (newOptions.thickness !== undefined) {
      this.transmissionMaterial.uniforms.thickness.value = newOptions.thickness;
    }
    if (newOptions.roughness !== undefined) {
      this.transmissionMaterial.uniforms.roughness.value = newOptions.roughness;
    }
    if (newOptions.chromaticAberration !== undefined) {
      this.transmissionMaterial.uniforms.chromaticAberration.value = newOptions.chromaticAberration;
    }
    if (newOptions.anisotropy !== undefined) {
      this.transmissionMaterial.uniforms.anisotropicBlur.value = newOptions.anisotropy;
    }
    if (newOptions.ior !== undefined) {
      this.transmissionMaterial.ior = newOptions.ior;
    }

    // Update distortion parameters
    if (newOptions.distortion !== undefined) {
      this.transmissionMaterial.uniforms.distortion.value = newOptions.distortion;
    }
    if (newOptions.distortionScale !== undefined) {
      this.transmissionMaterial.uniforms.distortionScale.value = newOptions.distortionScale;
    }
    if (newOptions.temporalDistortion !== undefined) {
      this.transmissionMaterial.uniforms.temporalDistortion.value = newOptions.temporalDistortion;
    }

    // Update lens mesh scale
    if (newOptions.size !== undefined) {
      this.lensMesh.scale.setScalar(newOptions.size);
    }

    console.log('Updated lens options:', newOptions);
  }

  public dispose(): void {
    // Dispose render targets
    this.renderTargetMain.dispose();
    if (this.renderTargetBack) {
      this.renderTargetBack.dispose();
    }

    // Dispose materials
    this.transmissionMaterial.dispose();
    this.discardMaterial.dispose();

    // Dispose geometries
    this.lensMesh.geometry.dispose();
    this.backgroundMesh.geometry.dispose();
    if (this.backgroundMesh.material instanceof THREE.Material) {
      this.backgroundMesh.material.dispose();
    }

    // Clear arrays
    this.childObjects = [];
  }
}