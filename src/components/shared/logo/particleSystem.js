import * as THREE from "three";
import { generateLogo } from "@/utils/particleGeometry.js";

export class ParticleSystem {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.config = {
      // Particle configuration
      radius: 1,
      particleSize: 0.085,

      // Animation settings
      continuousAnimation: false,
      animationType: "none",
      animationSpeed: 1.0,
      animationIntensity: 0.3,
      animationDirection: "clockwise",
      animationPhase: 0.2,
      animationAmplitude: 1.0,

      // Rotation settings
      autoRotate: true,
      autoRotateSpeedX: 0.0,
      autoRotateSpeedY: 0.25,
      autoRotateSpeedZ: 0.0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,

      // Camera settings
      cameraPosition: [0, 0, 5],
      cameraTarget: [0, 0, 0],

      // Visual settings
      backgroundColor: "#ffffff",

      ...config,
    };

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.particles = [];
    this.particleGroup = null;
    this.clock = new THREE.Clock();
    this.animationStartTime = 0;
    this.isAnimating = false;

    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupLighting();
    this.createParticles();
    this.setupEventListeners();
    this.animate();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (this.config.backgroundColor === "transparent") {
      this.renderer.setClearColor(0x000000, 0);
    } else {
      this.renderer.setClearColor(this.config.backgroundColor);
    }

