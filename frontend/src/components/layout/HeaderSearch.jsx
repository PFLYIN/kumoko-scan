import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

// Busca global: navega para /catalogo?busca=termo.
export default function HeaderSearch({ className = '', onSearch }) {
  const [termo, setTermo] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const busca = termo.trim();
    navigate(busca ? `/catalogo?busca=${encodeURIComponent(busca)}` : '/catalogo');
    onSearch?.();
  };

  return (
    <form role="search" onSubmit={handleSubmit} className={`relative ${className}`}>
      <label htmlFor="busca-global" className="sr-only">
        Buscar obras
      </label>
      <input
        id="busca-global"
        type="search"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder="Buscar obras..."
        className="w-full rounded-full border border-white/5 bg-white/5 py-2 pr-10 pl-4 text-sm text-zinc-200 placeholder-zinc-500 transition-all focus:border-brand-400/50 focus:bg-white/10 focus:outline-none md:w-48 md:focus:w-64"
      />
      <button
        type="submit"
        className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-zinc-500 hover:text-brand-400"
        aria-label="Buscar"
      >
        <Search className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}
