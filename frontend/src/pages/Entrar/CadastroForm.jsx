import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { isCpfValid, maskCpf, onlyDigits } from '../../utils/cpf.js';
import { PASSWORD_HINT, isEmailValid, isStrongPassword } from '../../utils/validation.js';
import FormField from '../../components/ui/FormField.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

const INICIAL = { nome: '', email: '', cpf: '', senha: '', confirmarSenha: '' };

function validar(form) {
  const erros = {};
  if (form.nome.trim().length < 3) erros.nome = 'Informe seu nome completo (mínimo 3 caracteres).';
  if (!isEmailValid(form.email)) erros.email = 'Informe um e-mail válido.';
  if (!isCpfValid(form.cpf)) erros.cpf = 'CPF inválido. Confira os dígitos.';
  if (!isStrongPassword(form.senha)) erros.senha = PASSWORD_HINT;
  if (form.confirmarSenha !== form.senha) erros.confirmarSenha = 'As senhas não coincidem.';
  return erros;
}

export default function CadastroForm({ onSucesso }) {
  const { register } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(INICIAL);
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  const set = (campo, transform = (v) => v) => (e) => setForm((f) => ({ ...f, [campo]: transform(e.target.value) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const novosErros = validar(form);
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;

    setEnviando(true);
    try {
      const email = form.email.trim();
      await register({ nome: form.nome.trim(), email, cpf: onlyDigits(form.cpf), senha: form.senha });
      toast.success('Conta criada com sucesso! Agora é só entrar.');
      onSucesso(email);
    } catch (err) {
      toast.error(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <FormField label="Nome completo" error={erros.nome}>
        <input autoComplete="name" className="field-input" value={form.nome} onChange={set('nome')} required />
      </FormField>
      <FormField label="E-mail" error={erros.email}>
        <input type="email" autoComplete="email" className="field-input" value={form.email} onChange={set('email')} required />
      </FormField>
      <FormField label="CPF" error={erros.cpf}>
        <input
          inputMode="numeric"
          placeholder="000.000.000-00"
          className="field-input"
          value={form.cpf}
          onChange={set('cpf', maskCpf)}
          maxLength={14}
          required
        />
      </FormField>
      <FormField label="Senha" hint={PASSWORD_HINT} error={erros.senha}>
        <input
          type="password"
          autoComplete="new-password"
          className="field-input"
          value={form.senha}
          onChange={set('senha')}
          required
        />
      </FormField>
      <FormField label="Confirmar senha" error={erros.confirmarSenha}>
        <input
          type="password"
          autoComplete="new-password"
          className="field-input"
          value={form.confirmarSenha}
          onChange={set('confirmarSenha')}
          required
        />
      </FormField>
      <button type="submit" className="btn-primary mt-2 py-3" disabled={enviando}>
        {enviando ? <Spinner className="size-4" /> : <UserPlus className="size-4" aria-hidden="true" />}
        Criar conta
      </button>
    </form>
  );
}
