// @ts-check
import { FlatList, View } from 'react-native';
import { Screen } from '../src/components/common/Screen.js';
import { QueryStateView } from '../src/components/common/QueryStateView.js';
import { Text } from '../src/components/ui/Text.js';
import { useInterestsQuery } from '../src/features/meta/queries.js';
import { useTheme } from '../src/theme/ThemeProvider.js';

/**
 * End-to-end smoke test for P2's DoD (docs/architecture.md §28 P2): "the
 * dev build ... shows interests fetched from the local server over LAN."
 * Deliberately a top-level route, outside the (auth)/(onboarding)/(app)
 * guards — `GET /meta/interests` is public (packages/shared/src/schemas/meta.js),
 * and P2 hard-codes `session.status` to `unauthenticated`, so this is the
 * only way to see live server data reach the app before P3 builds auth.
 */
export default function MetaCheckScreen() {
  const theme = useTheme();
  const query = useInterestsQuery();

  return (
    <Screen>
      <Text size="lg" weight="bold" style={{ marginBottom: theme.spacing.md }}>
        API smoke test: GET /meta/interests
      </Text>
      <QueryStateView
        isLoading={query.isLoading}
        error={query.error}
        data={query.data}
        onRetry={() => query.refetch()}
        emptyTitle="No interests returned"
        renderContent={(interests) => (
          <FlatList
            data={interests}
            keyExtractor={(item) => item.slug}
            ItemSeparatorComponent={() => <Spacer size={theme.spacing.sm} />}
            renderItem={({ item }) => (
              <Text size="md">
                {item.name}
                {item.category ? ` · ${item.category}` : ''}
              </Text>
            )}
          />
        )}
      />
    </Screen>
  );
}

/** @param {{ size: number }} props */
function Spacer({ size }) {
  return <View style={{ height: size }} />;
}
