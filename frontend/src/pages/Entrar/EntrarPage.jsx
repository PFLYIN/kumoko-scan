import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { safeRedirect } from '../../utils/redirect.js';
import LoadingState from '../../components/ui/LoadingState.jsx';
import LoginForm from './LoginForm.jsx';
import CadastroForm from './CadastroForm.jsx';

const ABAS = [
  { id: 'login', label: 'Entrar' },
  { id: 'cadastro', label: 'Cadastrar' },
];

export default function EntrarPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const aba = searchParams.get('modo') === 'cadastro' ? 'cadastro' : 'login';
  const redirect = safeRedirect(searchParams.get('redirect'), '/');
  // E-mail recem-cadastrado e levado para a aba de login.
  const [emailCadastrado, setEmailCadastrado] = useState('');
  useDocumentTitle(aba === 'login' ? 'Entrar' : 'Criar conta');

  const trocarAba = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id === 'cadastro') next.set('modo', 'cadastro');
    else next.delete('modo');
    setSearchParams(next, { replace: true });
  };

  if (isLoading) return <LoadingState />;
  if (isAuthenticated) return <Navigate to={redirect} replace />;

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:items-center">
      <section className="hidden md:block">
        <p className="text-3xl font-black tracking-tighter text-zinc-100">
          KUMOKO<span className="text-accent-400">SCAN</span>
        </p>
        <h1 className="mt-6 text-2xl font-light text-zinc-200">
          {aba === 'login' ? 'Bem-vindo de volta.' : 'Crie sua conta e comece a colecionar.'}
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Acesse seu histórico de pedidos, finalize compras e acompanhe os capítulos das suas obras favoritas.
        </p>
      </section>

      <section className="panel p-6 sm:p-8">
        <div role="tablist" aria-label="Acesso" className="mb-6 grid grid-cols-2 rounded-xl bg-white/5 p-1">
          {ABAS.map((a) => (
            <button
              key={a.id}
              id={`aba-${a.id}`}
              type="button"
              role="tab"
              aria-selected={aba === a.id}
              aria-controls={`painel-${a.id}`}
              onClick={() => trocarAba(a.id)}
              className={`cursor-pointer rounded-lg py-2 text-sm font-semibold transition-colors ${
                aba === a.id ? 'bg-brand-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
          {aba === 'login' ? (
            <LoginForm key={emailCadastrado} emailInicial={emailCadastrado} />
          ) : (
            <CadastroForm
              onSucesso={(email) => {
                setEmailCadastrado(email);
                trocarAba('login');
              }}
            />
          )}
        </div>
      </section>
    </div>
  );
}
