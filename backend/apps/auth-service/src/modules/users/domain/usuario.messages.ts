/** Mensagens de erro do contexto Identidade e Acesso (exibidas ao usuario). */
export const UsuarioMessages = {
  EMAIL_DUPLICADO: 'E-mail já cadastrado.',
  CPF_DUPLICADO: 'CPF já vinculado a outra conta.',
  CPF_INVALIDO: 'CPF inválido.',
  CREDENCIAIS_INVALIDAS: 'Credenciais inválidas.',
  USUARIO_NAO_ENCONTRADO: 'Usuário não encontrado.',
  SENHA_ATUAL_OBRIGATORIA: 'Informe a senha atual para definir uma nova senha.',
  SENHA_ATUAL_INCORRETA: 'Senha atual incorreta.',
  NOVA_SENHA_IGUAL: 'A nova senha deve ser diferente da senha atual.',
  ROLE_PROPRIO: 'Você não pode alterar o seu próprio papel.',
  ULTIMO_ADMIN: 'Não é possível remover o último administrador.',
} as const;
