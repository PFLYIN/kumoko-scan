import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { api } from '../service/api';

export default function AddProduto() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  
  const tipoProduto = route.params?.tipo || 'manga'; 
  const tituloTela = `Adicionar ${tipoProduto.charAt(0).toUpperCase() + tipoProduto.slice(1)}`;

  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [imagemUri, setImagemUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selecionarImagem = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria para enviar a capa.');
      return;
    }

    let resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // 🎯 CORREÇÃO DO AVISO DO EXPO
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.8,
    });

    if (!resultado.canceled) {
      setImagemUri(resultado.assets[0].uri);
    }
  };

  const handleSalvar = async () => {
    if (!nome.trim() || !preco.trim()) {
      Alert.alert('Atenção', 'Nome e Preço são obrigatórios!');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('nome', nome);
      formData.append('preco', preco.replace(',', '.'));
      formData.append('descricao', descricao);
      formData.append('avaliacao', '5.0');

      if (imagemUri) {
        const nomeArquivo = imagemUri.split('/').pop() || 'capa.jpg';
        const tipoArquivo = nomeArquivo.endsWith('.png') ? 'image/png' : 'image/jpeg';
        
        formData.append('capa', {
          uri: imagemUri,
          name: nomeArquivo,
          type: tipoArquivo,
        } as any);
      }

      await api.post(`/${tipoProduto}s`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Alert.alert('Sucesso!', `${tituloTela} cadastrado no acervo.`);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao salvar produto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tituloTela}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        
        <TouchableOpacity style={styles.imageUploadBtn} onPress={selecionarImagem}>
          {imagemUri ? (
            <Image source={{ uri: imagemUri }} style={styles.capaPreview} />
          ) : (
            <>
              <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
              <Text style={styles.imageUploadText}>Tocar para Selecionar Capa</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Título da Obra</Text>
        <TextInput style={styles.input} placeholderTextColor={colors.textSecondary} value={nome} onChangeText={setNome} />

        <Text style={styles.label}>Preço (R$)</Text>
        <TextInput style={styles.input} placeholderTextColor={colors.textSecondary} keyboardType="numeric" value={preco} onChangeText={setPreco} />

        <Text style={styles.label}>Sinopse / Descrição</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholderTextColor={colors.textSecondary} multiline numberOfLines={4} value={descricao} onChangeText={setDescricao} textAlignVertical="top" />

        <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleSalvar} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>SALVAR PRODUTO</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, textTransform: 'uppercase' },
  formContainer: { padding: 20 },
  imageUploadBtn: { height: 210, width: 140, alignSelf: 'center', backgroundColor: '#1A1A1A', borderRadius: 8, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 25, overflow: 'hidden' },
  imageUploadText: { color: colors.textSecondary, marginTop: 10, fontSize: 12, textAlign: 'center' },
  capaPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  label: { color: colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginLeft: 2 },
  input: { backgroundColor: colors.surface, color: colors.text, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  textArea: { height: 100 },
  button: { backgroundColor: '#8B0000', height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});