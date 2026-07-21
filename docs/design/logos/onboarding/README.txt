GitSylva - Onboarding Tree Kit
==============================

A base e o S limpo da logo (traco arredondado, viewBox 0 0 84 112).
A arvore cresce por estagios: 0 = so o S, 1 = tronco prolonga-se e abre um ramo, 2 = copa completa em leque.

Pastas:
- png/               3 estagios em PNG 4x, verde Classic, fundo transparente
- svg/               SVG estatico, 3 estagios x 5 cores (classic, batman, gitclassic, nipon, white)
- svg-animated/      SVG com animacao de crescimento embutida (corre ao carregar; ~1.5s no estagio 0, ~2.3s no 1, ~3.2s no 2)

Notas:
- Nos SVGs, os nos ocos usam var(--gs-bg, transparent) como preenchimento: define --gs-bg no elemento pai para combinar com o fundo (ex.: style="--gs-bg:#141618").
- Cores por tema: classic #3B7A57, batman #82C99B, gitclassic #3FB950, nipon #C96C93, white #FFFFFF.
- Easing da marca: cubic-bezier(0.2, 0.9, 0.3, 1).
- Para a sequencia de entrada do app: mostra o estagio 0 animado, depois troca para 1 e 2 (cross-fade ou re-render) a medida que o arranque avanca.
