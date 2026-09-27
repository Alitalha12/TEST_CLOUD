// @ts-check
import { useEffect, useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { Screen } from '../../../src/components/common/Screen.js';
import { ErrorState } from '../../../src/components/common/ErrorState.js';
import { AnonymousAvatar } from '../../../src/components/ui/AnonymousAvatar.js';
import { Button } from '../../../src/components/ui/Button.js';
import { Chip } from '../../../src/components/ui/Chip.js';
import { Skeleton } from '../../../src/components/ui/Skeleton.js';
import { Text } from '../../../src/components/ui/Text.js';
import { useDepartmentsQuery, useInterestsQuery } from '../../../src/features/meta/queries.js';
import { fetchProfileOptions } from '../../../src/features/profile/api.js';
import {
  useMyProfileQuery,
  useRenameProfileMutation,
  useReplaceInterestsMutation,
  useUpdateProfileMutation,
} from '../../../src/features/profile/queries.js';
import { getErrorMessage } from '../../../src/lib/api/errors.js';
import { useSessionStore } from '../../../src/stores/session.js';
import { AVATAR_COLOR_HEX } from '../../../src/theme/avatarColors.js';
import { useTheme } from '../../../src/theme/ThemeProvider.js';

const SEMESTERS = Array.from({ length: 12 }, (_, i) => i + 1);
const MAX_INTERESTS = 8;

/**
 * @typedef {import('../../../src/features/profile/api.js').ProfileOption} ProfileOption
 */

/** Own persona: view, edit (department/semester/interests), rename, privacy, logout (§28 P4). */
export default function ProfileScreen() {
  const theme = useTheme();
  const logout = useSessionStore((state) => state.logout);
  const profileQuery = useMyProfileQuery();

  if (profileQuery.isLoading) {
    return (
      <Screen>
        <View style={{ gap: theme.spacing.sm }} testID="profile-loading">
          <Skeleton height={80} />
          <Skeleton height={120} />
          <Skeleton height={120} />
        </View>
      </Screen>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <Screen>
        <ErrorState
          message={getErrorMessage(profileQuery.error)}
          onRetry={() => profileQuery.refetch()}
        />
      </Screen>
    );
  }

  return <ProfileContent profile={profileQuery.data} onLogout={() => logout()} />;
}

/**
 * @param {{
 *   profile: import('../../../src/features/profile/api.js').MyProfile,
 *   onLogout: () => void,
 * }} props
 */
function ProfileContent({ profile, onLogout }) {
  const theme = useTheme();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.lg }}
      >
        <IdentityHeader profile={profile} />
        <AboutSection profile={profile} />
        <InterestsSection profile={profile} />
        <PrivacySection profile={profile} />
        <Button title="Log out" variant="secondary" onPress={onLogout} />
      </ScrollView>
    </Screen>
  );
}

