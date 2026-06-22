import { useState, useEffect, useRef } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const readValue = (k: string): T => {
    try {
      const item = window.localStorage.getItem(k);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(() => readValue(key));
  const keyRef = useRef(key);
  const skipWriteRef = useRef(false);

  useEffect(() => {
    if (keyRef.current !== key) {
      keyRef.current = key;
      skipWriteRef.current = true;
      setStoredValue(readValue(key));
    }
  });

  useEffect(() => {
    if (skipWriteRef.current) {
      skipWriteRef.current = false;
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {}
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}
