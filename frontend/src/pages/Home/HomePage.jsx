import { Link } from 'react-router-dom';
import { BookMarked, BookOpenText, Sparkles } from 'lucide-react';
import ObraShelf from '../../components/obras/ObraShelf.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import heroImage from '../../assets/kumoko_hero.jpg';

const CATEGORIAS = [
  { tipo: 'manga', titulo: 'Mangás', descricao: 'Ação, romance, isekai e muito mais.', icon: Sparkles },
  { tipo: 'novel', titulo: 'Light novels', descricao: 'As histórias que deram origem aos animes.', icon: BookOpenText },
  { tipo: 'livro', titulo: 'Livros', descricao: 'Clássicos e lançamentos para colecionar.', icon: BookMarked },
];

export default function HomePage() {
  useDocumentTitle(null);

  return (
    <>
      <section
        className="relative flex min-h-[55vh] flex-col items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-ink-850/85 via-ink-900/60 to-ink-900" aria-hidden="true" />
        <div className="absolute inset-0 backdrop-blur-[2px]" aria-hidden="true" />

        <div className="relative z-10 max-w-3xl px-4 py-20 text-center">
          <span className="mb-6 block text-xs font-light tracking-[0.4em] text-brand-300 uppercase">Feito de fã para fã</span>
          <h1 className="mb-8 text-4xl leading-snug font-light tracking-wide text-white/90 md:text-6xl">
            A magia de cada <br />
            <span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text font-semibold text-transparent">
              novo capítulo.
            </span>
          </h1>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/catalogo"
              className="rounded-full border border-brand-300/30 bg-brand-500/15 px-8 py-3 text-xs font-medium tracking-widest text-brand-300 backdrop-blur-sm transition-colors hover:bg-brand-500/25 hover:text-white"
            >
              EXPLORAR OBRAS
            </Link>
            <Link
              to="/catalogo?ordenar=mais-vendidos"
              className="rounded-full border border-white/10 px-8 py-3 text-xs font-medium tracking-widest text-zinc-300 transition-colors hover:bg-white/10"
            >
              MAIS VENDIDOS
            </Link>
          </div>
        </div>
      </section>

      <section aria-label="Categorias" className="mx-auto max-w-7xl 2xl:max-w-[96rem] px-4 pt-12 sm:px-6">
        <ul className="grid gap-4 sm:grid-cols-3">
          {CATEGORIAS.map(({ tipo, titulo, descricao, icon: Icon }) => (
            <li key={tipo}>
              <Link
                to={`/catalogo?tipo=${tipo}`}
                className="panel flex h-full items-start gap-4 p-5 transition-colors hover:border-brand-400/30 hover:bg-ink-800"
              >
                <span className="rounded-xl bg-brand-500/15 p-3 text-brand-300">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-semibold text-zinc-100">{titulo}</span>
                  <span className="mt-1 block text-sm text-zinc-400">{descricao}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ObraShelf title="Mais vendidos" ordenar="mais-vendidos" verTodosHref="/catalogo?ordenar=mais-vendidos" />
      <ObraShelf title="Novidades no acervo" ordenar="recentes" verTodosHref="/catalogo?ordenar=recentes" />
    </>
  );
}
