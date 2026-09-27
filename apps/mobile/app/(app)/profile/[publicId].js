// @ts-check
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '../../../src/components/common/Screen.js';
import { ErrorState } from '../../../src/components/common/ErrorState.js';
import { AnonymousAvatar } from '../../../src/components/ui/AnonymousAvatar.js';
import { Chip } from '../../../src/components/ui/Chip.js';
import { Skeleton } from '../../../src/components/ui/Skeleton.js';
import { Text } from '../../../src/components/ui/Text.js';
import { usePublicProfileQuery } from '../../../src/features/profile/queries.js';
import { getErrorMessage } from '../../../src/lib/api/errors.js';
import { AVATAR_COLOR_HEX } from '../../../src/theme/avatarColors.js';
import { useTheme } from '../../../src/theme/ThemeProvider.js';

/** @param {unknown} value */
function asString(value) {
  return typeof value === 'string' ? value : undefined;
}

/**
 * `GET /profiles/:publicId` — public fields only (§6.2 "Other persona
 * (public fields only)"). Never renders a field the API didn't send: a
 * hidden department/semester/interests is *absent* from the response,
 * not `null` (§11.5), so this screen simply doesn't render that row
 * rather than showing a placeholder.
 */
export default function PublicProfileScreen() {
  const theme = useTheme();
  const { publicId } = useLocalSearchParams();
  const query = usePublicProfileQuery(asString(publicId));

  if (query.isLoading) {
    return (
      <Screen>
        <View style={{ gap: theme.spacing.sm }} testID="public-profile-loading">
          <Skeleton height={80} />
          <Skeleton height={40} />
        </View>
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
      </Screen>
    );
  }

  const profile = query.data;

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
        <AnonymousAvatar
          label={profile.displayName}
          color={AVATAR_COLOR_HEX[profile.avatarColor]}
          size={72}
        />
        <Text size="lg" weight="bold">
          {profile.displayName}
        </Text>

        {profile.department ? (
          <Text size="sm" color="textMuted">
            {profile.department.name}
            {profile.semester ? ` · Semester ${profile.semester}` : ''}
          </Text>
        ) : profile.semester ? (
          <Text size="sm" color="textMuted">
            Semester {profile.semester}
          </Text>
        ) : null}

        {profile.interests && profile.interests.length > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: theme.spacing.xs,
              justifyContent: 'center',
            }}
          >
            {profile.interests.map((interest) => (
              <Chip key={interest.slug} label={interest.name} />
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
