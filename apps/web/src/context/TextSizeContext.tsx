import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type TextSize = 'standard' | 'large' | 'extra-large';

interface TextSizeContextValue {
  textSize: TextSize;
  scalePercent: number;
  setTextSize: (size: TextSize) => void;
  cycleTextSize: () => void;
}

const TextSizeContext = createContext<TextSizeContextValue | null>(null);

const STORAGE_KEY = 'bps-report-text-size';

function getStoredTextSize(defaultSize: TextSize): TextSize {
  if (typeof window === 'undefined') return defaultSize;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'standard' || stored === 'large' || stored === 'extra-large') {
      return stored as TextSize;
    }
  } catch {
    // LocalStorage might be disabled or restricted
  }
  return defaultSize;
}

export const TextSizeProvider: React.FC<React.PropsWithChildren<{ defaultSize?: TextSize }>> = ({
  children,
  defaultSize = 'standard',
}) => {
  const [textSize, setTextSizeState] = useState<TextSize>(() => getStoredTextSize(defaultSize));

  const scalePercent = useMemo(() => {
    switch (textSize) {
      case 'large':
        return 115;
      case 'extra-large':
        return 130;
      case 'standard':
      default:
        return 100;
    }
  }, [textSize]);

  // Synchronize document attributes and localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    root.dataset.textSize = textSize;

    try {
      window.localStorage.setItem(STORAGE_KEY, textSize);
    } catch {
      // Storage might be blocked
    }
  }, [textSize]);

  const setTextSize = useCallback((size: TextSize) => {
    setTextSizeState(size);
  }, []);

  const cycleTextSize = useCallback(() => {
    setTextSizeState((current) => {
      if (current === 'standard') return 'large';
      if (current === 'large') return 'extra-large';
      return 'standard';
    });
  }, []);

  const value = useMemo(
    () => ({
      textSize,
      scalePercent,
      setTextSize,
      cycleTextSize,
    }),
    [textSize, scalePercent, setTextSize, cycleTextSize]
  );

  return <TextSizeContext.Provider value={value}>{children}</TextSizeContext.Provider>;
};

export function useTextSize(): TextSizeContextValue {
  const context = useContext(TextSizeContext);
  if (!context) {
    throw new Error('useTextSize must be used within a TextSizeProvider');
  }
  return context;
}

