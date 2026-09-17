import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { colors } from '../theme/colors';
import { api } from '../service/api';
import { useCart } from '../contexts/CartContext'; // 🎯 Conexão com o Contexto Global

const getBaseUrl = () => {
  if (Platform.OS === 'android' && !Constants.expoConfig?.hostUri) return 'http://10.0.2.2:3000';
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  return `http://${debuggerHost ? debuggerHost.split(':')[0] : 'localhost'}:3000`;
};

export default function Carrinho() {
  // 🎯 Substituímos o state local pelas variáveis e métodos do Contexto Global
  const { cart, updateQuantity, removeFromCart, clearCart, getCartTotal } = useCart();
  const [processando, setProcessando] = useState(false);
  const navigation = useNavigation<any>();

  const finalizarCompra = async () => {
    if (cart.length === 0) return;
    
    setProcessando(true);

    try {
      await api.post('/compras/finalizar', { 
        produtos: cart, 
        total: getCartTotal()
      });

      clearCart(); // 🎯 Limpa o carrinho global após finalizar
      
      Alert.alert(
        'Pagamento Aprovado!',
        'Compra finalizada com sucesso. As obras já estão disponíveis no seu Histórico de Leitura!',
        [{ text: 'Ver Histórico', onPress: () => navigation.navigate('HistoricoCompras') }]
      );
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao processar o pagamento no servidor.');
    } finally {
      setProcessando(false);
    }
  };

  const formatImageUrl = (urlDoBanco: string) => {
    if (!urlDoBanco) return null;
    const fileName = urlDoBanco.split('\\').pop()?.split('/').pop();
    return `${getBaseUrl()}/files/covers/${fileName}`;
  };

  const renderItem = ({ item }: any) => {
    const imagemUri = formatImageUrl(item.capa_url);

    return (
      <View style={styles.cartItem}>
        <View style={styles.imageContainer}>
          {imagemUri ? (
            <Image source={{ uri: imagemUri }} style={styles.capaImage} />
          ) : (
            <Ionicons name="book-outline" size={30} color={colors.border} />
          )}
        </View>
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle} numberOfLines={2}>{item.nome}</Text>
          <Text style={styles.itemPrice}>R$ {parseFloat(item.preco).toFixed(2).replace('.', ',')}</Text>
          
          <View style={styles.quantityControl}>
            <TouchableOpacity onPress={() => updateQuantity(item.id, 'subtrair')} style={styles.qtdBtn}>
              <Ionicons name="remove" size={16} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.qtdText}>{item.quantidade}</Text>
            <TouchableOpacity onPress={() => updateQuantity(item.id, 'somar')} style={styles.qtdBtn}>
              <Ionicons name="add" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.deleteBtn} onPress={() => removeFromCart(item.id)}>
          <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MEU CARRINHO</Text>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={colors.border} />
          <Text style={styles.emptyText}>Seu carrinho está vazio.</Text>
        </View>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>R$ {getCartTotal().replace('.', ',')}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.checkoutButton, processando || cart.length === 0 ? { opacity: 0.7 } : {}]} 
          onPress={finalizarCompra}
          disabled={processando || cart.length === 0}
        >
          {processando ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.checkoutButtonText}>FINALIZAR COMPRA</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, paddingTop: 40, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, letterSpacing: 1 },
  listContainer: { padding: 15, paddingBottom: 100 },
  cartItem: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 8, padding: 10, marginBottom: 15, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  imageContainer: { width: 70, height: 100, backgroundColor: '#111', borderRadius: 6, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  capaImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemDetails: { flex: 1, marginLeft: 15 },
  itemTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: 5 },
  itemPrice: { fontSize: 16, color: colors.primary, fontWeight: 'bold', marginBottom: 10 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border },
  qtdBtn: { padding: 5, paddingHorizontal: 10 },
  qtdText: { color: colors.text, fontWeight: 'bold', marginHorizontal: 10 },
  deleteBtn: { padding: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.textSecondary, marginTop: 15, fontSize: 16 },
  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: colors.surface, padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalLabel: { fontSize: 16, color: colors.textSecondary, fontWeight: 'bold' },
  totalValue: { fontSize: 20, color: colors.text, fontWeight: 'bold' },
  checkoutButton: { backgroundColor: '#8B0000', height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  checkoutButtonText: { color: colors.text, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});