// @ts-check
import { useQuery } from '@tanstack/react-query';
import { fetchDepartments, fetchInterests } from './api.js';

export const metaKeys = Object.freeze({
  interests: /** @type {const} */ (['meta', 'interests']),
  departments: /** @type {const} */ (['meta', 'departments']),
});

const META_STALE_TIME_MS = 24 * 60 * 60 * 1000;

/**
 * `staleTime` of 24h matches docs/architecture.md §6.4 "Caching: ...
 * meta (interests/departments) 24h" — this list changes rarely enough
 * that refetching it every 30s (the query client default) would be waste.
 */
export function useInterestsQuery() {
  return useQuery({
    queryKey: metaKeys.interests,
    queryFn: fetchInterests,
    staleTime: META_STALE_TIME_MS,
  });
}

/** Same caching rationale as `useInterestsQuery` above. */
export function useDepartmentsQuery() {
  return useQuery({
    queryKey: metaKeys.departments,
    queryFn: fetchDepartments,
    staleTime: META_STALE_TIME_MS,
  });
}
