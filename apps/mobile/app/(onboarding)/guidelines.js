// @ts-check
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { Screen } from '../../src/components/common/Screen.js';
import { Button } from '../../src/components/ui/Button.js';
import { Text } from '../../src/components/ui/Text.js';
import { useOnboardingDraftStore } from '../../src/features/onboarding/store.js';
import { useTheme } from '../../src/theme/ThemeProvider.js';

const GUIDELINES = [
  'Be a real person, but not yourself — your posts and messages are tied to one stable pseudonym, not your name.',
  'No harassment, bullying, threats, or sharing anyone else’s personal information.',
  'No spam, scams, or impersonating another student, staff member, or organization.',
  'Content flagged as unverified or personal experience should be treated as exactly that.',
];

/**
 * §28 P4 onboarding: 18+ confirmation, community guidelines, and the
 * privacy explainer — "your identity is hidden from other students"
 * (never "no one can identify you": the platform itself always knows who
 * you are, §11.1). Must accept to continue (§6.2 guidelines.js doc:
 * "must accept to continue").
 */
export default function GuidelinesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const acceptGuidelines = useOnboardingDraftStore((state) => state.acceptGuidelines);
  const [isChecked, setIsChecked] = useState(false);

  function handleContinue() {
    acceptGuidelines();
    router.push('/(onboarding)/identity');
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: theme.spacing.lg }}
      >
        <Text size="xl" weight="bold">
          Before you get started
        </Text>

        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            gap: theme.spacing.xs,
          }}
        >
          <Text size="sm" weight="bold">
            Your identity is hidden from other students
          </Text>
          <Text size="sm" color="textMuted">
            Other students only ever see a generated pseudonym like "Anonymous Fox #2841" — never
            your name or email. That pseudonym is stable: every post and message you send is linked
            to it, so other students can recognize your posts over time. The university you verified
            with can always identify your account.
          </Text>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text size="md" weight="bold">
            Community guidelines
          </Text>
          {GUIDELINES.map((guideline) => (
            <Text key={guideline} size="sm" color="textMuted">
              {'•'} {guideline}
            </Text>
          ))}
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isChecked }}
          onPress={() => setIsChecked((current) => !current)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: theme.radius.sm,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: isChecked ? theme.colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isChecked ? (
              <Text size="sm" weight="bold" color="primaryText">
                {'✓'}
              </Text>
            ) : null}
          </View>
          <Text size="sm" style={{ flex: 1 }}>
            I'm 18 or older and I agree to follow these guidelines.
          </Text>
        </Pressable>

        <Button title="I agree, continue" onPress={handleContinue} disabled={!isChecked} />
      </ScrollView>
    </Screen>
  );
}
