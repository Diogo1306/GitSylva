# GitSylva — revisão pré-release e handoff

> Auditoria inicial e reauditoria feitas em 23 de julho de 2026 sobre
> `develop`, commit `a0d94dba541e12072524f57d04ceb51ead001b64`.
>
> Reauditoria concluída às 17:55 (Europe/Lisbon). O HEAD não mudou desde a
> auditoria anterior e `src/`, `src-tauri/` e os manifestos continuam sem
> alterações locais. Existem mudanças não commitadas do utilizador em
> `README.md`, `docs/gitsylva-s.svg` e `site/`; foram preservadas. Antes de
> corrigir qualquer item, confirmar se a linha indicada ainda contém o mesmo
> código e voltar a executar a reprodução. Este documento não altera a
> aplicação.

## Veredito curto

O projeto está num estado tecnicamente forte para uma aplicação jovem: compila
em release, o backend tem testes reais de Git, as dependências npm não têm
vulnerabilidades conhecidas, as operações pesadas saem da thread da UI e as
ações destrutivas importantes têm confirmação.

Ainda assim, a recomendação após a segunda revisão continua a ser **não publicar
já a nova versão**. O código auditado é exatamente o mesmo da primeira revisão:
o bloqueio de versionamento permanece, a suite frontend voltou a falhar — agora
em dois testes — e o browser confirmou que há controlos importantes que só
funcionam com rato apesar de o produto se apresentar como “keyboard-friendly”.

A reauditoria melhorou a confiança na parte visual: onboarding, entrada,
Definições e os formulários de repositório abriram corretamente no browser,
inclusive no tamanho mínimo `900×560`, sem erros de consola. Isto confirma que a
UI básica está saudável, mas não elimina os gates de release vermelhos.

### Prioridades

- **P0 — bloqueia release:** publicar novos binários ainda marcados como
  `0.1.0` faz o updater considerar que não existe uma versão mais recente.
- **P1 — corrigir/decidir antes da release:** suite frontend vermelha;
  acessibilidade por teclado incompleta; processo de release/updater totalmente
  manual e sem CI; decisão explícita sobre funcionalidades visíveis “Em breve”.
- **P2 — corrigir logo a seguir ou incluir nesta release se houver tempo:**
  validação/containment de paths, operações de rede sem limite, metadados de
  pacote, dois avisos Clippy, README desatualizado e decisão de licença.
- **P3 — manutenção:** mapa de locks sem remoção, pequenos updates de
  dependências e limpeza de documentação histórica.

## Matriz de validação executada

| Verificação | Resultado | Evidência |
|---|---:|---|
| `npm run lint` | ✅ | reexecutado; exit 0 |
| `npm run build` | ✅ | reexecutado; 231 módulos; build Vite concluído |
| `npx tauri build --no-bundle` | ✅ com aviso | auditoria inicial no mesmo HEAD; gerou `src-tauri/target/release/app.exe` |
| `cargo check --release` | ✅ | auditoria inicial no mesmo HEAD; perfil release concluído |
| `cargo test` | ✅ | reexecutado; 64 testes Rust aprovados |
| `npm test` | ❌ | reexecutado; 428/430; dois timeouts em `DiffView.test.tsx` |
| `cargo clippy --all-targets -- -D warnings` | ❌ | reexecutado; os mesmos 2 avisos tratados como erros |
| `npm audit --json` | ✅ | reexecutado; 0 vulnerabilidades em 280 dependências |
| Teste isolado de `DiffView.test.tsx` ×3 | ✅, mas no limite | 4,81 s; 4,57 s; 4,08 s de testes para timeout de 5 s |
| Updater público | ✅ para a release antiga | `latest.json` existe e aponta para `0.1.0` |
| Browser integrado | ✅ parcial | onboarding, entrada, Definições, Local/Clone/Create e `900×560`; zero erros/warnings de consola |

O teste visual no browser cobre apenas frontend. Como a aplicação é Tauri, as
operações Git, dialogs nativos, updater, controlos reais da janela e persistência
final ainda precisam do smoke test na janela Tauri nativa e em repositórios
descartáveis.

## Bloqueador de release

### P0. A “nova versão” continua identificada como `0.1.0`

**Onde**

- `package.json:4`
- `package-lock.json:3` e `package-lock.json:9`
- `src-tauri/Cargo.toml:3`
- `src-tauri/tauri.conf.json:4`

