export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceSecondary: string;
  surfaceElevated: string;

  primary: string;
  primaryMuted: string;
  primarySoft: string;

  accent: string;
  accentMuted: string;

  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  layer1: string;
  layer2: string;
  layer3: string;

  success: string;
  warning: string;
  error: string;
  errorSoft: string;

  border: string;
  borderLight: string;
  separator: string;

  overlay: string;
  shimmer: string;

  cardShadow: string;

  tabBar: string;
  tabBarBorder: string;

  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;
}

export const LightTheme: ThemeColors = {
  background: '#F8F6F2',
  backgroundSecondary: '#F0EDE7',
  surface: '#FFFFFF',
  surfaceSecondary: '#F4F1EC',
  surfaceElevated: '#FFFFFF',

  primary: '#5B7B6A',
  primaryMuted: '#7A9B8A',
  primarySoft: 'rgba(91, 123, 106, 0.1)',

  accent: '#C4956A',
  accentMuted: '#D4A87C',

  text: '#2D3436',
  textSecondary: '#636E72',
  textMuted: '#A8B2B7',
  textInverse: '#FFFFFF',

  layer1: '#5B7B6A',
  layer2: '#8B7BAE',
  layer3: '#C4956A',

  success: '#5B7B6A',
  warning: '#D4A87C',
  error: '#C75B5B',
  errorSoft: 'rgba(199, 91, 91, 0.1)',

  border: '#E8E4DE',
  borderLight: '#F0EDE7',
  separator: '#EBE7E1',

  overlay: 'rgba(45, 52, 54, 0.4)',
  shimmer: 'rgba(91, 123, 106, 0.06)',

  cardShadow: 'rgba(45, 52, 54, 0.06)',

  tabBar: '#FFFFFF',
  tabBarBorder: '#E8E4DE',

  inputBackground: '#F4F1EC',
  inputBorder: '#E8E4DE',
  inputPlaceholder: '#A8B2B7',
};

export const DarkTheme: ThemeColors = {
  background: '#171A1C',
  backgroundSecondary: '#1E2224',
  surface: '#222729',
  surfaceSecondary: '#2A2F32',
  surfaceElevated: '#2E3437',

  primary: '#7BA68E',
  primaryMuted: '#9BC4AC',
  primarySoft: 'rgba(123, 166, 142, 0.12)',

  accent: '#D4A87C',
  accentMuted: '#E0BF9A',

  text: '#F0EDEA',
  textSecondary: '#9BA4A8',
  textMuted: '#5F6B70',
  textInverse: '#171A1C',

  layer1: '#7BA68E',
  layer2: '#A99BC4',
  layer3: '#D4A87C',

  success: '#7BA68E',
  warning: '#D4A87C',
  error: '#D47171',
  errorSoft: 'rgba(212, 113, 113, 0.12)',

  border: '#2E3437',
  borderLight: '#363C3F',
  separator: '#2A2F32',

  overlay: 'rgba(0, 0, 0, 0.6)',
  shimmer: 'rgba(123, 166, 142, 0.06)',

  cardShadow: 'rgba(0, 0, 0, 0.2)',

  tabBar: '#1E2224',
  tabBarBorder: '#2A2F32',

  inputBackground: '#2A2F32',
  inputBorder: '#363C3F',
  inputPlaceholder: '#5F6B70',
};
