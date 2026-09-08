// src/routes/AppRoutes.js
import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Home from '../screens/Home';
import Login from '../screens/Login';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tela temporária
function PlaceholderScreen() {
  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}

// CAIXA 2: As abas do aplicativo (Só quem logou acessa)
function TabRoutes() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Galeria') iconName = 'book';
          else if (route.name === 'Carrinho') iconName = 'cart';
          else if (route.name === 'Perfil') iconName = 'person';
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen name="Galeria" component={Home} options={{ title: 'Chorus of Sin' }} />
      <Tab.Screen name="Carrinho" component={PlaceholderScreen} />
      <Tab.Screen name="Perfil" component={PlaceholderScreen} />
    </Tab.Navigator>
  );
}

// CAIXA 1: O "Portão" do aplicativo
export function AppRoutes() {
  return (
    // headerShown: false tira aquele cabeçalho feio nativo para a tela de login ocupar tudo
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* A primeira tela que carrega é o Login */}
      <Stack.Screen name="Login" component={Login} />
      
      {/* Se o login der certo, ele é jogado para as Rotas com Abas */}
      <Stack.Screen name="MainApp" component={TabRoutes} />
    </Stack.Navigator>
  );
}