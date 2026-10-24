import { useEffect, useState } from 'react';

/**
 * Roteador mínimo baseado em hash (#/entregas/2). Funciona em qualquer hospedagem
 * estática (GitHub Pages) sem precisar de regras de redirecionamento.
 */
export type Pagina = 'inicio' | 'entregas' | 'dados' | 'dashboard';

export interface Rota {
  pagina: Pagina;
  param: string | null;
}

export function lerRota(hash: string): Rota {
  const partes = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [p, param] = partes;
  if (p === 'entregas' || p === 'dados' || p === 'dashboard') return { pagina: p, param: param ?? null };
  return { pagina: 'inicio', param: null };
}

export function useRota(): Rota {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return lerRota(hash);
}

export const href = (path: string): string => `#/${path.replace(/^\//, '')}`;
