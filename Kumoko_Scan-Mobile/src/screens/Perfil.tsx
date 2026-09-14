import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function Perfil() {
  const [userData, setUserData] = useState<any>(null);
  const navigation = useNavigation<any>();

  useEffect(() => {
    const carregarPerfil = async () => {
      try {
        const usuarioString = await SecureStore.getItemAsync('usuario');
        if (usuarioString) {
          setUserData(JSON.parse(usuarioString));
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário", error);
      }
    };
    carregarPerfil();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Sair', 'Deseja realmente fechar o acervo?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Sair', 
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('token');
          await SecureStore.deleteItemAsync('usuario');
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    ]);
  };

  const MenuItem = ({ icon, title, subtitle, onPress, color = colors.text }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconContainer}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, { color }]}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.border} />
    </TouchableOpacity>
  );

  if (!userData) return <View style={styles.container} />;

  const isAdmin = userData.is_admin;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Ionicons 
            name={isAdmin ? "star" : "person"} // 🎯 CORREÇÃO: "crown" trocado para "star"
            size={45} 
            color={isAdmin ? "#FFD700" : colors.textSecondary} 
          />
        </View>
        <Text style={styles.userName}>{userData.nome}</Text>
        <Text style={styles.userEmail}>{userData.email}</Text>
        
        <View style={[styles.badge, isAdmin ? styles.badgeAdmin : styles.badgeUser]}>
          <Text style={styles.badgeText}>
            {isAdmin ? 'MESTRE DAS SOMBRAS' : 'LEITOR / CLIENTE'}
          </Text>
        </View>

        <View style={styles.gastoContainer}>
          <Ionicons name="wallet-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.gastoText}>
            Fortuna investida: <Text style={styles.gastoValue}>R$ {userData.total_gasto ? parseFloat(userData.total_gasto).toFixed(2).replace('.', ',') : '0,00'}</Text>
          </Text>
        </View>

      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sua Conta</Text>
        <View style={styles.menuCard}>
          <MenuItem 
            icon="receipt-outline" 
            title="Histórico de Compras" 
            subtitle="Veja suas obras adquiridas" 
            onPress={() => navigation.navigate('HistoricoCompras')}
          />
          <MenuItem 
            icon="settings" 
            title="Configurações" 
            subtitle="Editar dados do perfil e senha" 
            onPress={() => navigation.navigate('Configuracoes')}
          />
        </View>
      </View>

      {isAdmin && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#8B0000' }]}>Painel de Controle</Text>
          <View style={styles.menuCard}>
            <MenuItem 
              icon="library" 
              title="Adicionar Mangá" 
              subtitle="Cadastrar novo mangá na loja" 
              onPress={() => navigation.navigate('AddProduto', { tipo: 'manga' })}
            />
            <MenuItem 
              icon="book" 
              title="Adicionar Livro" 
              subtitle="Cadastrar literatura e volumes" 
              onPress={() => navigation.navigate('AddProduto', { tipo: 'livro' })}
            />
            <MenuItem 
              icon="document-text" 
              title="Adicionar Novel" 
              subtitle="Estrutura de venda de novels" 
              onPress={() => navigation.navigate('AddProduto', { tipo: 'novel' })}
            />
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
        <Text style={styles.logoutText}>Desconectar</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', paddingVertical: 40, borderBottomWidth: 1, borderBottomColor: colors.surface },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.border, marginBottom: 15 },
  userName: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 5 },
  userEmail: { fontSize: 14, color: colors.textSecondary, marginBottom: 15 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 15 },
  badgeAdmin: { backgroundColor: 'rgba(255, 215, 0, 0.1)', borderWidth: 1, borderColor: '#FFD700' },
  badgeUser: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: colors.text, letterSpacing: 1 },
  gastoContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, padding: 8, backgroundColor: '#1A1A1A', borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  gastoText: { color: colors.textSecondary, fontSize: 12, marginLeft: 8 },
  gastoValue: { color: '#4CAF50', fontWeight: 'bold' },
  section: { paddingHorizontal: 20, paddingTop: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  menuCard: { backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIconContainer: { width: 40, alignItems: 'center' },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 2, color: colors.text },
  menuSubtitle: { fontSize: 12, color: colors.textSecondary },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 35, paddingVertical: 15 },
  logoutText: { color: '#FF6B6B', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
});