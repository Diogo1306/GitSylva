# GitSylva — Auditoria de Performance (em curso)

Registo das otimizações feitas e das que faltam. Reavaliar no fim de cada onda.

## Método

- Tamanho do bundle: `npm run build` (chunks + gzip).
- Re-renders: memoização + selectors de store; verificação do grafo (elemento SVG reaproveitado, não reconstruído).
- Custo de git: cada query lança um processo `git`; evitar spawns redundantes.
- Animações: gated pelo toggle "animações decorativas" + `prefers-reduced-motion`.

## Feito

1. **Grafo do histórico memoizado** (`React.memo` + `useMemo`): a animação de entrada corre uma vez; selecionar/scrollar não reconstrói os ~590 elementos SVG. Provado: o nó SVG é reaproveitado; clique ~0.7ms.
2. **Linhas do histórico memoizadas** + `content-visibility` — só as 2 linhas afetadas re-renderizam ao selecionar; linhas fora do ecrã não são pintadas.
3. **Fontes woff2 (subset latino)**: ~1.3MB → ~110KB (12×), arranque mais leve.
4. **Code-splitting**: cada ecrã (History/WorkingCopy/Settings/Stashes/Picker/Onboarding) é um chunk; **vendor** (react/react-dom/react-query/zustand) separado. Chunk de código da app: **369KB → 90KB** (24KB gzip); vendor 221KB (69KB gzip, cacheável). Arranque só puxa o ecrã ativo.
5. **`content-visibility` nas linhas de diff**: diffs enormes saltam layout/paint fora do ecrã.
6. **`staleTime` global (5s) + `retry: false`** no react-query: evita re-executar `git` em rajada (ex.: refetch ao focar a janela) sem parecer desatualizado.
7. **Sem animações infinitas em idle** (exceto folhas decorativas, que respeitam o toggle). CPU parado é baixo.

## A fazer (por prioridade)

- **Virtualização da lista de histórico** (J1): hoje há `content-visibility`; para históricos muito grandes, janela real de linhas + segmentar o SVG do grafo por viewport. Médio/alto esforço (o grafo é um SVG único alinhado às linhas).
- **Auditar re-renders com o React DevTools Profiler** num cenário real (repo grande) — confirmar que Titlebar/Sidebar/ActionBar não re-renderizam em excesso com o `staleTime`.
- **Diff/blame muito grandes**: além do `content-visibility`, considerar cap opcional ("mostrar tudo") em ficheiros gigantes.
- **`will-change`/compositing** nas animações de entrada do grafo em máquinas lentas (medir primeiro).
- **Pré-carregar** o chunk do ecrã provável (ex.: History) em idle após o arranque.

## Como remedir

```
npm run build            # ver tamanhos dos chunks
npm run tauri dev        # e usar o Profiler do React DevTools num repo grande
```
