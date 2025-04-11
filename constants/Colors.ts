/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    hardcore: {
      primary: '#000000',
      secondary: '#111111',
      accent: '#ffd700',
      text: '#ffffff',
      textSecondary: '#888888',
      border: '#333333',
      card: '#111111',
      emptyState: '#666666',
      favorite: '#ff4757',
    },
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    hardcore: {
      primary: '#000000',
      secondary: '#111111',
      accent: '#ffd700',
      text: '#ffffff',
      textSecondary: '#888888',
      border: '#333333',
      card: '#111111',
      emptyState: '#666666',
      favorite: '#ff4757',
    },
  },
};
