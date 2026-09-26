// @ts-check
import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider.js';

/**
 * A pulsing placeholder block, used by `QueryStateView` (and directly by
 * feature screens) for the loading state of lists and cards. Source:
 * docs/architecture.md §6.3 "components/ui/ ... Skeleton" and §6.4
 * "Loading/empty/error: skeleton -> content / EmptyState / ErrorState".
 *
 * @param {{ width?: number | `${number}%`, height?: number, radius?: number, style?: import('react-native').ViewStyle }} props
 */
export function Skeleton({ width = '100%', height = 16, radius, style }) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      testID="skeleton"
      style={[
        {
          width,
          height,
          borderRadius: radius ?? theme.radius.sm,
          backgroundColor: theme.colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
}
