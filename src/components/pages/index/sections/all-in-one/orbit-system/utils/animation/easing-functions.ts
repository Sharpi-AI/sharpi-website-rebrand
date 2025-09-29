export type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'

export const easingFunctions = {
  linear: (t: number): number => t,
  
  'ease-in': (t: number): number => t * t,
  
  'ease-out': (t: number): number => 1 - Math.pow(1 - t, 2),
  
  'ease-in-out': (t: number): number => 
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

export const applyEasing = (progress: number, easingType: EasingType): number => {
  return easingFunctions[easingType](Math.max(0, Math.min(1, progress)))
}