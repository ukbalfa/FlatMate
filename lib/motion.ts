import { useSyncExternalStore } from 'react';

const defaultGetSnapshot = () => false;
const defaultSubscribe = () => () => {};

let motionClient: MediaQueryList | undefined;

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  if (!motionClient) {
    motionClient = window.matchMedia('(prefers-reduced-motion: reduce)');
  }
  return motionClient.matches;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return defaultSubscribe;
  if (!motionClient) {
    motionClient = window.matchMedia('(prefers-reduced-motion: reduce)');
  }
  motionClient.addEventListener('change', callback);
  return () => motionClient?.removeEventListener('change', callback);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, defaultGetSnapshot);
}