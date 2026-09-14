import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { colors } from '../theme/colors';
import { api } from '../service/api';

const getBaseUrl = () => {
  if (Platform.OS === 'android' && !Constants.expoConfig?.hostUri) return 'http://10.0.2.2:3000';
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  return `http://${debuggerHost ? debuggerHost.split(':')[0] : 'localhost'}:3000`;
};

export default function Catalogo() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const tipo = route.params?.tipo || 'mangas'; 

  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatImageUrl = (urlDoBanco: string) => {
    if (!urlDoBanco) return null;
    const fileName = urlDoBanco.split('\\').pop()?.split('/').pop();
    return `${getBaseUrl()}/files/covers/${fileName}`;
  };

  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        const resposta = await api.get(`/${tipo}`);
        setProdutos(resposta.data);
      } catch (error) {
        console.error(`Erro ao buscar ${tipo}:`, error);
      } finally {
        setLoading(false);
      }
    };
    carregarProdutos();
  }, [tipo]);

  const renderProductCard = ({ item }: any) => {
    const imagemUri = formatImageUrl(item.capa_url);
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.8}
        // Navega para DetalhesProduto passando os dados do item
        onPress={() => navigation.navigate('DetalhesProduto', { produto: item })}
      >
        <View style={styles.imageContainer}>
          {imagemUri ? (
            <Image source={{ uri: imagemUri }} style={styles.capaImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="book-outline" size={40} color={colors.border} />
            </View>
          )}
          {item.preco && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>R$ {item.preco}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.nome}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.ratingText}>{item.avaliacao || '5.0'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Catálogo de {tipo}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8B0000" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={produtos}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderProductCard}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, textTransform: 'capitalize' },
  listContainer: { padding: 15 },
  row: { justifyContent: 'space-between', marginBottom: 20 },
  card: { width: '47%' },
  imageContainer: { width: '100%', height: 230, borderRadius: 8, backgroundColor: colors.surface, overflow: 'hidden', marginBottom: 8 },
  capaImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tag: { position: 'absolute', top: 8, left: 8, backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { color: colors.textSecondary, fontSize: 12, marginLeft: 4 },
});