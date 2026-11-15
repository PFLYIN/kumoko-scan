import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// Trilha de navegacao: [{ label, to? }]; o ultimo item e a pagina atual.
export default function Breadcrumb({ itens }) {
  return (
    <nav aria-label="Trilha de navegação" className="mb-6 text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-zinc-400">
        {itens.map((item, i) => {
          const ultimo = i === itens.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {ultimo || !item.to ? (
                <span aria-current={ultimo ? 'page' : undefined} className="max-w-[40ch] truncate text-zinc-300">
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="hover:text-brand-300">
                  {item.label}
                </Link>
              )}
              {!ultimo && <ChevronRight className="size-3.5 shrink-0 text-zinc-600" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
