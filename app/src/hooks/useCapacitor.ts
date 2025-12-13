'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  isNativePlatform,
  isIOS,
  isAndroid,
  getPlatform,
  initializeNativePlatform,
  triggerHaptic,
  triggerSelectionHaptic,
} from '@/lib/capacitor/native';

/**
 * Hook to detect and interact with Capacitor native platform
 */
export function useCapacitor() {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Detect platform
    const native = isNativePlatform();
    setIsNative(native);
    setPlatform(getPlatform());

    // Initialize native features if on native platform
    if (native && !isInitialized) {
      initializeNativePlatform().then(() => {
        setIsInitialized(true);
      });
    }
  }, [isInitialized]);

  // Memoized haptic functions
  const hapticLight = useCallback(() => triggerHaptic('light'), []);
  const hapticMedium = useCallback(() => triggerHaptic('medium'), []);
  const hapticHeavy = useCallback(() => triggerHaptic('heavy'), []);
  const hapticSuccess = useCallback(() => triggerHaptic('success'), []);
  const hapticWarning = useCallback(() => triggerHaptic('warning'), []);
  const hapticError = useCallback(() => triggerHaptic('error'), []);
  const hapticSelection = useCallback(() => triggerSelectionHaptic(), []);

  return {
    // Platform detection
    isNative,
    isIOS: isNative && isIOS(),
    isAndroid: isNative && isAndroid(),
    platform,
    isInitialized,

    // Haptic feedback
    hapticLight,
    hapticMedium,
    hapticHeavy,
    hapticSuccess,
    hapticWarning,
    hapticError,
    hapticSelection,
  };
}

/**
 * Hook to use haptic feedback on user interactions
 * Returns an onClick handler that triggers haptics
 */
export function useHapticClick(
  onClick?: () => void,
  style: 'light' | 'medium' | 'heavy' = 'light'
) {
  const { isNative } = useCapacitor();

  return useCallback(() => {
    if (isNative) {
      triggerHaptic(style);
    }
    onClick?.();
  }, [isNative, onClick, style]);
}