**Evidência**

Em 23/07/2026, a release pública mais recente e o seu `latest.json` tinham
`version: 0.1.0`. O código auditado também usa `0.1.0`.

**Impacto**

O updater compara versões semânticas. Um instalador novo publicado como
`0.1.0` não será oferecido a quem já tem `0.1.0`; também cria ambiguidade entre
dois binários diferentes com a mesma versão.

**Correção**

1. Escolher a próxima versão SemVer, por exemplo `0.2.0` para esta mudança
   visual/funcional ou `0.1.1` se for apenas correção.
2. Atualizar os quatro locais acima e deixar o lockfile ser atualizado pelo npm.
3. Construir e assinar o instalador dessa versão.
4. Criar tag `vX.Y.Z`.
5. Publicar instalador, assinatura e `latest.json` com a mesma versão.
6. Instalar a versão antiga e confirmar que ela deteta, descarrega, verifica e
   reinicia na nova versão.

**Aceitação**

- A versão mostrada em Definições → Sobre é a nova.
- Nome do instalador, tag Git, manifestos e `latest.json` coincidem.
- Uma instalação real de `0.1.0` recebe o update.

## Problemas P1

### P1.1. A suite frontend falha de forma repetível no diff grande

**Onde**

- `src/components/DiffView.test.tsx:22-32`
- `src/components/DiffView.tsx:44-70`
- `src/components/DiffLines.tsx:40-133`
- `src/lib/diffLimits.ts:4` (`DIFF_PAGE_LINES = 1500`)

**Reprodução**

```powershell
npm test
```

Resultado da reauditoria: `1 failed | 57 passed`, `428 passed | 2 failed`.
Falharam por timeout:

- “renders only the first page of a huge patch and loads more on demand”,
  demorando aproximadamente 16,8 s;
- “does not offer staging for the possibly-cut last hunk”, demorando
  aproximadamente 5,5 s.

Isolado, o ficheiro passou três vezes, mas o trabalho dos testes ficou entre
4,08 s e 4,81 s — perto demais do timeout de 5 s. Isto caracteriza um teste
sensível a carga e pode também revelar renderização inicial cara de 1.500 linhas
React em WebView.

**Não corrigir apenas aumentando o timeout.** Primeiro medir:

1. tempo de `makePatch`;
2. primeiro `render(<DiffView>)`;
3. procura de texto no DOM;
4. clique em “Mostrar mais” e segundo render;
5. custo de `highlight()` e quantidade de nós criada.

Possíveis soluções: reduzir a primeira página, virtualizar linhas, desativar
highlighting num limite mais baixo, separar o teste funcional de um benchmark
ou otimizar as queries do teste. Só aumentar o timeout se o produto estiver
rápido e a lentidão for comprovadamente exclusiva do jsdom.

**Aceitação**

- `npm test` passa 3 vezes consecutivas sem retry.
- O teste isolado fica com margem confortável, idealmente abaixo de 2 s.
- Smoke test de um diff com milhares de linhas não bloqueia a janela.

### P1.2. Vários controlos visíveis não são utilizáveis por teclado

O código usa `div`/`span` com `onClick`, sem `button`, `tabIndex`, papel ARIA ou
tratamento de Enter/Espaço. Exemplos confirmados:

- carregar mais linhas e carregar diff completo:
  `src/components/DiffView.tsx:102-118`;
- preparar hunk:
  `src/components/DiffLines.tsx:102-109`;
- voltar e repetir onboarding:
  `src/features/settings/Settings.tsx:105-107` e `142-144`;
- cartões de tema, árvore, paleta, acento e fonte:
  `src/features/settings/sections/Appearance.tsx:38`,
  `149-155`, `166-169`, `186-189`, `248-255`;
- linha inteira dos toggles:
  `src/features/settings/sections/_shared.tsx:33-41`;
- checkboxes de branch/stash:
  `src/features/shell/Modals.tsx:26-32`;
- linhas, grupos, fechar repo e adicionar repo no rail:
  `src/features/shell/RepoRail.tsx:40-53`, `64-73`, `82-84`.

Há pelo menos 16 padrões deste tipo encontrados por pesquisa estática. Em
contraste, os componentes `Modal`, `ConfirmDialog`, `SelectableRow`,
`Segmented`, `Button` e os menus de sync já demonstram padrões acessíveis bons
que podem ser reutilizados.

