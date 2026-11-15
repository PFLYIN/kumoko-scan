import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ShieldCheck, ShieldOff, Users } from 'lucide-react';
import { adminService } from '../../../services/admin.service.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { useToast } from '../../../hooks/useToast.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';
import { formatData, formatPreco } from '../../../utils/format.js';
import PageHeader from '../../../components/ui/PageHeader.jsx';
import LoadingState from '../../../components/ui/LoadingState.jsx';
import ErrorState from '../../../components/ui/ErrorState.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import Pagination from '../../../components/ui/Pagination.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';

const LIMIT = 20;

export default function UsuariosAdminPage() {
  useDocumentTitle('Usuários');
  const toast = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const busca = (searchParams.get('busca') ?? '').trim();
  const role = searchParams.get('role') ?? '';
  const ordenar = searchParams.get('ordenar') ?? 'recentes';
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const [termo, setTermo] = useState(busca);
  const [alvo, setAlvo] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const { data, loading, error, reload, mutate } = useFetch(
    () => adminService.listarUsuarios({ busca, role, ordenar, page, limit: LIMIT }),
    [busca, role, ordenar, page],
  );

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries({ page: undefined, ...changes }).forEach(([k, v]) => {
      if (v === undefined || v === '' || (k === 'page' && v === 1) || (k === 'ordenar' && v === 'recentes')) next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next);
  };

  const novoRole = alvo?.role === 'admin' ? 'customer' : 'admin';
  const confirmar = async () => {
    setSalvando(true);
    try {
      const atualizado = await adminService.alterarRole(alvo.id, novoRole);
      mutate((d) => ({ ...d, data: d.data.map((u) => (u.id === atualizado.id ? atualizado : u)) }));
      toast.success(novoRole === 'admin' ? `${atualizado.nome} agora é administrador.` : `${atualizado.nome} agora é cliente.`);
      setAlvo(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setSalvando(false);
    }
  };

  const usuarios = data?.data ?? [];

  return (
    <div>
      <PageHeader title="Usuários" subtitle={data?.meta ? `${data.meta.total} usuário(s) encontrado(s)` : 'Clientes e administradores.'} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form
          role="search"
          className="relative w-full max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            updateParams({ busca: termo.trim() });
          }}
        >
          <input
            type="search"
            aria-label="Buscar usuários"
            placeholder="Buscar por nome ou e-mail"
            className="field-input pr-9"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
          />
          <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
        </form>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          Papel
          <select className="field-input w-auto py-1.5" value={role} onChange={(e) => updateParams({ role: e.target.value })}>
            <option value="" className="bg-ink-800">Todos</option>
            <option value="customer" className="bg-ink-800">Clientes</option>
            <option value="admin" className="bg-ink-800">Administradores</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          Ordenar
          <select className="field-input w-auto py-1.5" value={ordenar} onChange={(e) => updateParams({ ordenar: e.target.value })}>
            <option value="recentes" className="bg-ink-800">Cadastro mais recente</option>
            <option value="nome" className="bg-ink-800">Nome (A-Z)</option>
            <option value="maior-gasto" className="bg-ink-800">Maior gasto</option>
          </select>
        </label>
      </div>

      {loading && <LoadingState message="Carregando usuários..." />}
      {!loading && error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && usuarios.length === 0 && (
        <EmptyState icon={Users} title="Nenhum usuário encontrado" description="Ajuste a busca ou os filtros." />
      )}
      {!loading && !error && usuarios.length > 0 && (
        <>
          <div className="panel overflow-hidden">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Usuários</caption>
              <thead className="bg-white/5 text-xs tracking-wide text-zinc-400 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-2.5">Nome</th>
                  <th scope="col" className="px-4 py-2.5">E-mail</th>
                  <th scope="col" className="px-4 py-2.5">Papel</th>
                  <th scope="col" className="px-4 py-2.5">Cadastro</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Total gasto</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usuarios.map((u) => {
                  const euMesmo = u.id === user?.id;
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-2 font-medium text-zinc-100">
                        {u.nome}
                        {euMesmo && <span className="ml-2 text-xs text-zinc-500">(você)</span>}
                      </td>
                      <td className="px-4 py-2 text-zinc-400">{u.email}</td>
                      <td className="px-4 py-2">
                        <span className={`rounded border px-1.5 py-0.5 text-[11px] font-semibold uppercase ${u.role === 'admin' ? 'border-brand-400/50 text-brand-300' : 'border-zinc-600 text-zinc-300'}`}>
                          {u.role === 'admin' ? 'Admin' : 'Cliente'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-zinc-400">{formatData(u.criadoEm)}</td>
                      <td className="px-4 py-2 text-right text-zinc-200 tabular-nums">{formatPreco(u.totalGasto)}</td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-2">
                          <Link to={`/admin/pedidos?usuarioId=${u.id}`} className="rounded-lg px-2 py-1 text-xs text-zinc-300 hover:bg-white/10" aria-label={`Pedidos de ${u.nome}`}>
                            Pedidos
                          </Link>
                          <button
                            type="button"
                            disabled={euMesmo}
                            title={euMesmo ? 'Você não pode alterar o seu próprio papel' : undefined}
                            onClick={() => setAlvo(u)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {u.role === 'admin' ? <ShieldOff className="size-3.5" aria-hidden="true" /> : <ShieldCheck className="size-3.5" aria-hidden="true" />}
                            {u.role === 'admin' ? `Rebaixar ${u.nome}` : `Promover ${u.nome}`}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={data.meta?.page ?? page} totalPages={data.meta?.totalPages ?? 1} onChange={(p) => updateParams({ page: p })} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(alvo)}
        title={novoRole === 'admin' ? 'Promover a administrador?' : 'Remover acesso de administrador?'}
        description={
          alvo
            ? novoRole === 'admin'
              ? `${alvo.nome} (${alvo.email}) terá acesso total ao painel: acervo, pedidos e usuários. Vale a partir do próximo login.`
              : `${alvo.nome} (${alvo.email}) volta a ser cliente e perde o acesso ao painel no próximo login.`
            : ''
        }
        confirmLabel={novoRole === 'admin' ? 'Promover' : 'Rebaixar'}
        danger={novoRole !== 'admin'}
        loading={salvando}
        onConfirm={confirmar}
        onCancel={() => setAlvo(null)}
      />
    </div>
  );
}
