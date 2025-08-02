import { useEffect, useRef } from 'react';
import { useDebounce } from './use-debounce';

interface UseAutoSaveProps<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave<T>({ 
  data, 
  onSave, 
  delay = 500, 
  enabled = true 
}: UseAutoSaveProps<T>) {
  const debouncedData = useDebounce(data, delay);
  const isFirstRender = useRef(true);
  const isSaving = useRef(false);

  useEffect(() => {
    // Skip first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Skip if disabled or already saving
    if (!enabled || isSaving.current) {
      return;
    }

    // Auto-save
    const save = async () => {
      isSaving.current = true;
      try {
        await onSave(debouncedData);
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        isSaving.current = false;
      }
    };

    save();
  }, [debouncedData, onSave, enabled]);
}