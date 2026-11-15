import { Link } from 'react-router-dom';

// Chips de genero que levam ao catalogo filtrado (?genero=).
export default function GeneroChips({ generos, size = 'md', className = '', label = 'Gêneros' }) {
  if (!generos?.length) return null;
  const tamanho = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <ul aria-label={label} className={`flex flex-wrap gap-2 ${className}`}>
      {generos.map((genero) => (
        <li key={genero}>
          <Link
            to={`/catalogo?genero=${encodeURIComponent(genero)}`}
            className={`inline-flex rounded-full border border-brand-400/25 bg-brand-500/10 font-medium text-brand-300 transition-colors hover:border-brand-400/60 hover:bg-brand-500/20 hover:text-white ${tamanho}`}
          >
            {genero}
          </Link>
        </li>
      ))}
    </ul>
  );
}
