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

const formatImageUrl = (urlDoBanco: string) => {
  if (!urlDoBanco) return null;
  const fileName = urlDoBanco.split('\\').pop()?.split('/').pop(); 
  return `${getBaseUrl()}/files/covers/${fileName}`;
};

const CATEGORIAS = ['Tudo', 'Mangás', 'Novels', 'Livros'];

export default function Home() {
  const [mangas, setMangas] = useState([]);
  const navigation = useNavigation<any>();

  useEffect(() => {
    const carregarCatalogo = async () => {
      try {
        const resposta = await api.get('/mangas');
        setMangas(resposta.data);
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

      <View style={styles.shelfContainer}>
        <Text style={styles.shelfTitle}>Acervo de Mangás</Text>
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={mangas} keyExtractor={(item: any) => item.id.toString()} renderItem={renderProductCard} contentContainerStyle={{ paddingHorizontal: 20 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  categoryHeader: { paddingVertical: 20, paddingLeft: 20 },
  categoryCircle: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, backgroundColor: colors.surface, marginRight: 10, borderWidth: 1, borderColor: colors.border },
  categoryActive: { backgroundColor: '#8B0000', borderColor: '#8B0000' },
  categoryText: { color: colors.textSecondary, fontWeight: 'bold' },
  categoryTextActive: { color: '#FFF' },
  shelfContainer: { marginBottom: 35 },
  shelfTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginLeft: 20, marginBottom: 15, letterSpacing: 1 },
  card: { width: 140, marginRight: 15 },
  imageContainer: { width: 140, height: 210, borderRadius: 8, backgroundColor: colors.surface, overflow: 'hidden', position: 'relative', marginBottom: 8 },
  capaImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tag: { position: 'absolute', top: 8, left: 8, backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { color: colors.textSecondary, fontSize: 12, marginLeft: 4 },
});