import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { api } from '../service/api';

const getBaseUrl = () => {
  if (Platform.OS === 'android' && !Constants.expoConfig?.hostUri) return 'http://10.0.2.2:3000';
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
  return `http://${localhost}:3000`;
};

const formatImageUrl = (urlDoBanco?: string) => {
  if (!urlDoBanco) return null;
  const fileName = urlDoBanco.split('\\').pop()?.split('/').pop(); 
  return `${getBaseUrl()}/files/covers/${fileName}`;
};

const CATEGORIAS = ['Tudo', 'Mangás', 'Novels', 'Livros'];
const SECOES = [
  { chave: 'mangas', titulo: 'Acervo de Mangás', endpoint: 'mangas' },
  { chave: 'novels', titulo: 'Novels para descobrir', endpoint: 'novels' },
  { chave: 'livros', titulo: 'Livros em destaque', endpoint: 'livros' },
];

type Produto = {
  id: number;
  nome: string;
  capa_url?: string;
  preco?: string | number;
  avaliacao?: string | number;
};

export default function Home() {
  const [catalogos, setCatalogos] = useState<Record<string, Produto[]>>({});
  const navigation = useNavigation<any>();

  useEffect(() => {
    const carregarCatalogo = async () => {
      try {
        const respostas = await Promise.all(SECOES.map(async ({ endpoint }) => {
          try {
            const resposta = await api.get(`/${endpoint}`);
            return [endpoint, resposta.data] as const;
          } catch (error) {
            console.error(`Erro ao buscar ${endpoint}`, error);
            return [endpoint, []] as const;
          }
        }));
        setCatalogos(Object.fromEntries(respostas));
      } catch (error) {
        console.error("Erro ao buscar mangas", error);
      }
    };
    carregarCatalogo();
  }, []);

  const handleNavegarCatalogo = (categoria: string) => {
    if (categoria === 'Tudo') return; 
    const tipoEndpoint = categoria.toLowerCase().replace('á', 'a');
    navigation.navigate('Catalogo', { tipo: tipoEndpoint });
  };

  const renderProductCard = ({ item }: { item: Produto }) => {
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
          {item.preco !== undefined && item.preco !== null && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>R$ {Number(item.preco).toFixed(2).replace('.', ',')}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.nome}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.ratingText}>{item.avaliacao || '5.0'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>KUMOKO SCAN</Text>
          <Text style={styles.heroTitle}>Histórias que deixam marcas.</Text>
          <Text style={styles.heroSubtitle}>Explore o lado mais intenso do nosso acervo.</Text>
        </View>
        <View style={styles.heroIcon}>
          <Ionicons name="sparkles-outline" size={24} color={colors.accent} />
        </View>
      </View>

      <View style={styles.categoryHeader}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIAS.map((cat, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.categoryCircle, index === 0 && styles.categoryActive]}
              onPress={() => handleNavegarCatalogo(cat)}
            >
              <Text style={[styles.categoryText, index === 0 && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {SECOES.map((secao) => (
        <View style={styles.shelfContainer} key={secao.chave}>
          <View style={styles.shelfHeader}>
            <Text style={styles.shelfTitle}>{secao.titulo}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Catalogo', { tipo: secao.endpoint })}>
              <Text style={styles.seeAll}>Ver tudo</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={catalogos[secao.endpoint] || []}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProductCard}
            contentContainerStyle={styles.shelfList}
            ListEmptyComponent={<Text style={styles.emptyShelf}>Nenhuma obra disponível ainda.</Text>}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { margin: 20, marginTop: 24, padding: 20, minHeight: 150, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', overflow: 'hidden' },
  heroCopy: { flex: 1, paddingRight: 12 },
  eyebrow: { color: colors.primaryBright, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  heroTitle: { color: colors.text, fontSize: 26, lineHeight: 30, fontWeight: '800' },
  heroSubtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 10 },
  heroIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  categoryHeader: { paddingBottom: 24, paddingLeft: 20 },
  categoryCircle: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 14, backgroundColor: colors.surfaceMuted, marginRight: 10, borderWidth: 1, borderColor: colors.border },
  categoryActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { color: colors.textSecondary, fontWeight: 'bold' },
  categoryTextActive: { color: '#FFF' },
  shelfContainer: { marginBottom: 35 },
  shelfHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 15 },
  shelfTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  seeAll: { color: colors.primaryBright, fontSize: 12, fontWeight: '800' },
  shelfList: { paddingHorizontal: 20 },
  emptyShelf: { color: colors.textSecondary, fontSize: 13, paddingVertical: 20 },
  card: { width: 148, marginRight: 15 },
  imageContainer: { width: 148, height: 222, borderRadius: 14, backgroundColor: colors.surface, overflow: 'hidden', position: 'relative', marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  capaImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tag: { position: 'absolute', top: 10, left: 10, backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { color: colors.textSecondary, fontSize: 12, marginLeft: 4 },
});