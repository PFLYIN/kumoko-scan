import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { api } from '../service/api';
import { colors } from '../theme/colors';

export default function GerenciarAcervo() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      // Buscamos os mangás (você pode expandir para livros e novels se necessário)
      const response = await api.get('/mangas');
      setProdutos(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar o acervo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      carregarProdutos();
    });
    return unsubscribe;
  }, [navigation]);

  const excluirProduto = async (id: number) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza de que deseja remover esta obra permanentemente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('userToken');
              await api.delete(`/mangas/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });

              setProdutos(produtos.filter(item => item.id !== id));
              Alert.alert('Sucesso', 'Obra removida do acervo.');
            } catch (error) {
              console.error(error);
              Alert.alert('Erro', 'Falha ao excluir a obra.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GERENCIAR ACERVO</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : produtos.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="book-outline" size={60} color={colors.border} />
          <Text style={styles.emptyText}>Nenhuma obra cadastrada no acervo.</Text>
        </View>
      ) : (
        <FlatList
          data={produtos}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.infoContainer}>
                <Text style={styles.productName} numberOfLines={1}>{item.nome}</Text>
                <Text style={styles.productDetails}>Vol. {item.volume || 'Único'} | R$ {parseFloat(item.preco || 0).toFixed(2).replace('.', ',')}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => navigation.navigate('AddProduto', { produtoParaEditar: item, tipo: 'manga' })}
                >
                  <Ionicons name="create-outline" size={20} color="#4CAF50" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => excluirProduto(item.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, letterSpacing: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.textSecondary, marginTop: 10, fontSize: 14 },
  listContainer: { padding: 20 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  infoContainer: { flex: 1, marginRight: 10 },
  productName: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  productDetails: { fontSize: 13, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 8, backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border }
});