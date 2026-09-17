import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { AppRoutes } from './src/routes/AppRoutes';
import { colors } from './src/theme/colors';
import { CartProvider } from './src/contexts/CartContext'; // 🎯 Importando o provedor do carrinho

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
  },
};

export default function App() {
  return (
    // 🎯 Envolvendo toda a navegação com o CartProvider para que todas as telas conversem
    <CartProvider>
      <NavigationContainer theme={DarkTheme}>
        <StatusBar barStyle="light-content" backgroundColor={colors.surface} />
        <AppRoutes />
      </NavigationContainer>
    </CartProvider>
  );
}