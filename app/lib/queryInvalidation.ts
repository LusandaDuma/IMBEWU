/**
 * @fileoverview Central React Query invalidation helpers for shared data shapes.
 */

import type { QueryClient } from '@tanstack/react-query';

/**
 * All queries that list published / catalogue courses for different roles and screens.
 * Call after any mutation that changes course rows visible in the learner catalogue.
 */
export function invalidateAllCourseCatalogQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['available-courses'] });
  queryClient.invalidateQueries({ queryKey: ['explore-courses'] });
  queryClient.invalidateQueries({ queryKey: ['courses', 'published'] });
}
