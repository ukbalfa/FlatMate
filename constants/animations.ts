// Animation constants - optimized with staggered delays
export const ANIMATION = {
  fade: (delay = 0) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5, delay }
  }),
  fadeUp: (delay = 0, y = 10) => ({
    initial: { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay }
  }),
  scaleIn: (delay = 0) => ({
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, delay }
  }),
  slideIn: (delay = 0) => ({
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5, delay }
  })
};