// @ts-check
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '../../src/components/common/Screen.js';
import { Button } from '../../src/components/ui/Button.js';
import { Input } from '../../src/components/ui/Input.js';
import { Text } from '../../src/components/ui/Text.js';
import { useTheme } from '../../src/theme/ThemeProvider.js';
import { getErrorMessage } from '../../src/lib/api/errors.js';
import { requestOtp, verifyOtp } from '../../src/features/auth/api.js';
import { storeTokens } from '../../src/lib/storage/secure.js';
import { setCachedAccessToken } from '../../src/features/auth/tokenProvider.js';
import { useSessionStore } from '../../src/stores/session.js';

/** @param {unknown} value */
function asString(value) {
  return typeof value === 'string' ? value : '';
}

/**
 * `POST /auth/otp/verify` (docs/architecture.md §11.2). On success, sets
 * the session store's status directly rather than navigating — the
 * `(auth)` group guard reacts to that change and redirects on its own
 * (docs/architecture.md §6.2 "index.js: Redirects by session state").
 */
export default function VerifyScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams();
  const email = asString(params.email);
  const setStatus = useSessionStore((state) => state.setStatus);

  const [challengeId, setChallengeId] = useState(asString(params.challengeId));
  const [resendAvailableAt, setResendAvailableAt] = useState(
    asString(params.resendAvailableAt) || new Date().toISOString(),
  );
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(/** @type {string | null} */ (null));
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  useEffect(() => {
    function tick() {
      const secondsLeft = Math.max(
        0,
        Math.ceil((new Date(resendAvailableAt).getTime() - Date.now()) / 1000),
      );
      setResendSecondsLeft(secondsLeft);
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [resendAvailableAt]);

  async function handleVerify() {
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const result = await verifyOtp({ challengeId, code });
      await storeTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
      setCachedAccessToken(result.accessToken);
      setStatus(result.onboarding === 'COMPLETE' ? 'ready' : 'needs_onboarding');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    setErrorMessage(null);
    try {
      const result = await requestOtp(email);
      setChallengeId(result.challengeId);
      setResendAvailableAt(result.resendAvailableAt);
      setCode('');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.md }}>
        <Text size="xl" weight="bold">
          Enter your code
        </Text>
        {email ? (
          <Text size="sm" color="textMuted">
            We sent a 6-digit code to {email}.
          </Text>
        ) : null}
        <Input
          label="6-digit code"
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={(value) => {
            setCode(value.replace(/\D/g, ''));
            setErrorMessage(null);
          }}
          errorMessage={errorMessage ?? undefined}
        />
        <Button
          title="Verify"
          onPress={handleVerify}
          loading={isVerifying}
          disabled={code.length !== 6 || isVerifying}
        />
        <Button
          title={resendSecondsLeft > 0 ? `Resend code in ${resendSecondsLeft}s` : 'Resend code'}
          onPress={handleResend}
          variant="secondary"
          loading={isResending}
          disabled={resendSecondsLeft > 0 || isResending}
        />
      </View>
    </Screen>
  );
}
