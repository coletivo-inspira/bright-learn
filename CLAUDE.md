# CLAUDE.md — BrightLearn A3 (Grupo 3)

Site estático (GitHub Pages) que apresenta a base BrightLearn (820 matrículas) e as entregas da A3. Idioma do projeto: **português do Brasil**.

## Stack
Vite 8, React 19, TypeScript 6 (`erasableSyntaxOnly`, `verbatimModuleSyntax`), Tailwind 4 (`@theme` tokens), recharts 3, lucide-react, clsx. Rota por hash (`#/entregas/2`), `base: './'`. Deploy por GitHub Actions (Source do Pages = "GitHub Actions").

## Comandos
- `npm run dev` · `npm run build` (tsc + vite) · `npm run lint`
- `npm run dados` regera `src/data/matriculas.json` a partir do Excel (`scripts/excel_to_json.py`).
- Antes de entregar: `npx tsc -b && npx eslint . && npm run build`.

## Estrutura
- `src/data/`: `matriculas.json` (base bruta, **nunca alterar**), `dicionario.json`, `grupo.ts` (integrantes), `entregas.ts` (cronograma).
- `src/lib/clean.ts`: tratamento feito no navegador. Cada `Row` guarda valor original + tratado + flags.
- `src/lib/analytics.ts`, `insights.ts`, `model.ts`, `stats.ts`: indicadores, diagnóstica/prescritiva, regressão logística (IRLS, CV 5 folds), estatística à mão.
- `src/pages/`: Início, Explorador, Dashboard, Entregas; `pages/entregas/E1..E5, EFinal` = uma aba por etapa.
- `documentos/`: DOCX + PDF de cada etapa (formato do exemplo Cinemax: Letter, Arial 12, título/nomes centralizados e em negrito, texto justificado, tom curto e humano, destaques em negrito).

## Regras de negócio (alinhadas ao feedback do professor, 03/11)
- **Taxa de evasão = evadidos ÷ (concluídos + evadidos)** (encerradas): 247/628 = 39,3%. Em andamento ficam fora. "Todas" (247/820 = 30,1%) só como alternativa no Dashboard.
- `Pct_Concluido` inválido (>100): concluído → 100; os demais ficam **em branco** (não imputar).
- `Nota_Final`: **sem imputação**; concluído sem nota fica em branco. Nota vazia de não concluído não é faltante.
- Dias até 1º acesso: usar mediana (assimétrica); outliers não removidos.
- Faixas de dias: 0, 1, 2–3, 4–7, 8+.
- Modelo: AUC ≈ 0,63, acurácia ≈ 63,7%; perfis de risco em `PERFIL_ALTO`/`PERFIL_BAIXO` (~82% / ~22%).

## Convenções
- Textos de interface em pt-BR, números via `lib/format.ts` (`fmtN`, `fmtPct`, vírgula decimal). Nunca escrever número "de cabeça": calcular a partir de `ROWS`/`DIAG`/`P`.
- Constantes/exports que não são componentes não ficam em arquivos de componente (react-refresh).
- Sem `localStorage` além de `lib/storage.ts`.
- Grid usa `minmax(0,1fr)` (ver `index.css`) para evitar overflow horizontal.

## Documentos (DOCX → PDF)
Gerar com docx-js e converter com LibreOffice. O texto do documento deve bater com o site. Na etapa 1 o parágrafo do problema **não mostra dados**, só observação rápida.

## Fluxo de trabalho
- Mudanças no site só depois que o usuário validar o texto/pergunta oficial; **perguntar antes** de alterar números ou conteúdo das abas.
- Commit/push é feito pelo usuário.
