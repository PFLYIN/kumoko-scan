// src/screens/Login.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { colors } from '../theme/colors';
import api from '../service/api';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha todos os campos!');
      return;
    }

    try {
      const resposta = await api.post('/login', {
        email: email,
        senha: senha
      });

      if (resposta.status === 200) {
        const usuario = resposta.data.user;
        if (usuario.is_admin) {
          Alert.alert('Bem-vindo, Mestre!', 'Acesso de Administrador liberado.');
          navigation.replace('MainApp'); 
        } else {
          Alert.alert('Bem-vindo!', 'Acesso liberado para a loja.');
          navigation.replace('MainApp');
        }
      }
    } catch (erro) {
      // Puxa a mensagem exata de erro que o seu backend enviou (ex: "Senha incorreta!")
      const mensagemErro = erro.response?.data?.error || 'Erro de conexão com o servidor';
      Alert.alert('Falha no Login', mensagemErro);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Text style={styles.logoText}>DARK<Text style={styles.logoHighlight}>SIDE</Text></Text>
        <Text style={styles.subtitle}>Entre para acessar o acervo sombrio</Text>

        <TextInput
          style={styles.input}
          placeholder="E-mail de acesso"
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Sua senha"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>ENTRAR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 4,
  },
  logoHighlight: {
    color: colors.primary, 
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    fontSize: 14,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  forgotPassword: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: colors.textSecondary,
    fontSize: 14,
    textDecorationLine: 'underline',
  }
});