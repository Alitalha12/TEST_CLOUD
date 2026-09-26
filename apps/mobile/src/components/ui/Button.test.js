// @ts-check
import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../test-utils/renderWithTheme.js';
import { Button } from './Button.js';

describe('Button', () => {
  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    const { getByText } = await renderWithTheme(<Button title="Continue" onPress={onPress} />);

    await fireEvent.press(getByText('Continue'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    const { getByText } = await renderWithTheme(
      <Button title="Continue" onPress={onPress} disabled />,
    );

    await fireEvent.press(getByText('Continue'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress while loading', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await renderWithTheme(
      <Button title="Continue" onPress={onPress} loading testID="submit-button" />,
    );

    await fireEvent.press(getByTestId('submit-button'));

    expect(onPress).not.toHaveBeenCalled();
  });
});
