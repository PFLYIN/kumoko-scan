import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

function Header() {
  const { user, authenticated, logout } = useContext(AuthContext);

  return (
    <header className="sticky top-0 z-50 w-full flex flex-col shadow-lg shadow-black/20">

      <div className="w-full bg-[#0f111a]/95 backdrop-blur-xl border-b border-indigo-500/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 shrink-0">
            <h1 className="text-xl tracking-[0.2em] text-zinc-100 font-light uppercase">
              Kumoko<span className="text-indigo-400 font-medium ml-1">Scan</span>
            </h1>
          </div>

          <nav className="hidden lg:flex flex-1 justify-center">
            <ul className="flex gap-8 text-[11px] tracking-[0.15em] text-zinc-400 font-bold uppercase">
              <li className="hover:text-indigo-300 cursor-pointer transition-colors"><a href="/">Home</a></li>
              <li className="hover:text-indigo-300 cursor-pointer transition-colors"><a href="/mangas">Mangás</a></li>
              <li className="hover:text-indigo-300 cursor-pointer transition-colors"><a href="/livros">Livros</a></li>
              <li className="hover:text-indigo-300 cursor-pointer transition-colors"><a href="/projetos">Projetos</a></li>
              <li className="hover:text-indigo-300 cursor-pointer transition-colors"><a href="/contato">Contato</a></li>
            </ul>
          </nav>

          <div className="flex items-center gap-6">
            <div className="hidden md:block relative group">
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="w-48 bg-white/5 border border-white/5 rounded-full px-5 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:w-64 focus:border-indigo-400/50 focus:bg-white/10 transition-all duration-500"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-indigo-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </button>
            </div>

            <div className="hidden lg:block h-6 w-px bg-white/10"></div>

            {authenticated ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-zinc-200">{user?.nome}</p>

                  <div className="flex gap-2 justify-end mt-1">
                    <a href="/perfil" className="text-[10px] uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">Perfil</a>
                    <span className="text-zinc-600 text-[10px]">|</span>
                    <button onClick={logout} className="text-[10px] uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors cursor-pointer">Sair</button>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold cursor-pointer ring-2 ring-transparent hover:ring-indigo-400 transition-all shadow-lg shadow-indigo-500/20">
                  {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <a href="/auth" className="text-[11px] font-bold tracking-widest text-zinc-400 hover:text-white px-3 py-2 transition-colors">ENTRAR</a>
                <a href="/auth" className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold tracking-widest px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20">CADASTRAR</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;