import { useCallback, useEffect, useMemo, useState } from 'react';
import { CartContext } from './contextObjects.js';

const STORAGE_KEY = 'kumoko_cart_v1';
// Mesmas invariantes do aggregate Pedido no order-service.
export const MAX_ITENS_DISTINTOS = 20;
export const MAX_QUANTIDADE = 99;

function clampQuantidade(q) {
  const n = Math.trunc(Number(q));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_QUANTIDADE);
}

// Item salvo: { obraId, quantidade, snapshot: { nome, tipo, capaUrl, preco } }.
// O snapshot serve apenas para exibicao; o preco final e calculado pelo backend.
function sanitize(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((i) => i && Number.isInteger(i.obraId) && i.obraId > 0)
    .slice(0, MAX_ITENS_DISTINTOS)
    .map((i) => ({
      obraId: i.obraId,
      quantidade: clampQuantidade(i.quantidade),
      snapshot: {
        nome: String(i.snapshot?.nome ?? `Obra #${i.obraId}`),
        tipo: i.snapshot?.tipo ?? null,
        capaUrl: i.snapshot?.capaUrl ?? null,
        preco: Number(i.snapshot?.preco) || 0,
        indisponivel: i.snapshot?.indisponivel === true,
      },
    }));
}

function readStorage() {
  try {
    return sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
  } catch {
    return [];
  }
}

function toSnapshot(obra) {
  return { nome: obra.nome, tipo: obra.tipo, capaUrl: obra.capaThumbUrl ?? obra.capaUrl ?? null, preco: Number(obra.preco) || 0 };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStorage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Armazenamento indisponivel (modo privado/cota): o carrinho segue apenas em memoria.
    }
  }, [items]);

  // Mantem abas abertas sincronizadas.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setItems(readStorage());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Retorna false quando o limite de itens distintos impede a adicao.
  const addItem = useCallback(
    (obra, quantidade = 1) => {
      const existe = items.some((i) => i.obraId === obra.id);
      if (!existe && items.length >= MAX_ITENS_DISTINTOS) return false;
      setItems((prev) => {
        const atual = prev.find((i) => i.obraId === obra.id);
        if (atual) {
          return prev.map((i) =>
            i.obraId === obra.id
              ? { ...i, quantidade: clampQuantidade(i.quantidade + quantidade), snapshot: toSnapshot(obra) }
              : i,
          );
        }
        return [...prev, { obraId: obra.id, quantidade: clampQuantidade(quantidade), snapshot: toSnapshot(obra) }];
      });
      return true;
    },
    [items],
  );

  const setQuantidade = useCallback((obraId, quantidade) => {
    setItems((prev) => prev.map((i) => (i.obraId === obraId ? { ...i, quantidade: clampQuantidade(quantidade) } : i)));
  }, []);

  const removeItem = useCallback((obraId) => {
    setItems((prev) => prev.filter((i) => i.obraId !== obraId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  // Atualiza os snapshots com dados frescos do catalogo (precos/nomes podem ter mudado).
  const refreshSnapshots = useCallback((obras) => {
    const porId = new Map(obras.map((o) => [o.id, o]));
    // Obras que sumiram do catalogo ficam marcadas como indisponiveis (o pedido seria recusado com 422).
    setItems((prev) =>
      prev.map((i) =>
        porId.has(i.obraId)
          ? { ...i, snapshot: toSnapshot(porId.get(i.obraId)) }
          : { ...i, snapshot: { ...i.snapshot, indisponivel: true } },
      ),
    );
  }, []);

  const value = useMemo(() => {
    const totalItens = items.reduce((acc, i) => acc + i.quantidade, 0);
    const totalEstimado = items.reduce((acc, i) => acc + (i.snapshot.indisponivel ? 0 : i.quantidade * i.snapshot.preco), 0);
    return { items, totalItens, totalEstimado, addItem, setQuantidade, removeItem, clear, refreshSnapshots };
  }, [items, addItem, setQuantidade, removeItem, clear, refreshSnapshots]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
