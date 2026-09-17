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
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.nome}</Text>
          <View style={styles.metaRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color={colors.accent} />
              <Text style={styles.ratingText}>{item.avaliacao || '5.0'}</Text>
            </View>
            {item.preco && <Text style={styles.priceText}>R$ {Number(item.preco).toFixed(2).replace('.', ',')}</Text>}
          </View>
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
        <View style={styles.headerCopy}>
          <Text style={styles.headerKicker}>KUMOKO SCAN</Text>
          <Text style={styles.headerTitle}>Catálogo de {tipo}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
          <ActivityIndicator size="large" color={colors.primaryBright} style={{ marginTop: 50 }} />
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 48, backgroundColor: colors.surfaceMuted, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { alignItems: 'center' },
  headerKicker: { color: colors.primaryBright, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 3 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text, textTransform: 'capitalize' },
  listContainer: { padding: 16 },
  row: { justifyContent: 'space-between', marginBottom: 24 },
  card: { width: '47%' },
  imageContainer: { width: '100%', height: 230, borderRadius: 14, backgroundColor: colors.surface, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  capaImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tag: { position: 'absolute', top: 10, left: 10, backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  cardInfo: { padding: 11, paddingTop: 10, backgroundColor: colors.surface, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, borderWidth: 1, borderTopWidth: 0, borderColor: colors.border, minHeight: 78 },
  cardTitle: { color: colors.text, fontSize: 14, lineHeight: 18, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { color: colors.textSecondary, fontSize: 12, marginLeft: 4 },
  priceText: { color: colors.text, fontSize: 12, fontWeight: '800' },
});