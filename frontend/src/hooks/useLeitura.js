import { useSyncExternalStore } from 'react';
import { leituraStore, listarProgresso } from '../utils/leitura.js';

// Mapa obraId -> progresso (re-renderiza quando o leitor salva).
export function useProgressoLeitura() {
  return useSyncExternalStore(leituraStore.subscribe, leituraStore.getSnapshot);
}

export function useProgressoDaObra(obraId) {
  const dados = useProgressoLeitura();
  return obraId ? (dados[obraId] ?? null) : null;
}

export function useHistoricoLeitura() {
  return listarProgresso(useProgressoLeitura());
}
