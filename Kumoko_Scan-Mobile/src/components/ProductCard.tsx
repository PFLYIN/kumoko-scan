// src/components/ProductCard.js
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

export function ProductCard({ title, type, price, imageUrl }) {
  return (
    <View style={styles.card}>
      
      {/* Container da Imagem flutuando */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        
        {/* A Tag Amarela idêntica ao print da Darkside */}
        <View style={styles.tag}>
          <Text style={styles.tagText}>20% OFF</Text>
        </View>
      </View>
      
      {/* Textos sem borda, misturados com o fundo preto */}
      <View style={styles.infoContainer}>
        <Text style={styles.type}>CASHBACK</Text> 
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        
        {/* Estrelinhas de avaliação como nas referências */}
        <Text style={styles.stars}>
          ★★★★★ <Text style={styles.reviewCount}>(38)</Text>
        </Text>
        
        <Text style={styles.price}>R$ {price}</Text>
        
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>COMPRAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background, // Agora o fundo é o mesmo da tela, removendo o efeito "caixa"
    width: 160,
    margin: 10,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 4, // Borda bem levinha só na imagem
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 240, // Altura ajustada para a proporção real de livros (2:3)
    resizeMode: 'cover',
  },
  tag: {
    position: 'absolute',
    top: 10,
    right: 0,
    backgroundColor: '#F4D03F', // Aquele amarelo chamativo das promoções
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoContainer: {
    paddingTop: 12, // Dá um respiro entre a imagem e o título
  },
  type: {
    fontSize: 10,
    color: '#1ABC9C', // Aquele tom verde água que eles usam na tag "CASHBACK"
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
    lineHeight: 18,
  },
  stars: {
    color: '#F4D03F', // Estrelas amarelas
    fontSize: 14,
    marginBottom: 8,
  },
  reviewCount: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text, // Preço em destaque claro
    marginBottom: 10,
  },
  button: {
    backgroundColor: colors.primary, // Nosso Vermelho Carmesim
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 12,
  }
});