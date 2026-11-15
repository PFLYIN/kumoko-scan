import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChevronRight, LayoutDashboard, LibraryBig, Receipt, Users } from 'lucide-react';

const ADMIN_NAV = [
  { to: '/admin', label: 'Painel', icon: LayoutDashboard, end: true },
  { to: '/admin/acervo', label: 'Acervo', icon: LibraryBig },
  { to: '/admin/pedidos', label: 'Pedidos', icon: Receipt },
  { to: '/admin/usuarios', label: 'Usuários', icon: Users },
];

// Trilha derivada da URL (ex.: Admin > Acervo > Editar obra).
function trilha(pathname) {
  const itens = [{ to: '/admin', label: 'Admin' }];
  if (pathname === '/admin' || pathname === '/admin/') return [...itens, { label: 'Painel' }];
  if (pathname.startsWith('/admin/pedidos')) return [...itens, { label: 'Pedidos' }];
  if (pathname.startsWith('/admin/usuarios')) return [...itens, { label: 'Usuários' }];
  itens.push({ to: '/admin/acervo', label: 'Acervo' });
  if (pathname === '/admin/obras/nova') itens.push({ label: 'Nova obra' });
  else if (pathname.endsWith('/editar')) itens.push({ label: 'Editar obra' });
  else if (pathname.endsWith('/capitulos')) itens.push({ label: 'Capítulos' });
  else itens[itens.length - 1] = { label: 'Acervo' };
  return itens;
}

// Layout da area administrativa: sidebar fixa + breadcrumb, otimizado para 1366-1920px.
export default function AdminLayout() {
  const { pathname } = useLocation();
  const itens = trilha(pathname);

  return (
    <div className="mx-auto flex w-full max-w-[110rem] gap-6 px-4 py-6 sm:px-6 lg:gap-8">
      <aside className="hidden w-52 shrink-0 lg:block">
        <nav aria-label="Administração" className="sticky top-20 flex flex-col gap-1">
          <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">Administração</p>
          {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600/20 text-brand-300 ring-1 ring-brand-500/30'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                }`
              }
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Navegacao compacta para telas sem sidebar */}
        <nav aria-label="Administração (compacta)" className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
          {ADMIN_NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `shrink-0 rounded-full px-3 py-1.5 text-sm ${isActive ? 'bg-brand-600 text-white' : 'bg-white/5 text-zinc-300'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <nav aria-label="Trilha de navegação" className="mb-4">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-zinc-500">
            {itens.map((item, i) => (
              <li key={`${item.label}-${i}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3" aria-hidden="true" />}
                {item.to && i < itens.length - 1 ? (
                  <Link to={item.to} className="hover:text-brand-300">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={i === itens.length - 1 ? 'page' : undefined} className="text-zinc-300">
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <Outlet />
      </div>
    </div>
  );
}