**Confirmação no browser:** no ecrã Definições, o controlo visual “← Back” foi
inspecionado como `tagName: DIV`, sem `role` nem `aria-label`, com
`tabIndex: -1`. Portanto não entra na ordem de Tab, embora o clique com rato
funcione.

**Impacto**

- fluxo incompleto sem rato;
- foco invisível/inexistente;
- estado selecionado não anunciado;
- leitores de ecrã não reconhecem ação, checkbox, radio ou seleção;
- contradiz a promessa “keyboard-friendly” do README.

**Correção**

- Ações simples: usar `<button type="button">`.
- Opções exclusivas: `radio`/radiogroup ou o componente `Segmented`.
- Toggles: um único botão/checkbox com `aria-checked` ou `aria-pressed`; evitar
  um `div` clicável a envolver outro botão clicável.
- Linhas selecionáveis: reutilizar `SelectableRow` com estado atual anunciado.
- Preservar os estilos existentes e garantir `:focus-visible`.
- Adicionar testes com Tab + Enter + Espaço para os fluxos principais.

**Aceitação**

Todo o onboarding, troca/fecho de repo, definições, diff, stage/unstage, commit,
branch, stash, pull e push é executável só com teclado.

### P1.3. Release e updater dependem de passos manuais sem CI

**Onde**

- não existe diretório `.github/workflows`;
- `scripts/build-installer.ps1` apenas compila o NSIS assinado;
- não existe script versionado que crie/verifique/publica `latest.json` e os
  assets da release.

**Impacto**

É fácil publicar versões desencontradas, esquecer a assinatura, usar um
`latest.json` antigo ou lançar um commit que não passou os gates.

**Correção**

Criar um workflow de tag que execute lint, frontend tests, Rust tests, Clippy,
build release, assinatura e publicação dos assets/updater. Se for mantido manual,
criar pelo menos um script/checklist que falhe quando versões, tag, nomes,
assinaturas e `latest.json` não coincidem.

**Aceitação**

Uma release limpa pode ser reconstruída a partir da tag e o pipeline recusa
qualquer gate vermelho.

### P1.4. Decidir o âmbito das funcionalidades “Em breve”

O produto aparenta estar “terminado”, mas ainda expõe funcionalidades não
implementadas:

- contas GitHub/GitLab/Bitbucket são stubs permanentes:
  `src/features/settings/sections/Accounts.tsx:13-35`;
- integrações do onboarding mostram “Em breve”:
  `src/features/onboarding/Onboarding.tsx:246-267`;
- editor Git, SSH e Avançado são secções stub:
  `src/features/settings/Settings.tsx:152-170`;
- notificações de sistema não existem:
  `src/features/settings/sections/Notifications.tsx:25-36`;
- o botão “Abrir terminal” só mostra um toast:
  `src/features/shell/TitlebarTools.tsx:162` e `229`.

Isto não é necessariamente um bug, mas é uma decisão de produto obrigatória
antes do lançamento. Opções seguras:

1. remover/esconder os pontos de entrada até estarem funcionais; ou
2. manter apenas os que comunicam claramente “Em breve”, sem parecerem ações
   primárias disponíveis; e
3. alinhar README, release notes e screenshots com o âmbito real.

## Problemas P2

### P2.1. Nome de clone/init aceita separadores e saída da pasta escolhida

**Onde:** `src-tauri/src/git/repo.rs:79-107`.

`name` só é validado contra string vazia. Valores como `../outro`, um caminho
absoluto ou nomes inválidos no Windows podem escapar de `parent` ou produzir
erros pouco claros. Não há command injection porque os argumentos são passados
como argv, mas falta validação de destino.

Validar que `name` é um único nome de pasta, rejeitar `.`/`..`, separadores,
prefixos/paths absolutos e nomes reservados. Depois normalizar o destino e
confirmar que continua dentro de `parent`. Adicionar testes para Windows e Unix.

### P2.2. Abrir/revelar ficheiro não garante containment no repositório

**Onde:** `src-tauri/src/sys.rs:35-76`.

`Path::new(path).join(file)` aceita `..` e paths absolutos. Num frontend Tauri
confiável isto é sobretudo defesa em profundidade, mas uma futura injeção no
WebView ou chamada IPC indevida poderia abrir qualquer path local.

