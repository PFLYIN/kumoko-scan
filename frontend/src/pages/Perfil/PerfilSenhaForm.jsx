import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { PASSWORD_HINT, isStrongPassword } from '../../utils/validation.js';
import FormField from '../../components/ui/FormField.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

const INICIAL = { senhaAtual: '', novaSenha: '', confirmarSenha: '' };

export default function PerfilSenhaForm() {
  const { updateProfile } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(INICIAL);
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const novosErros = {};
    if (!form.senhaAtual) novosErros.senhaAtual = 'Informe sua senha atual.';
    if (!isStrongPassword(form.novaSenha)) novosErros.novaSenha = PASSWORD_HINT;
    else if (form.novaSenha === form.senhaAtual) novosErros.novaSenha = 'A nova senha deve ser diferente da atual.';
    if (form.confirmarSenha !== form.novaSenha) novosErros.confirmarSenha = 'As senhas não coincidem.';
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;

    setEnviando(true);
    try {
      await updateProfile({ senhaAtual: form.senhaAtual, novaSenha: form.novaSenha });
      setForm(INICIAL);
      toast.success('Senha alterada com sucesso.');
    } catch (err) {
      toast.error(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section aria-labelledby="senha-titulo" className="panel p-6">
      <h2 id="senha-titulo" className="mb-5 text-lg font-semibold text-zinc-100">
        Alterar senha
      </h2>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField label="Senha atual" error={erros.senhaAtual}>
          <input
            type="password"
            autoComplete="current-password"
            className="field-input"
            value={form.senhaAtual}
            onChange={set('senhaAtual')}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nova senha" hint={PASSWORD_HINT} error={erros.novaSenha}>
            <input
              type="password"
              autoComplete="new-password"
              className="field-input"
              value={form.novaSenha}
              onChange={set('novaSenha')}
            />
          </FormField>
          <FormField label="Confirmar nova senha" error={erros.confirmarSenha}>
            <input
              type="password"
              autoComplete="new-password"
              className="field-input"
              value={form.confirmarSenha}
              onChange={set('confirmarSenha')}
            />
          </FormField>
        </div>
        <div>
          <button type="submit" className="btn-primary" disabled={enviando}>
            {enviando ? <Spinner className="size-4" /> : <KeyRound className="size-4" aria-hidden="true" />}
            Alterar senha
          </button>
        </div>
      </form>
    </section>
  );
}
