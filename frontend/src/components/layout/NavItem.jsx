import { Link, useLocation } from 'react-router-dom';

// O NavLink ignora a query string; aqui "/catalogo?tipo=manga" so fica ativo com o mesmo tipo.
function isLinkActive(link, location) {
  const [path, query = ''] = link.to.split('?');
  if (link.end && path === '/') return location.pathname === '/';
  if (location.pathname !== path) return false;
  const tipoLink = new URLSearchParams(query).get('tipo') ?? '';
  const tipoAtual = new URLSearchParams(location.search).get('tipo') ?? '';
  return tipoLink === tipoAtual;
}

export default function NavItem({ link, className }) {
  const location = useLocation();
  const active = isLinkActive(link, location);

  return (
    <Link to={link.to} className={className(active)} aria-current={active ? 'page' : undefined}>
      {link.label}
    </Link>
  );
}
