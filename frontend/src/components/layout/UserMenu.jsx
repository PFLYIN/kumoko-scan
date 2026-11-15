import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LibraryBig, LogOut, Receipt, UserRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';

const itemClass =
  'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 hover:text-white focus-visible:bg-white/5';

export default function UserMenu() {
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Fecha ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    // Sai da rota protegida antes de limpar a sessao (evita redirecionar para /entrar).
    navigate('/');
    try {
      await logout();
      toast.info('Você saiu da sua conta.');
    } catch (err) {
      toast.error(err);
    }
  };

  const inicial = user?.nome?.trim()?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menu da conta de ${user?.nome ?? 'usuário'}`}
        className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-brand-600 font-bold text-white shadow-lg ring-2 shadow-brand-500/20 ring-transparent transition-all hover:ring-brand-400"
      >
        {inicial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 rounded-xl border border-white/10 bg-ink-800 p-2 shadow-2xl shadow-black/50"
        >
          <div className="border-b border-white/5 px-3 pt-1 pb-3">
            <p className="truncate text-sm font-semibold text-zinc-100">{user?.nome}</p>
            <p className="truncate text-xs text-zinc-500">{user?.email}</p>
          </div>
          <div className="pt-2">
            <Link role="menuitem" onClick={() => setOpen(false)} to="/perfil" className={itemClass}>
              <UserRound className="size-4" aria-hidden="true" /> Meu perfil
            </Link>
            <Link role="menuitem" onClick={() => setOpen(false)} to="/pedidos" className={itemClass}>
              <Receipt className="size-4" aria-hidden="true" /> Meus pedidos
            </Link>
            {isAdmin && (
              <Link role="menuitem" onClick={() => setOpen(false)} to="/admin/acervo" className={itemClass}>
                <LibraryBig className="size-4" aria-hidden="true" /> Gerenciar acervo
              </Link>
            )}
          </div>
          <button role="menuitem" type="button" onClick={handleLogout} className={`${itemClass} text-red-300`}>
            <LogOut className="size-4" aria-hidden="true" /> Sair
          </button>
        </div>
      )}
    </div>
  );
}
