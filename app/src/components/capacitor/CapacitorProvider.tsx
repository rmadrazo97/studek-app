'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import {
  isNativePlatform,
  getPlatform,
  initializeNativePlatform,
} from '@/lib/capacitor/native';

interface CapacitorContextType {
  isNative: boolean;
  platform: 'ios' | 'android' | 'web';
  isInitialized: boolean;
}

const CapacitorContext = createContext<CapacitorContextType>({
  isNative: false,
  platform: 'web',
  isInitialized: false,
});

export function useCapacitorContext() {
  return useContext(CapacitorContext);
}

interface CapacitorProviderProps {
  children: ReactNode;
}

/**
 * CapacitorProvider initializes native platform features when the app loads
 * Wrap your app with this provider to enable Capacitor functionality
 */
export function CapacitorProvider({ children }: CapacitorProviderProps) {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const native = isNativePlatform();
    setIsNative(native);
    setPlatform(getPlatform());

    if (native) {
      initializeNativePlatform().then(() => {
        setIsInitialized(true);
      });
    } else {
      setIsInitialized(true);
    }
  }, []);

  // Add platform-specific classes to html and body for CSS targeting
  useEffect(() => {
    if (isNative) {
      // Add to both html and body for comprehensive CSS targeting
      document.documentElement.classList.add('capacitor-native');
      document.documentElement.classList.add(`capacitor-${platform}`);
      document.body.classList.add('capacitor-native');
      document.body.classList.add(`capacitor-${platform}`);
    }

    return () => {
      document.documentElement.classList.remove('capacitor-native');
      document.documentElement.classList.remove('capacitor-ios');
      document.documentElement.classList.remove('capacitor-android');
      document.body.classList.remove('capacitor-native');
      document.body.classList.remove('capacitor-ios');
      document.body.classList.remove('capacitor-android');
    };
  }, [isNative, platform]);

  return (
    <CapacitorContext.Provider value={{ isNative, platform, isInitialized }}>
      {children}
    </CapacitorContext.Provider>
  );
}
