import { useCallback, useState } from 'react';

/** localStorage com try/catch (pode falhar em aba anônima, preview etc.). */
export function lerLocal<T>(chave: string, padrao: T): T {
  try {
    const v = window.localStorage.getItem(chave);
    return v == null ? padrao : (JSON.parse(v) as T);
  } catch {
    return padrao;
  }
}

export function gravarLocal<T>(chave: string, valor: T): void {
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* sem armazenamento: segue sem persistir */
  }
}

/** useState que lembra o valor entre visitas (por navegador). */
export function usePersistido<T>(chave: string, padrao: T): [T, (v: T | ((a: T) => T)) => void] {
  const [valor, setValor] = useState<T>(() => lerLocal(chave, padrao));
  const set = useCallback(
    (v: T | ((a: T) => T)) => {
      setValor((atual) => {
        const novo = typeof v === 'function' ? (v as (a: T) => T)(atual) : v;
        gravarLocal(chave, novo);
        return novo;
      });
    },
    [chave],
  );
  return [valor, set];
}
