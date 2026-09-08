// src/screens/Home.js
import React from 'react';
import { View, StyleSheet, Text, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { ProductCard } from '../components/ProductCard';
import { colors } from '../theme/colors';

const CATEGORIAS = [
  { id: 'c1', title: 'Mais Vendidos', color: '#8B0000' },
  { id: 'c2', title: 'Pré-Venda', color: '#1C2833' },
  { id: 'c3', title: 'Lançamentos', color: '#0B5345' },
  { id: 'c4', title: 'Mangás', color: '#7B241C' },
];

// Separamos os dados: Prateleira de Livros
const MOCK_LIVROS = [
  {
    id: 'l1',
    title: 'A Esposa do Meu Marido',
    type: 'CASHBACK',
    price: '79,90',
    imageUrl: 'https://i.pinimg.com/736x/87/b0/d3/87b0d35a51c4a96c905b63a9d94df7ee.jpg',
  },
  {
    id: 'l2',
    title: 'Você Não Deveria Estar Aqui',
    type: 'BRINDE',
    price: '89,90',
    imageUrl: 'https://i.pinimg.com/736x/eb/64/35/eb6435c249a2a75871f34934fb5b93d7.jpg', // Imagem de exemplo
  },
];

// Separamos os dados: Prateleira de Mangás
const MOCK_MANGAS = [
  {
    id: 'm1',
    title: 'Kumo Desu ga, Nani ka? - Vol 1',
    type: 'NOVO',
    price: '34,90',
    imageUrl: 'https://i.pinimg.com/736x/13/a3/98/13a3983efb1c7b8971fce8108c3534b8.jpg',
  },
  {
    id: 'm2',
    title: 'Zenmetsu End o Shinimono-gurui de Kaihi Shita. Festa ga Yanda.',
    type: 'PRÉ-VENDA',
    price: '29,90',
    imageUrl: 'https://i.pinimg.com/736x/91/97/34/91973413867623a6c4c015b67e8877bc.jpg', // Imagem de exemplo
  },
];

export default function Home() {
  return (
    // Trocamos a View principal por ScrollView para podermos rolar a tela inteira para baixo
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* 1. Carrossel de Categorias no Topo */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Nossas Coleções</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
          {CATEGORIAS.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.categoryItem}>
              <View style={[styles.circle, { backgroundColor: cat.color }]} />
              <Text style={styles.categoryText}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 2. Prateleira (Carrossel) apenas de Livros */}
      <View style={styles.shelf}>
        <Text style={styles.shelfTitle}>Lançamentos em Livros</Text>
        <FlatList
          data={MOCK_LIVROS}
          keyExtractor={(item) => item.id}
          horizontal // Isso faz a lista rolar para o lado!
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ProductCard 
              title={item.title} 
              type={item.type}
              price={item.price} 
              imageUrl={item.imageUrl} 
            />
          )}
        />
      </View>

      {/* 3. Prateleira (Carrossel) apenas de Mangás */}
      <View style={styles.shelf}>
        <Text style={styles.shelfTitle}>Novos Mangás</Text>
        <FlatList
          data={MOCK_MANGAS}
          keyExtractor={(item) => item.id}
          horizontal // Isso faz a lista rolar para o lado!
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ProductCard 
              title={item.title} 
              type={item.type}
              price={item.price} 
              imageUrl={item.imageUrl} 
            />
          )}
        />
      </View>
      
      {/* Um espaço extra no final para a barra de navegação não cobrir o último item */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 15,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    marginBottom: 15,
  },
  carousel: {
    paddingLeft: 15,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  circle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 8,
  },
  categoryText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  shelf: {
    marginTop: 20,
  },
  shelfTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    marginBottom: 5, // Aproxima o título dos cards
  },
  list: {
    paddingLeft: 5,
    paddingRight: 15,
  }
});