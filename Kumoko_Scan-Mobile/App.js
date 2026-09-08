// App.js
import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { AppRoutes } from './src/routes/AppRoutes';
import { colors } from './src/theme/colors';

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
  },
};

export default function App() {
  return (
    <NavigationContainer theme={DarkTheme}>
      <StatusBar barStyle="light-content" backgroundColor={colors.surface} />
      <AppRoutes />
    </NavigationContainer>
  );
}