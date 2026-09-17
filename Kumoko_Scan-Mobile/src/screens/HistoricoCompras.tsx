import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { api } from '../service/api';

export default function HistoricoCompras() {
  const navigation = useNavigation();
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true); 

  // 🎯 AGORA É REAL: Busca as compras no seu backend
  useEffect(() => {
    const buscarHistorico = async () => {
      try {
        setLoading(true);
        // O backend agora puxa o id sozinho através do token JWT
        const resposta = await api.get('/compras/historico');
        setCompras(resposta.data);
      } catch (error) {
        console.error("Erro ao buscar histórico", error);
      } finally {
        setLoading(false);
      }
    };
    buscarHistorico();
  }, []);

  const formatarData = (dataIso: string) => {
    if (!dataIso) return '--/--/----';
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR');
  };

  const getIconeProduto = (tipo: string) => {
    if (tipo === 'manga') return 'color-palette-outline';
    if (tipo === 'novel') return 'document-text-outline';
    return 'book-outline'; 
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name={getIconeProduto(item.tipo_produto)} size={28} color={colors.primary} />
      </View>
      <View style={styles.infoContainer}>
        {/* Usando o ID do produto provisoriamente até implementarmos um JOIN no backend para trazer o nome real */}
        <Text style={styles.title} numberOfLines={1}>Cód. Obra: {item.produto_id}</Text>
        <Text style={styles.typeText}>Tipo: {item.tipo_produto ? item.tipo_produto.toUpperCase() : 'DESCONHECIDO'}</Text>
        <Text style={styles.dateText}>Adquirido em: {formatarData(item.createdAt)}</Text>
      </View>
      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>R$ {parseFloat(item.preco_pago).toFixed(2).replace('.', ',')}</Text>
        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={{ marginTop: 4 }} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suas Aquisições</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8B0000" style={{ marginTop: 50 }} />
      ) : compras.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={60} color={colors.border} />
          <Text style={styles.emptyText}>Você ainda não possui obras no acervo.</Text>
        </View>
      ) : (
        <FlatList
          data={compras}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, textTransform: 'uppercase' },
  listContainer: { padding: 15 },
  card: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 8, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  iconContainer: { width: 50, height: 50, backgroundColor: '#1A1A1A', borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoContainer: { flex: 1 },
  title: { color: colors.text, fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  typeText: { color: colors.textSecondary, fontSize: 12, marginBottom: 2 },
  dateText: { color: colors.textSecondary, fontSize: 12 },
  priceContainer: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 10 },
  priceText: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.textSecondary, marginTop: 15, fontSize: 14 },
});