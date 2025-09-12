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