Canonicalizar base e destino, exigir que o destino esteja dentro da base e
devolver erro explícito quando não estiver. Tratar ficheiros ainda não
existentes sem enfraquecer a validação.

### P2.3. Clone, pull e push podem ficar pendurados sem limite

**Onde**

- `src-tauri/src/git/mod.rs:140-189`
- `src-tauri/src/git/sync.rs:48-51` e `78-108`
- `src-tauri/src/git/repo.rs:89-102`

`fetch` tem timeout de 120 s; `clone`, `pull` e `push` usam `Command::output()`
sem timeout/cancelamento. `GIT_TERMINAL_PROMPT=0` evita prompts interativos, mas
não resolve redes presas. O trabalho sai da thread UI, portanto a janela não
congela, mas a ação pode ficar “em progresso” indefinidamente e prender o lock
do repo.

Definir política de timeout/cancelamento por operação. Para operações que não
devem ser mortas a meio, mostrar progresso, permitir cancelamento seguro quando
possível e oferecer recuperação/diagnóstico claro.

### P2.4. Metadados e identificador de bundle precisam de limpeza

**Onde**

- `src-tauri/Cargo.toml:4-7`: `"A Tauri App"`, `["you"]`, licença e repository
  vazios;
- `src-tauri/tauri.conf.json:5`: `com.gitsylva.app`.

O build Tauri avisou que o identificador termina em `.app`, o que pode colidir
com a extensão de bundle no macOS. O produto atualmente anuncia Windows, mas
`bundle.targets` está em `all`.

Preencher descrição, autor, repository e licença; decidir se o produto é só
Windows; e usar um identifier durável que não termine em `.app` antes de criar
dados de utilizador que depois precisem de migração. Se mudar o identifier após
uma release instalada, planear migração de preferências/logs.

### P2.5. Não existe licença do repositório/distribuição

Não foi encontrado `LICENSE*` e `Cargo.toml` tem `license = ""`. Como o
repositório e os binários já são públicos, decidir explicitamente os direitos de
uso e distribuição. Se o projeto não for open source, documentar os termos
apropriados em vez de adicionar uma licença permissiva por acidente.

### P2.6. README parcialmente corrigido no worktree

- A alteração local atual de `README.md` já substitui a afirmação de que o
  inglês estava no roadmap por suporte PT/EN com deteção automática. Esta parte
  está **corrigida no worktree, mas ainda não commitada**.
- A mesma alteração acrescenta a landing page em `site/` e o SVG
  `docs/gitsylva-s.svg`; ambos continuam não versionados e devem ser revistos,
  testados e commitados juntos se fizerem parte da release.
- Alguns documentos de auditoria ainda afirmam que o repositório GitHub é
  privado; ele estava público na verificação de 23/07/2026.

Marcar auditorias antigas como históricas para não orientar agentes futuros com
estado obsoleto. Não considerar o README corrigido até o commit incluir também
os assets e links que ele referencia.

### P2.7. Clippy estrito está vermelho

```text
src-tauri/src/git/repo.rs:148  unnecessary_sort_by
src-tauri/src/git/blame.rs:34 manual_strip
```

As sugestões automáticas são pequenas (`sort_by_key` e `strip_prefix`), mas
devem ser aplicadas com testes. O gate final deve ser:

```powershell
cd src-tauri
cargo clippy --all-targets -- -D warnings
```

## Itens P3

### P3.1. O mapa global de locks cresce durante toda a sessão

`src-tauri/src/git/mod.rs:60-70` mantém um `Arc<Mutex<()>>` para cada path já
usado e nunca remove entradas. Normalmente o impacto é mínimo, mas uma sessão
que percorra milhares de destinos mantém strings/locks até fechar a app.

### P3.2. Updates de dependências disponíveis

O audit de segurança está limpo. Existem updates compatíveis pequenos para
React, React DOM, React Query, Vite, plugin React, dialog, ESLint e
typescript-eslint. TypeScript 7 e `@types/node` 26 são upgrades maiores e devem
ficar fora desta release salvo necessidade concreta.

Atualizar separadamente, nunca misturado com correções de release, e repetir
todos os gates.

## Pontos fortes a preservar

- `cargo test`: 64 testes reais, incluindo init/open, stage/unstage/discard,
  branches, tags, stash, sync, conflitos e parsing.
- 430 testes frontend cobrindo componentes, stores, i18n e integrações; apenas
  um está vermelho.