/** @param {{ profile: import('../../../src/features/profile/api.js').MyProfile }} props */
function IdentityHeader({ profile }) {
  const theme = useTheme();
  const renameMutation = useRenameProfileMutation();
  const [isRenaming, setIsRenaming] = useState(false);
  const [options, setOptions] = useState(/** @type {ProfileOption[]} */ ([]));
  const [picked, setPicked] = useState(/** @type {ProfileOption | null} */ (null));
  const [errorMessage, setErrorMessage] = useState(/** @type {string | null} */ (null));

  const canRenameNow = new Date(profile.canRenameAt).getTime() <= Date.now();

  async function startRename() {
    setErrorMessage(null);
    setIsRenaming(true);
    try {
      const result = await fetchProfileOptions();
      setOptions(result.options);
      setPicked(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  async function confirmRename() {
    if (!picked) {
      return;
    }
    setErrorMessage(null);
    try {
      await renameMutation.mutateAsync({
        selectedName: picked.name,
        avatarColor: picked.avatarColor,
      });
      setIsRenaming(false);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  return (
    <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
      <AnonymousAvatar
        label={profile.displayName}
        color={AVATAR_COLOR_HEX[profile.avatarColor]}
        size={72}
      />
      <Text size="lg" weight="bold">
        {profile.displayName}
      </Text>

      {isRenaming ? (
        <View style={{ width: '100%', gap: theme.spacing.sm }}>
          {options.length === 0 ? (
            <Skeleton height={48} />
          ) : (
            options.map((option) => {
              const isSelected =
                picked?.name === option.name && picked?.avatarColor === option.avatarColor;
              return (
                <Chip
                  key={option.name}
                  label={option.name}
                  selected={isSelected}
                  onPress={() => setPicked(option)}
                />
              );
            })
          )}
          {errorMessage ? (
            <Text size="sm" color="danger">
              {errorMessage}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => setIsRenaming(false)}
              disabled={renameMutation.isPending}
            />
            <Button
              title="Confirm"
              onPress={confirmRename}
              loading={renameMutation.isPending}
              disabled={!picked}
            />
          </View>
        </View>
      ) : canRenameNow ? (
        <Button title="Rename" variant="secondary" onPress={startRename} />
      ) : (
        <Text size="xs" color="textMuted">
          You can rename again on {new Date(profile.canRenameAt).toLocaleDateString()}
        </Text>
      )}
    </View>
  );
}

/** @param {{ profile: import('../../../src/features/profile/api.js').MyProfile }} props */
function AboutSection({ profile }) {
  const theme = useTheme();
  const departmentsQuery = useDepartmentsQuery();
  const updateMutation = useUpdateProfileMutation();
  const [departmentId, setDepartmentId] = useState(profile.department?.id ?? null);
  const [semester, setSemester] = useState(profile.semester ?? null);

  useEffect(() => {
    setDepartmentId(profile.department?.id ?? null);
    setSemester(profile.semester ?? null);
  }, [profile.department?.id, profile.semester]);

  const isDirty =
    departmentId !== (profile.department?.id ?? null) || semester !== profile.semester;

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text size="md" weight="bold">
        About
      </Text>
      <Text size="sm" color="textMuted">
        Department
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
        {(departmentsQuery.data ?? []).map((department) => (
          <Chip
            key={department.id}
            label={department.name}
            selected={departmentId === department.id}
            onPress={() =>
              setDepartmentId((current) => (current === department.id ? null : department.id))
            }
          />
        ))}
      </View>
      <Text size="sm" color="textMuted">
        Semester
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
        {SEMESTERS.map((value) => (
          <Chip
            key={value}
            label={String(value)}
            selected={semester === value}
            onPress={() => setSemester((current) => (current === value ? null : value))}
          />
        ))}
      </View>
      {isDirty ? (
        <Button
          title="Save"
          onPress={() => updateMutation.mutate({ departmentId, semester })}
          loading={updateMutation.isPending}
        />
      ) : null}
    </View>
  );
}

/** @param {{ profile: import('../../../src/features/profile/api.js').MyProfile }} props */
function InterestsSection({ profile }) {
  const theme = useTheme();
  const interestsQuery = useInterestsQuery();
  const replaceMutation = useReplaceInterestsMutation();
  const currentSlugs = new Set(profile.interests.map((i) => i.slug));
  const [selected, setSelected] = useState(
    () =>
      new Set((interestsQuery.data ?? []).filter((i) => currentSlugs.has(i.slug)).map((i) => i.id)),
  );

  useEffect(() => {
    if (interestsQuery.data) {
      setSelected(
        new Set(interestsQuery.data.filter((i) => currentSlugs.has(i.slug)).map((i) => i.id)),
      );
    }
    // Only re-sync when the server data or the profile's own interests change.
  }, [interestsQuery.data, profile.interests]);

  /** @param {string} id */
  function toggle(id) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_INTERESTS) {
        next.add(id);
      }
      return next;
    });
  }

  const isDirty =
    selected.size !== currentSlugs.size ||
    (interestsQuery.data ?? []).some((i) => selected.has(i.id) !== currentSlugs.has(i.slug));

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text size="md" weight="bold">
        Interests ({selected.size}/{MAX_INTERESTS})
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
        {(interestsQuery.data ?? []).map((interest) => (
          <Chip
            key={interest.id}
            label={interest.name}
            selected={selected.has(interest.id)}
            onPress={() => toggle(interest.id)}
          />
        ))}
      </View>
      {isDirty ? (
        <Button
          title="Save"
          onPress={() => replaceMutation.mutate([...selected])}
          loading={replaceMutation.isPending}
        />
      ) : null}
    </View>
  );
}

/** @param {{ profile: import('../../../src/features/profile/api.js').MyProfile }} props */
function PrivacySection({ profile }) {
  const theme = useTheme();
  const updateMutation = useUpdateProfileMutation();

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text size="md" weight="bold">
        Privacy
      </Text>
      <PrivacyToggle
        label="Show department to other students"
        value={profile.showDepartment}
        onChange={(showDepartment) => updateMutation.mutate({ showDepartment })}
      />
      <PrivacyToggle
        label="Show semester to other students"
        value={profile.showSemester}
        onChange={(showSemester) => updateMutation.mutate({ showSemester })}
      />
      <PrivacyToggle
        label="Show interests to other students"
        value={profile.showInterests}
        onChange={(showInterests) => updateMutation.mutate({ showInterests })}
      />
      <PrivacyToggle
        label="Allow message requests"
        value={profile.dmPolicy === 'EVERYONE'}
        onChange={(allow) => updateMutation.mutate({ dmPolicy: allow ? 'EVERYONE' : 'NOBODY' })}
      />
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing.xs,
          marginTop: theme.spacing.xs,
        }}
      >
        <Text size="sm" color="textMuted">
          Avatar color
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
        {Object.keys(AVATAR_COLOR_HEX).map((token) => (
          <Chip
            key={token}
            label={token}
            selected={profile.avatarColor === token}
            onPress={() => updateMutation.mutate({ avatarColor: token })}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * @param {{ label: string, value: boolean, onChange: (value: boolean) => void }} props
 */
function PrivacyToggle({ label, value, onChange }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text size="sm" style={{ flex: 1 }}>
        {label}
      </Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
      />
    </View>
  );
}
