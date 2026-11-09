import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import Login from '../screens/Login';
import Home from '../screens/Home';
import Perfil from '../screens/Perfil';
import Carrinho from '../screens/Carrinho';
import AddProduto from '../screens/AddProduto';
import Catalogo from '../screens/Catalogo';
import DetalhesProduto from '../screens/DetalhesProduto';
import HistoricoCompras from '../screens/HistoricoCompras';
import Configuracoes from '../screens/Configuracoes';
import GerenciarAcervo from '../screens/GerenciarAcervo';

import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabRoutes() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, focused }) => {
          let iconName;
          if (route.name === 'Galeria') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'Carrinho') iconName = focused ? 'cart' : 'cart-outline';
          else if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';
          
          return <Ionicons name={iconName as any} size={22} color={color} />;
        },
        tabBarActiveTintColor: colors.primaryBright,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surfaceMuted,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: 8,
          height: 68,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarItemStyle: { borderRadius: 12, marginHorizontal: 8 },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen name="Galeria" component={Home} options={{ title: 'Kumoko' }} />
      <Tab.Screen name="Carrinho" component={Carrinho} />
      <Tab.Screen name="Perfil" component={Perfil} /> 
    </Tab.Navigator>
  );
}

export function AppRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      <Stack.Screen name="Login" component={Login} />
      
      <Stack.Screen name="MainApp" component={TabRoutes} />
      
      <Stack.Screen name="AddProduto" component={AddProduto} />
      <Stack.Screen name="Catalogo" component={Catalogo} />
      <Stack.Screen name="DetalhesProduto" component={DetalhesProduto} />
      <Stack.Screen name="HistoricoCompras" component={HistoricoCompras} />
      <Stack.Screen name="Configuracoes" component={Configuracoes} />
      <Stack.Screen name="GerenciarAcervo" component={GerenciarAcervo} />
      
    </Stack.Navigator>
  );
}