import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import NavItem from './NavItem.jsx';
import HeaderSearch from './HeaderSearch.jsx';
import { NAV_LINKS } from './navLinks.js';

const linkClass = (isActive) =>
  `block rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand-500/15 text-brand-300' : 'text-zinc-300 hover:bg-white/5'}`;

export default function MobileNav({ id }) {
  const { isAdmin } = useAuth();

  return (
    <nav id={id} aria-label="Menu móvel" className="border-t border-white/5 bg-ink-850 px-4 pt-3 pb-5 lg:hidden">
      <HeaderSearch className="mb-3 md:hidden" />
      <ul className="flex flex-col gap-1">
        {NAV_LINKS.map((link) => (
          <li key={link.to}>
            <NavItem link={link} className={linkClass} />
          </li>
        ))}
        {isAdmin && (
          <li>
            <NavLink to="/admin" end className={({ isActive }) => linkClass(isActive)}>
              Painel admin
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  );
}
