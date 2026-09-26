// @ts-check
import { Component } from 'react';
import { ErrorState } from './ErrorState.js';
import { Screen } from './Screen.js';

/**
 * Root-level crash guard, mounted once in `app/_layout.js` per
 * docs/architecture.md §6.2 (root layout providers list: "... ErrorBoundary").
 * Catches render errors that would otherwise show React Native's red
 * screen in production and shows `ErrorState` with a reset instead.
 *
 * @augments {Component<{ children: import('react').ReactNode }, { hasError: boolean }>}
 */
export class ErrorBoundary extends Component {
  /** @param {{ children: import('react').ReactNode }} props */
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /**
   * @param {unknown} error
   * @param {{ componentStack: string }} info
   */
  componentDidCatch(error, info) {
    // Sentry RN's `beforeSend` scrubbing (§6.4 "Error tracking") is added
    // in a later phase; for now this is the single place a render crash is
    // observable at all, so it goes to the console rather than nowhere.
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Screen>
          <ErrorState
            message="The app hit an unexpected error."
            onRetry={() => this.setState({ hasError: false })}
          />
        </Screen>
      );
    }
    return this.props.children;
  }
}
