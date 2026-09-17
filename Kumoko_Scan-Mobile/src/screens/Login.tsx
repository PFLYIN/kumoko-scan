import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { realizarLogin, realizarCadastro } from '../service/auth'; // 🎯 CORREÇÃO: Função importada

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigation = useNavigation<any>();

  // 🎯 CORREÇÃO: Regra segura com espaços removidos preventivamente
  const isAdmin = email.trim().toLowerCase() === 'admin@dark.com';

  useEffect(() => {
    const verificarSessao = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        navigation.navigate('MainApp');
      }
    };
    verificarSessao();
  }, [navigation]);

  const handleAuth = async () => {
    if (isLogin) {
      if (!email.trim() || !senha.trim()) {
        Alert.alert('Atenção', 'Preencha email e senha!');
        return;
      }

      setLoading(true);
      try {
        // 🎯 CORREÇÃO: Envio de e-mail limpo
        const resposta = await realizarLogin(email.trim().toLowerCase(), senha);
        await SecureStore.setItemAsync('token', resposta.token);
        await SecureStore.setItemAsync('usuario', JSON.stringify(resposta.user));

        if (resposta.user.is_admin) {
          Alert.alert('Bem-vindo, Mestre!', 'Acesso liberado ao Painel das Sombras.');
        } else {
          Alert.alert('Bem-vindo!', 'Acesso liberado para o acervo.');
        }
        
        navigation.navigate('MainApp');
      } catch (erro: any) {
        Alert.alert('Falha no Login', erro.message);
      } finally {
        setLoading(false);
      }
    } else {
      if (!nome.trim() || !cpf.trim() || !email.trim() || !senha.trim()) {
        Alert.alert('Atenção', 'Preencha todos os campos para se cadastrar!');
        return;
      }
      
      setLoading(true);
      try {
        // 🎯 CORREÇÃO AQUI: cpf.replace para remover pontos e traços antes de enviar
        await realizarCadastro(nome, cpf.replace(/[^0-9]/g, ''), email.trim().toLowerCase(), senha);
        Alert.alert('Sucesso!', 'Cadastro realizado. Faça o login agora.');
        setIsLogin(true);
      } catch (erro: any) {
        Alert.alert('Falha no Cadastro', erro.message || 'Erro de comunicação com o servidor.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          <Text style={styles.logoText}>KUMOKO</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Entre para acessar o acervo sombrio' : 'Junte-se às sombras'}
          </Text>

          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Ionicons 
                name={isAdmin ? "star" : "person"} // 🎯 CORREÇÃO: Ícone válido
                size={50} 
                color={isAdmin ? "#FFD700" : colors.textSecondary} 
              />
            </View>
          </View>

          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Seu Nome"
                placeholderTextColor={colors.textSecondary}
                value={nome}
                onChangeText={setNome}
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Seu CPF"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={cpf}
                onChangeText={setCpf}
                editable={!loading}
              />
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="E-mail de acesso"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Sua senha"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
            editable={!loading}
          />

          <TouchableOpacity 
            style={[styles.button, loading && { opacity: 0.7 }]} 
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
               <ActivityIndicator color={colors.text} />
            ) : (
               <Text style={styles.buttonText}>{isLogin ? 'ENTRAR' : 'CADASTRAR'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toggleButton} 
            onPress={() => setIsLogin(!isLogin)}
            disabled={loading}
          >
            <Text style={styles.toggleButtonText}>
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça Login'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { flexGrow: 1, justifyContent: 'center' },
  formContainer: { paddingHorizontal: 24 },
  logoText: { fontSize: 36, fontWeight: '800', color: colors.text, textAlign: 'center', letterSpacing: 4, marginTop: 40 },
  logoHighlight: { color: colors.primary },
  subtitle: { color: colors.textSecondary, textAlign: 'center', marginBottom: 26, fontSize: 14 },
  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  avatarCircle: { width: 108, height: 108, borderRadius: 54, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.primary },
  input: { backgroundColor: colors.surface, color: colors.text, height: 54, borderRadius: 14, paddingHorizontal: 17, marginBottom: 13, borderWidth: 1, borderColor: colors.border },
  button: { backgroundColor: colors.primaryBright, height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  toggleButton: { marginTop: 20, alignItems: 'center', marginBottom: 40 },
  toggleButtonText: { color: colors.textSecondary, fontSize: 14, textDecorationLine: 'underline' }
});