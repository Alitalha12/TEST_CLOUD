// @ts-check
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '../../src/components/common/Screen.js';
import { Button } from '../../src/components/ui/Button.js';
import { Input } from '../../src/components/ui/Input.js';
import { Text } from '../../src/components/ui/Text.js';
import { useTheme } from '../../src/theme/ThemeProvider.js';
import { ApiError } from '../../src/lib/api/client.js';
import { getErrorMessage } from '../../src/lib/api/errors.js';
import { requestOtp } from '../../src/features/auth/api.js';

const EMAIL_SHAPE = /^\S+@\S+\.\S+$/;

/**
 * `POST /auth/otp/request` (docs/architecture.md §11.2). Signup and login
 * are the same flow, so this screen never asks "do you have an account?".
 */
export default function EmailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(/** @type {string | null} */ (null));
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);

  const trimmedEmail = email.trim();
  const looksLikeEmail = EMAIL_SHAPE.test(trimmedEmail);
  const isDisabled = !looksLikeEmail || isSubmitting || retryAfterSeconds > 0;

  useEffect(() => {
    if (retryAfterSeconds <= 0) {
      return undefined;
    }
    const interval = setInterval(() => {
      setRetryAfterSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(interval);
    // Depends on "is a countdown running" (a boolean), not the count
    // itself — the interval's own functional updater handles decrementing,
    // so re-running this effect every second would just churn timers.
  }, [retryAfterSeconds > 0]);

  async function handleSubmit() {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await requestOtp(trimmedEmail);
      router.push({
        pathname: '/(auth)/verify',
        params: {
          challengeId: result.challengeId,
          resendAvailableAt: result.resendAvailableAt,
          email: trimmedEmail,
        },
      });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'RATE_LIMITED') {
        const seconds = /** @type {{ retryAfterSeconds?: number }} */ (error.details ?? {})
          .retryAfterSeconds;
        setRetryAfterSeconds(seconds ?? 60);
      }
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.md }}>
        <Text size="xl" weight="bold">
          Your university email
        </Text>
        <Text size="sm" color="textMuted">
          We'll send a 6-digit code to verify it's really you.
        </Text>
        <Input
          label="Email"
          placeholder="you@university.edu"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setErrorMessage(null);
          }}
          errorMessage={errorMessage ?? undefined}
        />
        <Button
          title={retryAfterSeconds > 0 ? `Try again in ${retryAfterSeconds}s` : 'Send code'}
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isDisabled}
        />
      </View>
    </Screen>
  );
}
