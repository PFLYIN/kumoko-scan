import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { colors } from '../theme/colors';

const getBaseUrl = () => {
  if (Platform.OS === 'android' && !Constants.expoConfig?.hostUri) return 'http://10.0.2.2:3000';
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  return `http://${debuggerHost ? debuggerHost.split(':')[0] : 'localhost'}:3000`;
};

export default function DetalhesProduto() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { produto } = route.params; // Recebe o item clicado

  const formatImageUrl = (urlDoBanco: string) => {
    if (!urlDoBanco) return null;
    const fileName = urlDoBanco.split('\\').pop()?.split('/').pop();
    return `${getBaseUrl()}/files/covers/${fileName}`;
  };

  const imagemUri = formatImageUrl(produto.capa_url);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="heart-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Destaque da Capa */}
        <View style={styles.imageWrapper}>
          {imagemUri ? (
            <Image source={{ uri: imagemUri }} style={styles.capaImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="book-outline" size={80} color={colors.border} />
            </View>
          )}
          {produto.tag && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{produto.tag}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{produto.nome}</Text>
          
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons 
                key={star} 
                name={star <= Math.floor(produto.avaliacao || 5) ? "star" : "star-outline"} 
                size={16} 
                color="#FFD700" 
              />
            ))}
            <Text style={styles.ratingText}>
              ({produto.avaliacao || '5.0'})
            </Text>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>R$</Text>
            <Text style={styles.priceValue}>{produto.preco}</Text>
          </View>

          <Text style={styles.cashback}>GANHE ATÉ R$ 4,00 DE CASHBACK</Text>

          <Text style={styles.descriptionTitle}>Sinopse</Text>
          <Text style={styles.descriptionText}>
            {produto.descricao || 'Nenhuma sinopse disponível para esta obra no momento.'}
          </Text>
        </View>
      </ScrollView>

      {/* Botão de Compra Fixo no Rodapé */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.buyButton}
          onPress={() => alert('Adicionado ao Carrinho!')}
        >
          <Text style={styles.buyButtonText}>COMPRAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 40, backgroundColor: colors.background },
  backButton: { padding: 5 },
  imageWrapper: { width: '100%', height: 350, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  capaImage: { width: '60%', height: '90%', resizeMode: 'contain' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tag: { position: 'absolute', top: 20, left: 20, backgroundColor: '#FFD700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  tagText: { color: '#000', fontSize: 12, fontWeight: 'bold' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  ratingText: { color: colors.textSecondary, marginLeft: 8, fontSize: 14 },
  priceContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 },
  priceLabel: { fontSize: 16, color: colors.text, marginTop: 4, marginRight: 4, fontWeight: 'bold' },
  priceValue: { fontSize: 32, fontWeight: 'bold', color: colors.text },
  cashback: { color: '#4CAF50', fontSize: 12, fontWeight: 'bold', marginBottom: 30 },
  descriptionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
  descriptionText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  footer: { padding: 20, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  buyButton: { backgroundColor: '#8B0000', height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  buyButtonText: { color: colors.text, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});