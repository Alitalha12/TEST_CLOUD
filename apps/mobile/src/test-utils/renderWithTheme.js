// @ts-check
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/ThemeProvider.js';

/**
 * Wraps a component under test with `ThemeProvider`, since every
 * `components/ui` and `components/common` component reads `useTheme()`.
 * `render` itself is async in this major version of RNTL (React 19
 * concurrent rendering requires `act()` to flush asynchronously).
 * @param {import('react').ReactElement} ui
 */
export function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}
