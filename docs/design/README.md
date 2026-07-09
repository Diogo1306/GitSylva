# GitSylva

**Um cliente Git de desktop onde o histórico é uma árvore viva.**

O produto é a **janela da app** (1440×880). Tudo o que está à volta — a secretária, os ramos nos cantos e as folhas a cair — é cenário do mockup, usado para apresentar o design (e que inspirou o fundo do ecrã de entrada).

---

## Ficheiros do projeto

| Ficheiro | O que é |
|---|---|
| `GitSylva Floresta.dc.html` | A app completa: onboarding, histórico, cópia de trabalho, stashes, definições |
| `GitSylva Logos.dc.html` | Identidade: o S-árvore, tipografia do wordmark, logo em cada tema e escalas do ícone |

---

## Identidade

- **Logo**: o "S" de gitSylva é uma árvore desenhada como branch de git — tronco afilado (grosso na base, fino nas pontas), raízes na baseline, copa no topo com folhas e **nós de commit**. Adapta-se ao estilo de árvore escolhido (folhas, flores sakura, palmas ou nós).
- **Wordmark**: `git` + S-árvore + `ylva` em **Space Grotesk**; o S tem escala de capital (~80% do corpo) e assenta na linha de base.
- **Splash**: o nome aparece, as letras ramificam a partir do S… e saltam fora, ficando só o S que cresce no login.

## Onboarding (primeira execução)

1. **Splash** — só o wordmark, letras a ramificar e a saltar.
2. **Login** — árvore à esquerda, conta à direita: GitHub / GitLab / Bitbucket ou continuar local.
3. **Personalização** (opcional, com Saltar) — tema em retângulos de cor, estilo de árvore com ícones, cor das branches, e novidades em baralho de 3 cartas.
4. **Plantar e entrar** — a árvore completa a copa e a app abre. Rever em: Definições → Contas → "Rever ecrã de boas-vindas".

## Temas

- **Batman** *(padrão)* — grafite escuro, verde na main.
- **Clássico** — branco & preto, sóbrio.
- **Nipon** — branco quente & sakura.
- **Git Classic** — preto profundo com os verdes/azuis/laranjas vivos do mundo git.

Cada tema tem 4 cores de destaque próprias. A troca de tema faz um flash suave (desativável).

## Estilos de árvore (semi-tema)

- **Clássica** — folhas de carvalho nas pontas dos commits.
- **Sakura** — flores de cerejeira, tronco de madeira rosada.
- **Tropical** — copas de palmeira com cocos, tronco castanho.
- **Ramificação** — git clássico: grafo limpo sem folhas, **main neutra (preto/branco)** e nós de commit; no logo as pontas viram nós.

## Cor das branches

As linhas que saem da main têm paleta própria (a main mantém a cor do tronco):

- **Auto** — par **vivo** afinado a cada tema.
- **Oceano** (azul+ciano) · **Pôr-do-sol** (laranja+rosa) · **Fogo** (vermelho+âmbar) · **Neon** (verde+magenta) · **Outono** (terracota+dourado) · **Uva** (roxo+rosa).
- Todas com versão clara/escura e distinguíveis à vista.

## Funcionalidades

- **Histórico** — grafo-árvore com curvas de merge, chips de branch/tag, avatares, detalhe do commit com arquivos e diff.
- **Cópia de trabalho** — staging por arquivo, preparar tudo, descartar (com confirmação), mensagem e commit real no grafo.
- **Stashes** — criar (com opção de incluir preparadas), aplicar, descartar.
- **Ações git** — Pull/Push com listas de commits, Fetch com spinner, Branch, Merge, Tag, terminal.
- **Vários repositórios** — abas em cima ou barra lateral; **grupos** com nome e cor (fechar/abrir, fechar grupo inteiro).
- **Pesquisa total ⌘K** — branches, commits, arquivos e repositórios.
- **Definições** — navegação lateral com scroll-spy: Aparência, Contas (OAuth + password), Git, Commits, Push & Pull, **Atalhos regraváveis**, **Chaves SSH** (gerar, testar ligação, assinar commits), Notificações com preview, Idioma, Avançado (fonte, LFS, hooks), Limpeza.
- **Notificações** — surgem abraçadas por uma vinha que floresce conforme o estilo de árvore.

## Animações (leves, com interruptor)

- Folha que cai dentro da janela ao trocar de repo, ao atualizar e ao fazer commit.
- Grafo que "cresce" quando entra um commit novo; folhas/flores brotam.
- Flash suave na troca de tema; modais e toasts com entrada animada.
- **Definições → Aparência → Animações decorativas** desliga tudo o que é decorativo.

## Próximos passos sugeridos

- Ecrã de resolução de conflitos (3-way merge).
- Rebase interativo drag-and-drop no grafo.
- Vista blame e diff lado-a-lado.
- Tema automático (seguir o sistema) e exportar/importar temas.
- Inglês completo (o seletor de idioma já existe).
