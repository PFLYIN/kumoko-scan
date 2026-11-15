import { Link, useNavigate } from 'react-router-dom';
import { LibraryBig, LogOut, Receipt, ShieldCheck, UserRound, Wallet } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { formatData, formatPreco } from '../../utils/format.js';
import PerfilDadosForm from './PerfilDadosForm.jsx';
import PerfilSenhaForm from './PerfilSenhaForm.jsx';

export default function PerfilPage() {
  useDocumentTitle('Meu perfil');
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const sair = async () => {
    // Sai da rota protegida antes de limpar a sessao (evita redirecionar para /entrar).
    navigate('/');
    try {
      await logout();
      toast.info('Você saiu da sua conta.');
    } catch (err) {
      toast.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <aside className="panel flex h-fit flex-col items-center p-6 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-brand-600 text-3xl font-bold text-white shadow-lg shadow-brand-500/30">
            {user.nome?.charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-4 text-xl font-semibold text-zinc-50">{user.nome}</h1>
          <p className="text-sm text-zinc-400">{user.email}</p>
          <span
            className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
              isAdmin ? 'bg-amber-500/15 text-amber-300' : 'bg-brand-500/15 text-brand-300'
            }`}
          >
            {isAdmin ? <ShieldCheck className="size-3.5" aria-hidden="true" /> : <UserRound className="size-3.5" aria-hidden="true" />}
            {isAdmin ? 'Administrador' : 'Leitor / cliente'}
          </span>

          <dl className="mt-6 w-full space-y-3 border-t border-white/5 pt-4 text-left text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-400">
                <Wallet className="size-4" aria-hidden="true" /> Total investido
              </dt>
              <dd className="font-semibold text-zinc-100">{formatPreco(user.totalGasto)}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-zinc-400">Membro desde</dt>
              <dd className="text-zinc-200">{formatData(user.criadoEm)}</dd>
            </div>
          </dl>

          <nav aria-label="Atalhos da conta" className="mt-6 flex w-full flex-col gap-2">
            <Link to="/pedidos" className="btn-secondary w-full">
              <Receipt className="size-4" aria-hidden="true" /> Meus pedidos
            </Link>
            {isAdmin && (
              <Link to="/admin/acervo" className="btn-secondary w-full">
                <LibraryBig className="size-4" aria-hidden="true" /> Gerenciar acervo
              </Link>
            )}
            <button type="button" className="btn-danger w-full" onClick={sair}>
              <LogOut className="size-4" aria-hidden="true" /> Sair da conta
            </button>
          </nav>
        </aside>

        <div className="flex flex-col gap-6">
          <PerfilDadosForm />
          <PerfilSenhaForm />
        </div>
      </div>
    </div>
  );
}
