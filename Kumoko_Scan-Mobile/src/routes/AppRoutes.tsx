import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Importação de todas as telas
import Login from '../screens/Login';
import Home from '../screens/Home';
import Perfil from '../screens/Perfil';
import Carrinho from '../screens/Carrinho';
import AddProduto from '../screens/AddProduto';
import Catalogo from '../screens/Catalogo';
import DetalhesProduto from '../screens/DetalhesProduto';
import HistoricoCompras from '../screens/HistoricoCompras';
import Configuracoes from '../screens/Configuracoes';

import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// CAIXA 1: APENAS AS TELAS DO RODAPÉ (As 3 principais)
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
        tabBarActiveTintColor: '#8B0000', // Destaque Carmesim nas abas
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
      <Tab.Screen name="Carrinho" component={Carrinho} />
      <Tab.Screen name="Perfil" component={Perfil} /> 
    </Tab.Navigator>
  );
}

// CAIXA 2: O ROTEADOR GERAL (Login + Abas + Telas Escondidas)
export function AppRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      {/* 1. Tela Inicial (Login) */}
      <Stack.Screen name="Login" component={Login} />
      
      {/* 2. O aplicativo principal com as abas no rodapé */}
      <Stack.Screen name="MainApp" component={TabRoutes} />
      
      {/* 3. AS TELAS ESCONDIDAS DO RODAPÉ (Ficam empilhadas por cima) */}
      <Stack.Screen name="AddProduto" component={AddProduto} />
      <Stack.Screen name="Catalogo" component={Catalogo} />
      <Stack.Screen name="DetalhesProduto" component={DetalhesProduto} />
      <Stack.Screen name="HistoricoCompras" component={HistoricoCompras} />
      <Stack.Screen name="Configuracoes" component={Configuracoes} />
      
    </Stack.Navigator>
  );
}