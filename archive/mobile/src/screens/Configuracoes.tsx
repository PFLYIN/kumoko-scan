import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function Configuracoes() {
  const navigation = useNavigation();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleSalvar = () => {
    Alert.alert('Sucesso', 'Dados atualizados! (Conexão com banco em breve)');
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nome</Text>
        <TextInput style={styles.input} placeholderTextColor={colors.textSecondary} value={nome} onChangeText={setNome} />

        <Text style={styles.label}>E-mail</Text>
        <TextInput style={styles.input} placeholderTextColor={colors.textSecondary} keyboardType="email-address" value={email} onChangeText={setEmail} />

        <Text style={styles.label}>Nova Senha</Text>
        <TextInput style={styles.input} placeholderTextColor={colors.textSecondary} secureTextEntry value={senha} onChangeText={setSenha} />

        <TouchableOpacity style={styles.button} onPress={handleSalvar}>
          <Text style={styles.buttonText}>SALVAR ALTERAÇÕES</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, textTransform: 'uppercase' },
  form: { padding: 20, marginTop: 10 },
  label: { color: colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginLeft: 2 },
  input: { backgroundColor: colors.surface, color: colors.text, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  button: { backgroundColor: '#8B0000', height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});