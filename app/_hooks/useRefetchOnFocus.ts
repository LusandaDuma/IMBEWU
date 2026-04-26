/**
 * @fileoverview Refetch React Query data when a screen (tab) gains focus.
 * React Native does not set TanStack "window" focus; tab switches need explicit refetch.
 */

import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export function useRefetchOnFocus(refetch: () => void | Promise<unknown>, enabled = true) {
  useFocusEffect(
    useCallback(() => {
      if (enabled) {
        void refetch();
      }
    }, [refetch, enabled])
  );
}
