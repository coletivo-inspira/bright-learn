# BrightLearn · Do dado à decisão

Site estático da **Avaliação A3 — Análise de Dados e Big Data** (Prof. Luiz Oliveira).
Apresenta a base **BrightLearn** (820 matrículas de uma plataforma de cursos online), permite buscar e filtrar os dados e mostra o passo a passo de cada entrega do trabalho.

Mesma stack do site da Nathália Verri: **React 19 + TypeScript + Vite + Tailwind 4**, publicado no **GitHub Pages** por GitHub Actions.

## O que tem no site

| Página | O que faz |
| --- | --- |
| **Início** | Resumo, KPIs, cronograma com contagem regressiva e próxima entrega |
| **Entregas** | Uma aba por checkpoint: Entrega 1 (21/10) · 2 (28/10) · 3 (04/11) · 4 (11/11) · 5 (25/11) · Final (09/12) |
| **Base de dados** | Busca livre, filtros, ordenação, dados **brutos × tratados**, detalhe da matrícula, exportar CSV, dicionário e perfil das colunas |
| **Dashboard** | KPI + 5 gráficos que reagem aos filtros (categoria, dispositivo, período, base da taxa de evasão) |

## Rodando localmente

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera a pasta dist/
```

## Onde editar

| O quê | Arquivo |
| --- | --- |
| Nome do grupo, integrantes, link do Drive, link do dashboard externo | `src/data/grupo.ts` |
| Datas e checklist de cada entrega | `src/data/entregas.ts` |
| Regras de limpeza (categorias, % > 100, notas, outliers) | `src/lib/clean.ts` |
| Indicadores e agregações | `src/lib/analytics.ts` |
| Modelo preditivo (regressão logística) | `src/lib/model.ts` |
| Números das análises diagnóstica e prescritiva | `src/lib/insights.ts` |
| Textos de cada entrega | `src/pages/entregas/E1.tsx` … `EFinal.tsx` |
| Pergunta → gráfico de cada visualização | `src/components/graficosSpec.ts` |

## Dados

* O Excel original está em `data/Base_4_BrightLearn_Cursos.xlsx` (e em `public/`, para o botão "Excel original").
* `python scripts/excel_to_json.py` converte o Excel em `src/data/matriculas.json` (dados **brutos**, sem tratamento) e `src/data/dicionario.json`. Precisa de `openpyxl`.
* O tratamento é feito **no navegador**, em `src/lib/clean.ts`, para o site poder mostrar antes × depois. Os dados originais nunca são alterados.

### Tratamentos aplicados

1. **Categoria_Curso**: 10 grafias → 5 categorias (remove espaços, acentos e caixa). Medida: moda.
2. **Pct_Concluido > 100** (8 linhas com 140): troca pela mediana do mesmo status. Medida: mediana.
3. **Nota_Final**: vazios de não concluídos ficam vazios (não se aplica); 15 concluídos sem nota recebem a mediana (7,6). Medida: mediana.
4. **Dias_Ate_Primeiro_Acesso**: outliers (> 8,5 dias) são mantidos e sinalizados. Medida: mediana.
5. **Motivo_Evasao = "Não informado"**: mantido como categoria própria. Medida: moda.

## Publicando no GitHub Pages

```bash
git init
git add .
git commit -m "v1"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPO.git
git push -u origin main
```

O workflow `.github/workflows/deploy.yml` roda a cada push na `main`, faz o build e publica. Se o Pages não ativar sozinho: **Settings → Pages → Source: GitHub Actions**.
O `vite.config.ts` usa `base: './'`, então funciona em `usuario.github.io/nome-do-repo/` ou em domínio próprio. A navegação usa `#/` (hash), sem precisar de regras de redirecionamento.

## Uso de IA

O site foi montado com apoio de IA (Claude). Os números foram conferidos contra os totais da base e contra um cálculo independente em Python (pandas). O texto do registro de uso de IA para o documento está na aba **Entrega 5** e deve ser ajustado pelo grupo.