- Operações Git pesadas usam `spawn_blocking`; mutações são serializadas por
  repositório, reduzindo conflitos de `.git/index.lock`.
- `run_git` passa argumentos sem shell e usa `--` nos paths sensíveis; não foi
  encontrada command injection direta.
- `GIT_TERMINAL_PROMPT=0` e `GIT_EDITOR=true` evitam bloqueios interativos
  comuns.
- Diffs têm cap de IPC, paginação, proteção contra staging de hunk truncado e
  cache curto para payloads grandes.
- Error boundaries, captura de erros frontend e logs Rust dão diagnóstico de
  campo.
- CSP Tauri é restrita e as capabilities são limitadas à janela principal,
  diálogo, updater e restart.
- Updater usa assinatura e o endpoint público atual responde com manifest
  válido.
- Modais e confirmações já têm focus trap, Escape, foco inicial seguro e
  restauração de foco.
- Ações destrutivas relevantes apresentam confirmação e distinguem caminhos
  forçados.
- I18n PT/EN tem paridade tipada e testes contra strings portuguesas
  hardcoded.
- O build usa fontes locais, sem dependência de CDN.
- `npm audit` encontrou zero vulnerabilidades conhecidas.
- Não foram encontrados segredos/chaves privadas versionados; `.gitignore`
  exclui chaves e o script lê a privada fora do repositório.

## Smoke test manual obrigatório na janela Tauri

Executar numa cópia descartável de repositórios, nunca em trabalho importante.

1. Instalação limpa: onboarding completo com rato e teclado; fechar, minimizar e
   maximizar em todas as fases.
2. Abrir repo existente, pasta sem Git, repo vazio e subpasta de repo.
3. Clonar e criar repo; testar nomes inválidos e destino já existente.
4. Alternar entre vários repos, fechar tabs/rail e reabrir recentes.
5. Histórico: scroll longo, pesquisa, branch filter, detalhes, diff unificado e
   lado a lado, carregar mais e diff completo.
6. Working copy: stage/unstage ficheiro e hunk, amend, commit vazio/bloqueado,
   discard de tracked/untracked com confirmação.
7. Branches: criar, checkout com WC suja, rename, merge/rebase com e sem
   conflito, delete normal e force delete.
8. Stash: criar com staged/untracked, apply, pop e delete.
9. Tags: criar anotada/leve e apagar.
10. Sync: sem remote, sem upstream, auth falhada, offline, timeout, fetch,
    pull FF/merge/rebase, push de uma e várias branches.
11. Conflitos: resolver ours/theirs/manual, continuar e abortar.
12. Definições: quatro temas, densidades, layout tabs/rail, animações, idioma,
    atalhos duplicados e reset.
13. Tamanho mínimo `900×560`, `1360×800`, escala Windows 125%/150% e texto
    comprido em PT/EN.
14. Só teclado: Tab/Shift+Tab/Enter/Espaço/Escape e atalhos globais.
15. Atualização real de uma instalação `0.1.0` para a nova versão.
16. Confirmar logs sem panics, erros não tratados ou paths/URLs sensíveis.

## Ordem sugerida para o próximo agente

1. Criar branch de release a partir do commit que o utilizador aprovar.
2. Reproduzir todos os P0/P1 no novo HEAD.
3. Resolver versionamento e escolher o âmbito das funcionalidades “Em breve”.
4. Perfilar/corrigir o teste e o render de diff; obter suite verde.
5. Corrigir a navegação por teclado usando os componentes acessíveis existentes.
6. Corrigir Clippy e metadados/README/licença.
7. Endurecer paths e política de operações de rede.
8. Implementar/validar pipeline de release e updater.
9. Executar todos os gates e o smoke test Tauri.
10. Só depois criar tag e publicar.

## Gates finais de publicação

```powershell
npm ci
npm audit
npm run lint
npm test
npm run build

cd src-tauri
cargo test
cargo clippy --all-targets -- -D warnings
cargo check --release
cd ..

npx tauri build --no-bundle
powershell -File scripts/build-installer.ps1
```

Além de exit 0 em todos os comandos:

- worktree limpo;
- versões/tag/assets/manifest iguais;
- assinatura do updater verificada;
- smoke test documentado numa instalação limpa;
- teste de atualização da versão anterior aprovado;
- nenhum P0/P1 aberto sem aceitação explícita do responsável pela release.
