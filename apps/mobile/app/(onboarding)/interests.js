// @ts-check
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Screen } from '../../src/components/common/Screen.js';
import { Button } from '../../src/components/ui/Button.js';
import { Chip } from '../../src/components/ui/Chip.js';
import { Text } from '../../src/components/ui/Text.js';
import { useDepartmentsQuery, useInterestsQuery } from '../../src/features/meta/queries.js';
import { useOnboardingDraftStore } from '../../src/features/onboarding/store.js';
import { useCreateProfileMutation } from '../../src/features/profile/queries.js';
import { getErrorMessage } from '../../src/lib/api/errors.js';
import { useSessionStore } from '../../src/stores/session.js';
import { useTheme } from '../../src/theme/ThemeProvider.js';

const SEMESTERS = Array.from({ length: 12 }, (_, i) => i + 1);
const MAX_INTERESTS = 8;

/**
 * Final onboarding step (§28 P4): optional department/semester, optional
 * interests (up to `MAX_INTERESTS`), then one `POST /me/profile` call
 * using everything collected across this wizard.
 */
export default function InterestsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const setSessionStatus = useSessionStore((state) => state.setStatus);

  const acceptedGuidelines = useOnboardingDraftStore((state) => state.acceptedGuidelines);
  const selectedOption = useOnboardingDraftStore((state) => state.selectedOption);
  const resetDraft = useOnboardingDraftStore((state) => state.reset);

  const departmentsQuery = useDepartmentsQuery();
  const interestsQuery = useInterestsQuery();
  const createProfileMutation = useCreateProfileMutation();

  const [departmentId, setDepartmentId] = useState(/** @type {string | null} */ (null));
  const [semester, setSemester] = useState(/** @type {number | null} */ (null));
  const [interestIds, setInterestIds] = useState(/** @type {string[]} */ ([]));
  const [errorMessage, setErrorMessage] = useState(/** @type {string | null} */ (null));

  const canSubmit =
    Boolean(acceptedGuidelines && selectedOption) && !createProfileMutation.isPending;

  const departments = departmentsQuery.data ?? [];
  const interests = interestsQuery.data ?? [];

  const interestsByCategory = useMemo(() => {
    /** @type {Record<string, typeof interests>} */
    const groups = {};
    for (const interest of interests) {
      const key = interest.category ?? 'Other';
      groups[key] = groups[key] ?? [];
      groups[key].push(interest);
    }
    return groups;
  }, [interests]);

  /** @param {string} interestId */
  function toggleInterest(interestId) {
    setInterestIds((current) => {
      if (current.includes(interestId)) {
        return current.filter((id) => id !== interestId);
      }
      if (current.length >= MAX_INTERESTS) {
        return current;
      }
      return [...current, interestId];
    });
  }

  async function handleFinish() {
    if (!selectedOption) {
      // Defensive — the guard on `(onboarding)` and the disabled button
      // above should make this unreachable in practice.
      router.replace('/(onboarding)/identity');
      return;
    }
    setErrorMessage(null);
    try {
      await createProfileMutation.mutateAsync({
        selectedName: selectedOption.name,
        avatarColor: selectedOption.avatarColor,
        acceptedGuidelines: true,
        ...(departmentId ? { departmentId } : {}),
        ...(semester ? { semester } : {}),
        ...(interestIds.length > 0 ? { interestIds } : {}),
      });
      resetDraft();
      setSessionStatus('ready');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.lg }}
      >
        <View style={{ gap: theme.spacing.xs }}>
          <Text size="xl" weight="bold">
            Your interests
          </Text>
          <Text size="sm" color="textMuted">
            All optional — you can change these any time from your profile.
          </Text>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text size="md" weight="bold">
            Department
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            {departments.map((department) => (
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
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text size="md" weight="bold">
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
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text size="md" weight="bold">
            Interests ({interestIds.length}/{MAX_INTERESTS})
          </Text>
          {Object.entries(interestsByCategory).map(([category, categoryInterests]) => (
            <View key={category} style={{ gap: theme.spacing.xs }}>
              <Text size="sm" color="textMuted">
                {category}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                {categoryInterests.map((interest) => (
                  <Chip
                    key={interest.id}
                    label={interest.name}
                    selected={interestIds.includes(interest.id)}
                    onPress={() => toggleInterest(interest.id)}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>

        {errorMessage ? (
          <Text size="sm" color="danger">
            {errorMessage}
          </Text>
        ) : null}

        <Button
          title="Finish"
          onPress={handleFinish}
          loading={createProfileMutation.isPending}
          disabled={!canSubmit}
        />
      </ScrollView>
    </Screen>
  );
}