    this.renderer.toneMapping = THREE.LinearToneMapping;
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);
  }

  setupCamera() {
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    const frustumSize = 3;
    this.camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );

    this.camera.position.set(...this.config.cameraPosition);
    this.camera.lookAt(...this.config.cameraTarget);
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);
  }

  createParticles() {
    const logoPositions = generateLogo(this.config.radius);

    const geometry = new THREE.SphereGeometry(this.config.particleSize, 12, 12);
    const material = new THREE.MeshBasicMaterial({
      color: 0x573dff,
    });

    logoPositions.forEach((particleData) => {
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(particleData.position);
      particle.userData = {
        index: particleData.index,
        originalPosition: particleData.position.clone(),
        animationOffset: particleData.index * this.config.animationPhase,
      };

      this.particles.push(particle);
      this.particleGroup.add(particle);
    });

    // Set up animation if needed
    if (
      this.config.continuousAnimation ||
      this.isEnterAnimation(this.config.animationType)
    ) {
      this.isAnimating = true;
      this.animationStartTime = this.clock.getElapsedTime() * 1000;
    }
  }

  isEnterAnimation(animationType) {
    return animationType.startsWith("enter-");
  }

  updateParticleAnimations(elapsedTime) {
    if (!this.isAnimating) return;

    const time = elapsedTime * this.config.animationSpeed;

    this.particles.forEach((particle) => {
      const { originalPosition, animationOffset } = particle.userData;
      const animatedTime = time + animationOffset * 1000;

      switch (this.config.animationType) {
        case "continuous-pulse":
          this.applyPulseAnimation(particle, originalPosition, animatedTime);
          break;
        case "continuous-float":
          this.applyFloatAnimation(particle, originalPosition, animatedTime);
          break;
        case "continuous-glow":
          this.applyGlowAnimation(particle, animatedTime);
          break;
        case "continuous-orbit":
          this.applyOrbitAnimation(particle, originalPosition, animatedTime);
          break;
        case "continuous-spin":
          this.applySpinAnimation(particle, animatedTime);
          break;
        case "continuous-breathe":
          this.applyBreatheAnimation(particle, originalPosition, animatedTime);
          break;
        case "continuous-wave":
          this.applyWaveAnimation(particle, originalPosition, animatedTime);
          break;
        case "continuous-ripple":
          this.applyRippleAnimation(particle, originalPosition, animatedTime);
          break;
      }
    });
  }

  applyPulseAnimation(particle, _originalPosition, time) {
    const scale =
      1 + Math.sin(time * 0.003) * this.config.animationIntensity * 0.3;
    particle.scale.setScalar(scale);
  }

  applyFloatAnimation(particle, originalPosition, time) {
    const offset =
      Math.sin(time * 0.002) * this.config.animationIntensity * 0.2;
    particle.position.copy(originalPosition);
    particle.position.y += offset;
  }

  applyGlowAnimation(particle, time) {
    const opacity =
      0.5 + Math.sin(time * 0.004) * this.config.animationIntensity * 0.3;
    particle.material.opacity = Math.max(0.2, Math.min(1, opacity));
  }

  applyOrbitAnimation(particle, originalPosition, time) {
    const angle = time * 0.001 * this.config.animationIntensity;
    const radius = 0.1 * this.config.animationIntensity;
    particle.position.x = originalPosition.x + Math.cos(angle) * radius;
    particle.position.z = originalPosition.z + Math.sin(angle) * radius;
    particle.position.y = originalPosition.y;
  }

  applySpinAnimation(particle, time) {
    particle.rotation.y = time * 0.002 * this.config.animationIntensity;
  }

  applyBreatheAnimation(particle, _originalPosition, time) {
    const scale =
      1 + Math.sin(time * 0.002) * this.config.animationIntensity * 0.2;
    particle.scale.setScalar(scale);
    const opacity =
      0.6 + Math.sin(time * 0.002) * this.config.animationIntensity * 0.2;
    particle.material.opacity = Math.max(0.3, Math.min(1, opacity));
  }

  applyWaveAnimation(particle, originalPosition, time) {
    const waveOffset =
      Math.sin(time * 0.003 + originalPosition.y * 5) *
      this.config.animationIntensity *
      0.1;
    particle.position.copy(originalPosition);
    particle.position.x += waveOffset;
  }

  applyRippleAnimation(particle, originalPosition, time) {
    const distance = originalPosition.distanceTo(new THREE.Vector3(0, 0, 0));
    const ripple =
      Math.sin(time * 0.005 - distance * 10) *
      this.config.animationIntensity *
      0.1;
    particle.position.copy(originalPosition);
    particle.position.multiplyScalar(1 + ripple);
  }

  updateRotation() {
    if (this.config.autoRotate) {
      this.particleGroup.rotation.order = "XYZ";
      this.particleGroup.rotation.x +=
        (this.config.autoRotateSpeedX * Math.PI) / 180;
      this.particleGroup.rotation.y +=
        (this.config.autoRotateSpeedY * Math.PI) / 180;
      this.particleGroup.rotation.z +=
        (this.config.autoRotateSpeedZ * Math.PI) / 180;
    } else {
      this.particleGroup.rotation.order = "ZYX";
      this.particleGroup.rotation.x = (this.config.rotationX * Math.PI) / 180;
      this.particleGroup.rotation.y = (this.config.rotationY * Math.PI) / 180;
      this.particleGroup.rotation.z = (this.config.rotationZ * Math.PI) / 180;
    }
  }

  animate() {
    const elapsedTime = this.clock.getElapsedTime() * 1000;

    this.updateParticleAnimations(elapsedTime);
    this.updateRotation();

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.animate());
  }

  setupEventListeners() {
    window.addEventListener("resize", () => this.handleResize());
  }

  handleResize() {
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    const frustumSize = 3;

    this.camera.left = (frustumSize * aspect) / -2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = frustumSize / -2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);

    if (newConfig.backgroundColor) {
      if (newConfig.backgroundColor === "transparent") {
        this.renderer.setClearColor(0x000000, 0);
      } else {
        this.renderer.setClearColor(newConfig.backgroundColor);
      }
    }

    if (
      newConfig.continuousAnimation !== undefined ||
      newConfig.animationType
    ) {
      this.isAnimating =
        newConfig.continuousAnimation ||
        this.isEnterAnimation(this.config.animationType);
      if (this.isAnimating) {
        this.animationStartTime = this.clock.getElapsedTime() * 1000;
      }
    }
  }

  dispose() {
    this.particles.forEach((particle) => {
      particle.geometry.dispose();
      particle.material.dispose();
    });
    this.renderer.dispose();
    window.removeEventListener("resize", this.handleResize);
  }
}
