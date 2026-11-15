import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { isEmailValid } from '../../utils/validation.js';
import FormField from '../../components/ui/FormField.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

// Apos o login, a EntrarPage redireciona (ela observa isAuthenticated).
export default function LoginForm({ emailInicial = '' }) {
  const { login } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ email: emailInicial, senha: '' });
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const novosErros = {};
    if (!isEmailValid(form.email)) novosErros.email = 'Informe um e-mail válido.';
    if (!form.senha) novosErros.senha = 'Informe sua senha.';
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;

    setEnviando(true);
    try {
      const usuario = await login({ email: form.email.trim(), senha: form.senha });
      toast.success(`Bem-vindo(a), ${usuario.nome}!`);
    } catch (err) {
      toast.error(err);
      setForm((f) => ({ ...f, senha: '' }));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <FormField label="E-mail" error={erros.email}>
        <input
          type="email"
          autoComplete="email"
          className="field-input"
          value={form.email}
          onChange={set('email')}
          required
        />
      </FormField>
      <FormField label="Senha" error={erros.senha}>
        <input
          type="password"
          autoComplete="current-password"
          className="field-input"
          value={form.senha}
          onChange={set('senha')}
          required
        />
      </FormField>
      <button type="submit" className="btn-primary mt-2 py-3" disabled={enviando}>
        {enviando ? <Spinner className="size-4" /> : <LogIn className="size-4" aria-hidden="true" />}
        Entrar
      </button>
    </form>
  );
}
