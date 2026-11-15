import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ShoppingCart, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useCart } from '../../hooks/useCart.js';
import Logo from './Logo.jsx';
import HeaderSearch from './HeaderSearch.jsx';
import UserMenu from './UserMenu.jsx';
import MobileNav from './MobileNav.jsx';
import NavItem from './NavItem.jsx';
import { NAV_LINKS } from './navLinks.js';

const linkClass = (isActive) =>
  `text-[11px] font-bold tracking-[0.15em] uppercase transition-colors ${
    isActive ? 'text-brand-300' : 'text-zinc-400 hover:text-brand-300'
  }`;

export default function Header() {
  const { isAuthenticated, isLoading } = useAuth();
  const { totalItens } = useCart();
  const location = useLocation();
  // Guarda em qual rota o menu foi aberto: ao navegar, ele fecha sozinho.
  const [mobileOpenAt, setMobileOpenAt] = useState(null);
  const mobileOpen = mobileOpenAt === location.key;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-500/10 bg-ink-850/95 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-pointer rounded-lg p-2 text-zinc-300 hover:bg-white/10 lg:hidden"
            onClick={() => setMobileOpenAt(mobileOpen ? null : location.key)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
            aria-controls="menu-mobile"
          >
            {mobileOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
          <Logo />
        </div>

        <nav aria-label="Principal" className="hidden flex-1 justify-center lg:flex">
          <ul className="flex gap-7">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavItem link={link} className={linkClass} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <HeaderSearch className="hidden md:block" />

          <Link
            to="/carrinho"
            className="relative rounded-lg p-2 text-zinc-300 hover:bg-white/10 hover:text-white"
            aria-label={`Carrinho com ${totalItens} ${totalItens === 1 ? 'item' : 'itens'}`}
          >
            <ShoppingCart className="size-5" aria-hidden="true" />
            {totalItens > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white"
                aria-hidden="true"
              >
                {totalItens > 99 ? '99+' : totalItens}
              </span>
            )}
          </Link>

          {isLoading ? (
            <div className="size-9 animate-pulse rounded-full bg-white/10" aria-hidden="true" />
          ) : isAuthenticated ? (
            <UserMenu />
          ) : (
            <Link to="/entrar" className="btn-primary px-4 py-2 text-xs tracking-widest uppercase">
              Entrar
            </Link>
          )}
        </div>
      </div>

      {mobileOpen && <MobileNav id="menu-mobile" />}
    </header>
  );
}
