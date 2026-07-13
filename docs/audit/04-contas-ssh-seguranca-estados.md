# Anexo 4 — Contas/Auth · SSH · Segurança · Estados globais (3.16, 3.17, 3.21)

## Resumo: SEM P0 de segurança
Sem credenciais/tokens armazenados em lado nenhum (localStorage só tem paths/tema/flags); sem shell/command injection (`run_git` usa args como array, `mod.rs:27-47`); sem `dangerouslySetInnerHTML` (0 ocorrências — highlight/diff/mensagens tudo JSX escapado, `highlight.tsx:18-33`, `DiffLines.tsx:47,67`); regex do highlighter sem ReDoS; sem telemetria.

## Contas (3.16)
- **✅** Stubs honestos em 3 sítios: Onboarding (badge "Em breve" + toast, `Onboarding.tsx:75-115`), Settings›Contas (`Settings.tsx:87-89`), RepoPicker›Remoto (`RepoPicker.tsx:232-242`). App 100% funcional sem conta.
- **A1 🟡 P2 (preventivo)** — Quando a auth chegar: usar keyring/Windows Credential Manager, nunca localStorage. Registar como requisito.

## SSH (3.17)
- **✅** Stub honesto (`Settings.tsx:100-102`); sem paths Unix hardcoded (0 refs a `~/.ssh`/`id_rsa`).
- **A2 🟡 P2** — Mensagens de auth de rede são stderr cru inglês ("could not read Username… terminal prompts disabled") — fail-fast correto mas pouco acionável. Mapear erros comuns → PT com sugestão.

## Segurança — hardening
- **A3 ⚠️ P2** — Argument injection: operandos controlados sem `--` separador — `branches.rs:59,72,74,82,89,98`; `rewrite.rs:13,19,26`; `repo.rs:61`. Nome de branch/URL começado por `-` interpretado como opção git (ex.: `--upload-pack=`). Corrigir: inserir `"--"` antes do 1.º operando.
- **A4 ⚠️ P2** — CSP `null` (`tauri.conf.json:26`) + comandos `git::*` sem permission-gating (`capabilities/default.json` só core/window/dialog). Sem XSS atual, mas defense-in-depth: definir CSP explícita.
- **A5 🟡 P3** — Paths do frontend não validados no Rust (só `open_repo` valida) — aceitável em app local, registar.
- **A6 🧹 P3** — `identifier: com.tauri.dev` (`tauri.conf.json:5`) — duplicado do finding B5.

## Estados globais (3.21)
- **A7 🟠 P1** — **Nenhum Error Boundary** (0 ocorrências): um throw em qualquer componente (ex.: `graphRows` com dados invulgares) → ecrã branco total. `main.tsx:28-34` só StrictMode+QueryClientProvider; Suspense não apanha erros. Adicionar boundary de topo com fallback + "recarregar/fechar repo".
- **A8 🟡 P2** — Repo apagado do disco: degrada sem crash mas sem aviso/recuperação (queries falham, badges 0, tab morta fica — `App.tsx:22-23`). Duplicado parcial de R3.
- **A9 🟡 P2** — Stashes sem estado de erro: `retry:false` + só `{data,isLoading}` (`Stashes.tsx:10-13`) → erro mascarado como "Sem stashes." (enganador).
- **A10 🟡 P3** — Detalhe de commit sem estado de erro: erro cai em "Sem alterações textuais." + "+0/−0/0 arquivos" (`History.tsx:74-75,155-161`).
- **A11 🟡 P3** — Titlebar/ActionBar sem sinal de erro em useStatus/useSyncStatus (badges 0 silenciosos — `Titlebar.tsx:86,90`, `ActionBar.tsx:68-69`).
- **✅** History loading/error/empty completos (`History.tsx:269-271`); WorkingCopy idem (`:128-129,252,311-334`); modais com busy+erro inline+empty (`Modals.tsx`); sem spinners infinitos (retry:false + GIT_TERMINAL_PROMPT=0); offline com toast decente (`Titlebar.tsx:95-102`).
