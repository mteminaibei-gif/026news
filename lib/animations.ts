/**
 * Fluid Motion Animation Utilities
 * Provides consistent, smooth animations across the application
 */

// Animation variants for consistent motion
export const animationVariants = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },

  // Slide animations
  slideInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  slideInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  // Stagger animations for lists
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  },

  // Container for staggered children
  staggerContainer: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  },
}

// Tailwind CSS animation classes for non-Framer Motion usage
export const animationClasses = {
  // Smooth fade-in
  fadeIn: 'animate-[fade-in_0.3s_ease-out]',
  fadeInUp: 'animate-[fade-in-up_0.4s_ease-out]',
  fadeInDown: 'animate-[fade-in-down_0.4s_ease-out]',

  // Scale effects
  scaleIn: 'animate-[scale-in_0.3s_ease-out]',
  scaleInSm: 'animate-[scale-in-sm_0.3s_ease-out]',

  // Pulse/breathing effect
  pulse: 'animate-pulse',

  // Slide effects
  slideInUp: 'animate-[slide-in-up_0.4s_ease-out]',
  slideInDown: 'animate-[slide-in-down_0.4s_ease-out]',

  // Bounce effects
  bounce: 'animate-bounce',
  bounceIn: 'animate-[bounce-in_0.6s_ease-out]',
}

// Custom keyframe styles to add to globals.css
export const customKeyframes = `
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes scale-in-sm {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slide-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
  }
  70% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}
`

// Smooth transition defaults
export const smoothTransition =
  'transition-all duration-300 ease-in-out'

export const smoothTransitionFast =
  'transition-all duration-200 ease-in-out'

export const smoothTransitionSlow =
  'transition-all duration-500 ease-in-out'

// Utility function to combine animation classes
export function combineAnimations(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Loading shimmer animation
export const shimmerAnimation = (width: string = '100%', height: string = '1rem') => ({
  background: 'linear-gradient(90deg, #f0faf2 25%, #e8f5ea 50%, #f0faf2 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 2s infinite',
  width,
  height,
})
