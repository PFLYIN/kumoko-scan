import { useState } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import FormField from '../../components/ui/FormField.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

export default function PerfilDadosForm() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [nome, setNome] = useState(user.nome ?? '');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valor = nome.trim();
    if (valor.length < 3) {
      setErro('O nome deve ter pelo menos 3 caracteres.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await updateProfile({ nome: valor });
      toast.success('Dados atualizados.');
    } catch (err) {
      toast.error(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section aria-labelledby="dados-titulo" className="panel p-6">
      <h2 id="dados-titulo" className="mb-5 text-lg font-semibold text-zinc-100">
        Dados pessoais
      </h2>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField label="E-mail" hint="O e-mail não pode ser alterado.">
          <input type="email" className="field-input opacity-60" value={user.email} disabled readOnly />
        </FormField>
        <FormField label="Nome" error={erro}>
          <input autoComplete="name" className="field-input" value={nome} onChange={(e) => setNome(e.target.value)} />
        </FormField>
        <div>
          <button type="submit" className="btn-primary" disabled={enviando || nome.trim() === user.nome}>
            {enviando ? <Spinner className="size-4" /> : <Save className="size-4" aria-hidden="true" />}
            Salvar alterações
          </button>
        </div>
      </form>
    </section>
  );
}
