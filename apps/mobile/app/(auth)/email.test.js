// @ts-check
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../src/test-utils/renderWithTheme.js';
import { ApiError } from '../../src/lib/api/client.js';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../src/features/auth/api.js', () => ({
  requestOtp: jest.fn(),
}));

import { requestOtp } from '../../src/features/auth/api.js';
import EmailScreen from './email.js';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('EmailScreen', () => {
  it('does not submit while the email does not look like an email yet', async () => {
    const { getByPlaceholderText, getByText } = await renderWithTheme(<EmailScreen />);

    await fireEvent.changeText(getByPlaceholderText('you@university.edu'), 'not-an-email');
    await fireEvent.press(getByText('Send code'));

    expect(requestOtp).not.toHaveBeenCalled();
  });

  it('shows friendly copy for DOMAIN_NOT_SUPPORTED', async () => {
    jest
      .mocked(requestOtp)
      .mockRejectedValue(
        new ApiError('DOMAIN_NOT_SUPPORTED', "That email domain isn't supported yet."),
      );

    const { getByPlaceholderText, getByText, findByText } = await renderWithTheme(<EmailScreen />);

    await fireEvent.changeText(
      getByPlaceholderText('you@university.edu'),
      'student@unknown.example',
    );
    await fireEvent.press(getByText('Send code'));

    expect(
      await findByText("We don't recognize that email domain yet. Double-check for a typo."),
    ).toBeTruthy();
  });

  it('shows a countdown and disables the button on RATE_LIMITED', async () => {
    jest.useFakeTimers();
    jest
      .mocked(requestOtp)
      .mockRejectedValue(
        new ApiError('RATE_LIMITED', 'Too many requests', { details: { retryAfterSeconds: 30 } }),
      );

    const { getByPlaceholderText, getByText, findByText } = await renderWithTheme(<EmailScreen />);

    await fireEvent.changeText(getByPlaceholderText('you@university.edu'), 'student@uet.edu.pk');
    await fireEvent.press(getByText('Send code'));

    expect(await findByText('Try again in 30s')).toBeTruthy();
    expect(requestOtp).toHaveBeenCalledTimes(1);

    // Pressing again while counting down must not fire a second request —
    // the button is disabled, not just relabeled.
    await fireEvent.press(getByText('Try again in 30s'));
    expect(requestOtp).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});
