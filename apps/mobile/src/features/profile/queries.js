// @ts-check
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProfile,
  getMyProfile,
  getPublicProfile,
  getSettings,
  renameProfile,
  replaceInterests,
  updateProfile,
  updateSettings,
} from './api.js';

export const profileKeys = Object.freeze({
  me: /** @type {const} */ (['profile', 'me']),
  /** @param {string} publicId */
  public: (publicId) => /** @type {const} */ (['profile', 'public', publicId]),
  settings: /** @type {const} */ (['profile', 'settings']),
});

/** docs/architecture.md §6.4 "Caching: ... profile 5m". */
const PROFILE_STALE_TIME_MS = 5 * 60 * 1000;

/** Only meaningful once `session.status === 'ready'` (a profile exists). */
export function useMyProfileQuery() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: getMyProfile,
    staleTime: PROFILE_STALE_TIME_MS,
  });
}

/** @param {string | undefined} publicId */
export function usePublicProfileQuery(publicId) {
  return useQuery({
    queryKey: profileKeys.public(publicId ?? ''),
    queryFn: () => getPublicProfile(/** @type {string} */ (publicId)),
    enabled: Boolean(publicId),
    staleTime: PROFILE_STALE_TIME_MS,
  });
}

export function useCreateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.me, data);
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.me, data);
    },
  });
}

export function useRenameProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: renameProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.me, data);
    },
  });
}

export function useReplaceInterestsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: replaceInterests,
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.me, data);
    },
  });
}

export function useSettingsQuery() {
  return useQuery({ queryKey: profileKeys.settings, queryFn: getSettings });
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.settings, data);
    },
  });
}
