import { Link } from 'react-router-dom';
import { BookMarked, BookOpenText, Sparkles, Tags } from 'lucide-react';
import ObraShelf from '../../components/obras/ObraShelf.jsx';
import GeneroChips from '../../components/obras/GeneroChips.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { catalogService } from '../../services/catalog.service.js';
import heroImage from '../../assets/kumoko_hero.jpg';
import HomeDestaque from './HomeDestaque.jsx';
import ContinuarLendo from './ContinuarLendo.jsx';

const CATEGORIAS = [
  { tipo: 'manga', titulo: 'Mangás', descricao: 'Ação, romance, isekai e muito mais.', icon: Sparkles },
  { tipo: 'novel', titulo: 'Light novels', descricao: 'As histórias que deram origem aos animes.', icon: BookOpenText },
  { tipo: 'livro', titulo: 'Livros', descricao: 'Clássicos e lançamentos para colecionar.', icon: BookMarked },
];

function GenerosPopulares() {
  const { data } = useFetch(() => catalogService.listGeneros(), []);
  if (!data?.length) return null;
  return (
    <section aria-labelledby="home-generos" className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 2xl:max-w-[96rem]">
      <h2 id="home-generos" className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-widest text-zinc-400 uppercase">
        <Tags className="size-4 text-brand-400" aria-hidden="true" /> Explore por gênero
      </h2>
      <GeneroChips generos={data.slice(0, 14).map((g) => g.genero)} label="Gêneros populares" />
    </section>
  );
}

export default function HomePage() {
  useDocumentTitle(null);

  return (
    <>
      <section
        className="relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900/95 via-ink-900/80 to-ink-900/60" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-900" aria-hidden="true" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_minmax(0,36rem)] lg:py-16 2xl:max-w-[96rem]">
          <div className="text-center lg:text-left">
            <span className="mb-5 block text-xs font-medium tracking-[0.4em] text-brand-300 uppercase">Feito de fã para fã</span>
            <h1 className="mb-5 text-4xl leading-tight font-light tracking-wide text-white md:text-5xl 2xl:text-6xl">
              A magia de cada <br />
              <span className="bg-gradient-to-r from-brand-300 to-accent-400 bg-clip-text font-semibold text-transparent">
                novo capítulo.
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-lg text-base text-zinc-300 lg:mx-0">
              Mangás, light novels e livros para comprar e ler online, com o progresso salvo onde você parou.
            </p>
            <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link to="/catalogo" className="btn-primary rounded-full px-7 py-3 text-xs tracking-widest">
                EXPLORAR OBRAS
              </Link>
              <Link
                to="/catalogo?ordenar=mais-vendidos"
                className="btn-secondary rounded-full px-7 py-3 text-xs tracking-widest"
              >
                MAIS VENDIDOS
              </Link>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <HomeDestaque />
          </div>
        </div>
      </section>

      <ContinuarLendo />

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

      <GenerosPopulares />

      <ObraShelf title="Mais vendidos" ordenar="mais-vendidos" verTodosHref="/catalogo?ordenar=mais-vendidos" />
      <ObraShelf title="Novidades no acervo" ordenar="recentes" verTodosHref="/catalogo?ordenar=recentes" />
      <ObraShelf
        title="Light novels"
        id="novels"
        tipo="novel"
        ordenar="mais-vendidos"
        verTodosHref="/catalogo?tipo=novel"
      />
    </>
  );
}
