// @ts-check
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Screen } from '../../src/components/common/Screen.js';
import { AnonymousAvatar } from '../../src/components/ui/AnonymousAvatar.js';
import { Button } from '../../src/components/ui/Button.js';
import { Text } from '../../src/components/ui/Text.js';
import { Skeleton } from '../../src/components/ui/Skeleton.js';
import { ErrorState } from '../../src/components/common/ErrorState.js';
import { fetchProfileOptions } from '../../src/features/profile/api.js';
import { useOnboardingDraftStore } from '../../src/features/onboarding/store.js';
import { getErrorMessage } from '../../src/lib/api/errors.js';
import { AVATAR_COLOR_HEX } from '../../src/theme/avatarColors.js';
import { useTheme } from '../../src/theme/ThemeProvider.js';

/**
 * @typedef {import('../../src/features/profile/api.js').ProfileOption} ProfileOption
 */

/**
 * §11.6: 3 server-generated pseudonym options, pick one. Regenerating
 * fetches a brand new batch (the server invalidates the previous one) —
 * there is no free-text name anywhere in this screen.
 */
export default function IdentityScreen() {
  const theme = useTheme();
  const router = useRouter();
  const selectOption = useOnboardingDraftStore((state) => state.selectOption);
  const storedSelection = useOnboardingDraftStore((state) => state.selectedOption);

  const [options, setOptions] = useState(/** @type {ProfileOption[]} */ ([]));
  const [picked, setPicked] = useState(/** @type {ProfileOption | null} */ (storedSelection));
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(/** @type {string | null} */ (null));

  const loadOptions = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await fetchProfileOptions();
      setOptions(result.options);
      setPicked(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  function handleContinue() {
    if (!picked) {
      return;
    }
    selectOption(picked);
    router.push('/(onboarding)/interests');
  }

  return (
    <Screen>
      <View style={{ flex: 1, gap: theme.spacing.md }}>
        <Text size="xl" weight="bold">
          Choose your persona
        </Text>
        <Text size="sm" color="textMuted">
          This is how other students will see you. You can rename it once every 30 days later.
        </Text>

        {isLoading ? (
          <View style={{ gap: theme.spacing.sm }} testID="identity-loading">
            <Skeleton height={64} />
            <Skeleton height={64} />
            <Skeleton height={64} />
          </View>
        ) : errorMessage ? (
          <ErrorState message={errorMessage} onRetry={loadOptions} />
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {options.map((option) => {
              const isSelected =
                picked?.name === option.name && picked?.avatarColor === option.avatarColor;
              return (
                <Pressable
                  key={option.name}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setPicked(option)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    padding: theme.spacing.sm,
                    borderRadius: theme.radius.md,
                    borderWidth: 2,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <AnonymousAvatar
                    label={option.name}
                    color={AVATAR_COLOR_HEX[option.avatarColor]}
                  />
                  <Text size="md" weight="medium" style={{ flex: 1 }}>
                    {option.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ marginTop: 'auto', gap: theme.spacing.sm }}>
          <Button
            title="Regenerate options"
            variant="secondary"
            onPress={loadOptions}
            disabled={isLoading}
          />
          <Button title="Continue" onPress={handleContinue} disabled={!picked || isLoading} />
        </View>
      </View>
    </Screen>
  );
}
