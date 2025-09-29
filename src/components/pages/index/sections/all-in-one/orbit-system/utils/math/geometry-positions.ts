import { Vector3 } from 'three'

export type ArrangementType = 'fibonacci' | 'spherical-lines' | 'spherical-rings' | 'spherical-spiral'

export interface ParticlePosition {
  position: Vector3
  index: number
}

export const fibonacciSphere = (samples: number, radius: number = 1): ParticlePosition[] => {
  const points: ParticlePosition[] = []
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2
    const radiusAtY = Math.sqrt(1 - y * y)
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

export const generateSphericalLines = (
  particleCount: number,
  numLines: number,
  particlesPerLine: number,
  radius: number
): ParticlePosition[] => {
  const points: ParticlePosition[] = []
  let index = 0
  
  // Auto-calculate optimal distribution if using particleCount
  let actualNumLines = numLines
  let actualParticlesPerLine = particlesPerLine
  
  // If particleCount would result in a very different total, auto-adjust
  const manualTotal = numLines * particlesPerLine
  if (Math.abs(manualTotal - particleCount) > particleCount * 0.2) {
    // Auto-calculate for better distribution
    actualNumLines = Math.max(3, Math.round(Math.sqrt(particleCount * 0.6)))
    actualParticlesPerLine = Math.max(3, Math.round(particleCount / actualNumLines))
  }
  
  // Ensure we don't exceed particleCount significantly
  const projectedTotal = actualNumLines * actualParticlesPerLine
  if (projectedTotal > particleCount * 1.1) {
    actualParticlesPerLine = Math.max(3, Math.floor(particleCount / actualNumLines))
  }

  for (let lineIndex = 0; lineIndex < actualNumLines && index < particleCount; lineIndex++) {
    const phi = (lineIndex / actualNumLines) * Math.PI * 2

    for (let pointIndex = 0; pointIndex < actualParticlesPerLine && index < particleCount; pointIndex++) {
      const theta = (pointIndex / (actualParticlesPerLine - 1)) * Math.PI

      const x = radius * Math.sin(theta) * Math.cos(phi)
      const y = radius * Math.cos(theta)
      const z = radius * Math.sin(theta) * Math.sin(phi)

      points.push({
        position: new Vector3(x, y, z),
        index: index++
      })
    }
  }

  return points
}

export const generateSphericalRings = (
  particleCount: number,
  numRings: number,
  maxParticlesPerRing: number,
  radius: number
): ParticlePosition[] => {
  const points: ParticlePosition[] = []
  let index = 0
  
  // Calculate approximate particles per ring to reach target count
  const avgParticlesPerRing = particleCount / numRings
  
  // Auto-adjust if manual settings are very different from target
  let actualNumRings = numRings
  let actualMaxParticlesPerRing = maxParticlesPerRing
  
  if (avgParticlesPerRing > maxParticlesPerRing * 1.5) {
    // Need more particles per ring
    actualMaxParticlesPerRing = Math.ceil(avgParticlesPerRing * 1.2)
  } else if (avgParticlesPerRing < maxParticlesPerRing * 0.5) {
    // Too many particles per ring, adjust rings count
    actualNumRings = Math.max(3, Math.ceil(particleCount / maxParticlesPerRing))
  }

  for (let ringIndex = 0; ringIndex < actualNumRings && index < particleCount; ringIndex++) {
    const theta = (ringIndex / (actualNumRings - 1)) * Math.PI
    const ringRadius = radius * Math.sin(theta)
    const y = radius * Math.cos(theta)
    
    // Calculate particles for this ring, ensuring we don't exceed total
    const remainingParticles = particleCount - index
    const remainingRings = actualNumRings - ringIndex
    const targetForThisRing = Math.ceil(remainingParticles / remainingRings)
    
    const particlesInRing = Math.max(
      3,
      Math.min(
        targetForThisRing,
        Math.floor(actualMaxParticlesPerRing * Math.sin(theta))
      )
    )

    for (let i = 0; i < particlesInRing && index < particleCount; i++) {
      const phi = (i / particlesInRing) * Math.PI * 2
      const x = ringRadius * Math.cos(phi)
      const z = ringRadius * Math.sin(phi)

      points.push({
        position: new Vector3(x, y, z),
        index: index++
      })
    }
  }

  return points
}

export const generateSphericalSpiral = (
  numParticles: number,
  radius: number,
  turns: number
): ParticlePosition[] => {
  const points: ParticlePosition[] = []

  for (let i = 0; i < numParticles; i++) {
    const t = i / numParticles
    const theta = t * Math.PI
    const phi = t * turns * Math.PI * 2

    const x = radius * Math.sin(theta) * Math.cos(phi)
    const y = radius * Math.cos(theta)
    const z = radius * Math.sin(theta) * Math.sin(phi)

    points.push({
      position: new Vector3(x, y, z),
      index: i
    })
  }

  return points
}

export const generateLogo = (
  radius: number
): ParticlePosition[] => {
  const points: ParticlePosition[] = []
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

// Helper function to get the actual particle count for a given arrangement
export const getActualParticleCount = (
  arrangementType: ArrangementType,
  params: {
    particleCount?: number
    radius?: number
    numLines?: number
    particlesPerLine?: number
    numRings?: number
    maxParticlesPerRing?: number
    spiralTurns?: number
  }
): number => {
  const positions = generateParticlePositions(arrangementType, params)
  return positions.length
}

export const generateParticlePositions = (
  arrangementType: ArrangementType,
  params: {
    particleCount?: number
    radius?: number
    numLines?: number
    particlesPerLine?: number
    numRings?: number
    maxParticlesPerRing?: number
    spiralTurns?: number
  }
): ParticlePosition[] => {
  const {
    particleCount = 100,
    radius = 1,
    numLines = 12,
    particlesPerLine = 20,
    numRings = 10,
    maxParticlesPerRing = 24,
    spiralTurns = 5
  } = params

  switch (arrangementType) {
    case 'fibonacci':
      return fibonacciSphere(particleCount, radius)
    case 'spherical-lines':
      return generateSphericalLines(particleCount, numLines, particlesPerLine, radius)
    case 'spherical-rings':
      return generateSphericalRings(particleCount, numRings, maxParticlesPerRing, radius)
    case 'spherical-spiral':
      return generateSphericalSpiral(particleCount, radius, spiralTurns)
    default:
      return fibonacciSphere(particleCount, radius)
  }
}