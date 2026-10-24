import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import clsx from 'clsx';
import { BarChart3, Database, FileDown, GraduationCap, Home, ListChecks, Moon, Sun } from 'lucide-react';
import { GRUPO } from '../data/grupo';
import { href } from '../lib/router';
import type { Pagina } from '../lib/router';

const NAV: { pagina: Pagina; rotulo: string; caminho: string; Icone: typeof Home }[] = [
  { pagina: 'inicio', rotulo: 'Início', caminho: '', Icone: Home },
  { pagina: 'entregas', rotulo: 'Entregas', caminho: 'entregas/1', Icone: ListChecks },
  { pagina: 'dados', rotulo: 'Base de dados', caminho: 'dados', Icone: Database },
  { pagina: 'dashboard', rotulo: 'Dashboard', caminho: 'dashboard', Icone: BarChart3 },
];

function useTema() {
  const [tema, setTema] = useState<'light' | 'dark'>(() => {
    const salvo = document.documentElement.dataset.theme;
    if (salvo === 'dark' || salvo === 'light') return salvo;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  useEffect(() => {
    document.documentElement.dataset.theme = tema;
  }, [tema]);
  const alternar = () => {
    const novo = tema === 'dark' ? 'light' : 'dark';
    setTema(novo);
    try {
      localStorage.setItem('bl-tema', novo);
    } catch {
      /* ignora */
    }
  };
  return { tema, alternar };
}

export function Layout({ pagina, children }: { pagina: Pagina; children: ReactNode }) {
  const { tema, alternar } = useTema();
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-3 focus:py-2 focus:text-white"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('conteudo')?.focus();
        }}
      >
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <a href={href('')} className="flex items-center gap-2.5" aria-label="BrightLearn — início">
            <span className="relative flex size-9 items-center justify-center rounded-xl bg-brand font-display text-sm font-extrabold text-white">
              BL
              <span className="absolute -top-1 -right-1 size-3 rounded-full bg-accent ring-2 ring-surface" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-sm font-extrabold tracking-tight">BrightLearn</span>
              <span className="block text-[11px] text-muted">A3 · Análise de Dados e Big Data</span>
            </span>
          </a>

          <nav aria-label="Principal" className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto sm:flex-1">
            {NAV.map(({ pagina: p, rotulo, caminho, Icone }) => (
              <a
                key={p}
                href={href(caminho)}
                aria-current={pagina === p ? 'page' : undefined}
                className={clsx(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                  pagina === p ? 'bg-brand-soft text-brand-ink' : 'text-muted hover:bg-surface-2 hover:text-ink',
                )}
              >
                <Icone className="size-4" aria-hidden />
                {rotulo}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:ml-0">
            <a
              href="./Base_4_BrightLearn_Cursos.xlsx"
              download
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink md:flex"
              title="Baixar a base original (Excel)"
            >
              <FileDown className="size-4" aria-hidden />
              Excel original
            </a>
            <button
              type="button"
              onClick={alternar}
              className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
              aria-label={tema === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
              title={tema === 'dark' ? 'Tema claro' : 'Tema escuro'}
            >
              {tema === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none sm:px-6 sm:py-10">
        {children}
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs leading-relaxed text-muted sm:px-6">
          <p className="flex items-center gap-1.5 font-medium text-ink">
            <GraduationCap className="size-4 text-brand" aria-hidden />
            {GRUPO.nome} · {GRUPO.disciplina} · Prof. {GRUPO.professor}
          </p>
          <p>
            {GRUPO.integrantes.join(' · ')}
          </p>
          <p>
            Base de dados fictícia fornecida pelo professor ({GRUPO.tema}). Parte do código e dos textos deste site foi apoiada por IA (Claude);
            o grupo validou e entende cada número apresentado.
          </p>
        </div>
      </footer>
    </div>
  );
}
