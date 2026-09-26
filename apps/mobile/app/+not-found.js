// @ts-check
import { Link } from 'expo-router';
import { Screen } from '../src/components/common/Screen.js';
import { Text } from '../src/components/ui/Text.js';

export default function NotFoundScreen() {
  return (
    <Screen>
      <Text size="lg" weight="bold">
        This screen doesn't exist.
      </Text>
      <Link href="/">
        <Text color="primary">Go to the home screen</Text>
      </Link>
    </Screen>
  );
}
