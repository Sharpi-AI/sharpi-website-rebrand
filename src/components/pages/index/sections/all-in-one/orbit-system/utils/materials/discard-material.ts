import { ShaderMaterial } from 'three';

export class DiscardMaterial extends ShaderMaterial {
  constructor() {
    super({
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        void main() {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          discard;
        }
      `
    });
  }
}