import { useCallback, useEffect, useState } from 'react';

/**
 * Carrega dados assincronos com estados de loading/erro e recarga manual.
 * `deps` identifica a consulta: quando muda, uma nova requisicao e feita e
 * respostas antigas sao descartadas (evita condicao de corrida na paginacao).
 */
export function useFetch(loader, deps) {
  const [reloadToken, setReloadToken] = useState(0);
  const key = JSON.stringify([...deps, reloadToken]);
  const [state, setState] = useState({ key: null, data: undefined, error: null });

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(loader)
      .then(
        (data) => active && setState({ key, data, error: null }),
        (error) => active && setState((prev) => ({ key, data: prev.data, error })),
      );
    return () => {
      active = false;
    };
    // A consulta e identificada por `key` (derivada de deps); `loader` muda a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  // Atualizacao local otimista (ex.: remover item apos DELETE) sem refazer a requisicao.
  const mutate = useCallback((updater) => {
    setState((prev) => ({ ...prev, data: typeof updater === 'function' ? updater(prev.data) : updater }));
  }, []);

  const loading = state.key !== key;
  return { data: state.data, error: loading ? null : state.error, loading, reload, mutate };
}
