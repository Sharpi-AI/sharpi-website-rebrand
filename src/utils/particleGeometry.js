import { Vector3 } from 'three'

/**
 * Generates logo particle positions in a spherical ring pattern
 * @param {number} radius - The radius of the sphere
 * @returns {Array<{position: Vector3, index: number}>} Array of particle positions
 */
export const generateLogo = (radius) => {
  const points = []
  let index = 0

  // Custom ring pattern: [1, 8, 8, 8, 1] particles per ring
  const ringsPattern = [1, 8, 8, 8, 1]
  const numRings = ringsPattern.length

  for (let ringIndex = 0; ringIndex < numRings; ringIndex++) {
    const theta = (ringIndex / (numRings - 1)) * Math.PI
    const ringRadius = radius * Math.sin(theta)
    const y = radius * Math.cos(theta)

    const particlesInRing = ringsPattern[ringIndex]

    for (let i = 0; i < particlesInRing; i++) {
      const phi = (i / particlesInRing) * Math.PI * 2
      const x = ringRadius * Math.cos(phi)
      const z = ringRadius * Math.sin(phi)

      // Apply 90-degree rotation around Z-axis
      // Rotation matrix for Z-axis: newX = -y, newY = x, newZ = z
      const rotatedX = -y
      const rotatedY = x
      const rotatedZ = z

      points.push({
        position: new Vector3(rotatedX, rotatedY, rotatedZ),
        index: index++
      })
    }
  }

  return points
}

/**
 * Generates particles arranged in a Fibonacci spiral pattern
 * @param {number} particleCount - Number of particles to generate
 * @param {number} radius - The radius of the sphere
 * @returns {Array<{position: Vector3, index: number}>} Array of particle positions
 */
export const generateFibonacci = (particleCount = 100, radius = 1) => {
  const points = []
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)) // Golden angle in radians (~137.5°)

  for (let i = 0; i < particleCount; i++) {
    // y goes from 1 to -1
    const y = 1 - (i / (particleCount - 1)) * 2

    // radius at y
    const radiusAtY = Math.sqrt(1 - y * y)

    // golden angle increment
    const theta = goldenAngle * i

    const x = Math.cos(theta) * radiusAtY
    const z = Math.sin(theta) * radiusAtY

    points.push({
      position: new Vector3(x * radius, y * radius, z * radius),
      index: i
    })
  }

  return points
}

/**
 * Generic particle arrangement generator
 * @param {string} arrangementType - Type of arrangement ('logo' | 'fibonacci')
 * @param {Object} options - Configuration options
 * @param {number} options.particleCount - Number of particles
 * @param {number} options.radius - Radius of arrangement
 * @returns {Array<{position: Vector3, index: number}>} Array of particle positions
 */
export const generateParticlePositions = (arrangementType, options = {}) => {
  const { particleCount = 100, radius = 1 } = options

  switch (arrangementType) {
    case 'fibonacci':
      return generateFibonacci(particleCount, radius)
    case 'logo':
    default:
      return generateLogo(radius)
  }
}