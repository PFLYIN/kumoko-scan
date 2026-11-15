import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5 bg-ink-950 py-12 text-center">
      <div className="mx-auto max-w-7xl 2xl:max-w-[96rem] px-6">
        <p className="text-xl font-black tracking-tighter text-zinc-100">
          KUMOKO<span className="text-accent-400">SCAN</span>
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm text-zinc-500">
          Mangás, livros e light novels para ler e colecionar. Feito de fã para fã.
        </p>
        <nav aria-label="Rodapé" className="mt-6 flex justify-center gap-6 text-xs text-zinc-400">
          <Link to="/catalogo" className="hover:text-brand-300">
            Catálogo
          </Link>
          <Link to="/pedidos" className="hover:text-brand-300">
            Meus pedidos
          </Link>
          <Link to="/perfil" className="hover:text-brand-300">
            Minha conta
          </Link>
        </nav>
        <p className="mt-8 border-t border-white/5 pt-8 text-[10px] font-bold tracking-widest text-zinc-600 uppercase">
          &copy; {new Date().getFullYear()} Kumoko Scan
        </p>
      </div>
    </footer>
  );
}
