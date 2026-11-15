import { useEffect } from 'react';

// Titulo da aba por pagina (ajuda leitores de tela e historico do navegador).
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Kumoko Scan` : 'Kumoko Scan';
  }, [title]);
}
