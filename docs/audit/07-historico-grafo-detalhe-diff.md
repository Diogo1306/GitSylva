# Anexo 7 — Histórico · Grafo · Detalhe · Diff · Blame (3.5, 3.6)

## P1
- **H1 🔴 P1** — Limite FIXO de 200 commits sem paginação/infinite-scroll (`queries.ts:67` default; `History.tsx:223`). Histórico além de 200 inacessível. Correção: `get_log(path, limit, skip)` + `useInfiniteQuery` com sentinel, ou parametrizar com aviso.
- **H2 🔴 P1 (perf)** — `memo` de `CommitRow` INEFICAZ: `onContext={(hash,x,y)=>setMenu(...)}` é arrow nova a cada render (`History.tsx:316` vs memo `:169`) → TODAS as ~200 rows re-renderizam a cada seleção/tecla/refetch. O comentário e `docs/performance-audit.md:15` afirmam o contrário (incorreto). Correção: `useCallback`.
- **H3 🔴 P1 (perf)** — `highlight()` corre por linha em cada render sem memoização (`DiffLines.tsx:67`, `DiffSplit.tsx:65-66`; regex `highlight.tsx:16`); `commit_detail` devolve o diff inteiro sem truncar (`detail.rs:72`). Diff de milhares de linhas = milhares de execuções regex + nós por render. Principal suspeito de peso em diffs grandes. Correção: memoizar por patch, limite "mostrar mesmo assim", janela.

## P2
- **H4 🟠** — Grafo = UM SVG gigante (`rows.length*52`px, `CommitGraphSvg.tsx:308`) sem content-visibility (só as rows têm), centenas/milhares de elementos.
- **H5 🟠** — Grafo re-anima a cada refetch do log: `commits = data ?? []` muda de referência → `graphRows` refaz → com `anims=on` todas as `vineDraw/nodePop/leafPop` re-tocam a CADA operação git (commit/checkout/pull/merge/tag invalidam log — `queries.ts:100-102,141-143,245`). Forte candidato ao "estranho e pesado". Correção: animar só no primeiro mount / key estável.
- **H6 🔴** — Merge commits mostram "0 arquivos / Sem alterações": `git show` sem `-m`/`--first-parent` (`detail.rs:27,42,72`) → combined diff vazio. Correção: `--first-parent -m` ou `diff hash^ hash`.
- **H7 🔴** — Renames no detalhe: numstat emite `old => new`, mapa indexado por newpath do name-status → status fallback "M" + path cru "old => new" (`detail.rs:36-38,56-62`). Correção: `--no-renames` ou parse do formato de rename.
- **H8 🟠** — Corpo multi-linha do commit NUNCA mostrado (`log.rs:17` usa `%s`; `commit_detail` não devolve mensagem; painel só mostra subject — `History.tsx:100`).
- **H9 🔴** — Sem números de linha em NENHUMA vista de diff (`DiffLines.tsx`, `DiffSplit.tsx` sem gutter). Contar a partir de `@@ -a,b +c,d @@`.
- **H10 🟠** — Classificação de linha por `startsWith("---")/("+++")` confunde conteúdo removido `--…`/adicionado `++…` com meta (`DiffLines.tsx:12-18`, `DiffSplit.tsx:12-14`). Distinguir por `--- a/` / posição no patch.
- **H11 🟠** — `DiffSplit` alinha por zip posicional; `\ No newline` força flush que separa pares (`DiffSplit.tsx:20-43`); sem content-visibility nas células (`:49-71`).
- **H12 🟠** — Repo vazio mostra erro cru: branch `commits.length===0` inalcançável porque `git log` sai 128 → cai em `String(error)` (`History.tsx:269-271`). Usar `RepoInfo.is_empty` ou devolver `[]`.
- **H13 🟠** — Setas ↑/↓ sem scroll-into-view (`History.tsx:239-258`).
- **H14 🟠** — `parse_log` indexa `f[0]/f[2]/f[3]/f[5]` sem verificação (`log.rs:44-50`): mensagem com byte `\x1f`/`\x1e` pode fazer panic. Usar `f.get(n).unwrap_or("")`.
- **H15 🟠** — `commit_detail` = 3 `git show` em série (`detail.rs:27,42,72`) por seleção. Combinar/paralelizar.
- **H16 🟠** — `BlameView` sem content-visibility/virtualização/limite (`BlameView.tsx:11`); `parseHunks` recalculado por render (`DiffLines.tsx:36`).

## P3
- **H17** — Pais fora da janela de 200 descartados silenciosamente (vine termina abruptamente — `layout.ts:47-49`).
- **H18** — >5 lanes transbordam sobre o texto (laneX=10+lane*18 vs padding 96px).
- **H19** — Branch local com "/" classificada como remota (`format.ts:60`).
- **H20** — Email do autor obtido (`%ae`) mas nunca usado (nem Gravatar nem detalhe).
- **H21** — Painel de detalhe sem parents/email/refs/chips; sem estado de erro (erro mascarado como "Sem alterações" + "+0/−0").
- **H22** — Filtro esconde o grafo por completo (razoável mas perde contexto).
- **H23** — Paths com direction:rtl podem reordenar visualmente caracteres neutros.
- **H24** — Encoding não-UTF8 → replacement chars (from_utf8_lossy) sem aviso.
- **H25** — Sem copiar diff/conteúdo (só "Copiar hash"); blame sem highlight (inconsistente com diff).

## ✅ Sólidos
Topologia usa pais REAIS (multi-parent, lane reuse — `layout.ts:40-50`, testado); 4 estilos de árvore todos implementados e distintos (`CommitGraphSvg.tsx:127-297`: carvalho/sakura 5 pétalas/palmeira+cocos/grafo puro com cores neutras); chips HEAD/branch/remote/tag parseados de `%D` corretamente; datas relativas PT; binários no numstat sem crash; estados loading/vazio do diff; `\ No newline` na unificada ok; blame toggle + parsing `--line-porcelain` correto e testado; scrolls independentes.
