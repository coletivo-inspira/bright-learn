import { Suspense, lazy } from 'react';
import { Layout } from './components/Layout';
import { useRota } from './lib/router';
import Inicio from './pages/Inicio';

// páginas pesadas (gráficos/tabela) carregam sob demanda
const Entregas = lazy(() => import('./pages/Entregas'));
const Explorador = lazy(() => import('./pages/Explorador'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

export default function App() {
  const { pagina, param } = useRota();
  return (
    <Layout pagina={pagina}>
      <Suspense fallback={<p className="py-20 text-center text-sm text-muted">Carregando…</p>}>
        {pagina === 'inicio' && <Inicio />}
        {pagina === 'entregas' && <Entregas id={param} />}
        {pagina === 'dados' && <Explorador />}
        {pagina === 'dashboard' && <Dashboard />}
      </Suspense>
    </Layout>
  );
}
